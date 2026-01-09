import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { 
  ShireRates, 
  CreateShireRatesRequest, 
  UpdateShireRatesRequest, 
  ShireRatesQuery,
  ShireRatesStats,
  OCRResult 
} from '@mining-hub/types';

@Injectable()
export class ShireRatesService {
  private readonly logger = new Logger(ShireRatesService.name);

  constructor(private supabase: SupabaseService) {}

  async create(createData: CreateShireRatesRequest, userId: string): Promise<ShireRates> {
    try {
      // First create the shire rates record
      const { data: shireRatesData, error: shireRatesError } = await this.supabase.getServiceRoleClient()
        .from('shire_rates')
        .insert({
          document_name: createData.documentName,
          document_type: createData.documentType,
          document_url: createData.documentUrl,
          document_size_bytes: createData.documentSizeBytes,
          client_name: createData.clientName,
          tenement_id: createData.tenementId,
          property_reference: createData.propertyReference,
          notes: createData.notes,
          tags: createData.tags,
          created_by: userId,
        })
        .select()
        .single();

      if (shireRatesError) {
        this.logger.error('Error creating shire rates record:', shireRatesError);
        throw new BadRequestException('Failed to create shire rates record');
      }

      // Create associated action/workflow item
      const actionTitle = `Process Shire Rates: ${createData.documentName}`;
      const actionDescription = `OCR processing and data extraction for ${createData.clientName || 'client'} rates document`;
      
      const { data: actionData, error: actionError } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .insert({
          title: actionTitle,
          description: actionDescription,
          status: 'pending',
          action_type: 'shire_rates',
          tenement_id: createData.tenementId,
          shire_rates_id: shireRatesData.id,
          created_by: userId,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        })
        .select()
        .single();

      if (actionError) {
        this.logger.warn('Failed to create associated action:', actionError);
        // Don't fail the whole operation if action creation fails
      } else {
        // Update shire rates record with action_id
        await this.supabase.getServiceRoleClient()
          .from('shire_rates')
          .update({ action_id: actionData.id })
          .eq('id', shireRatesData.id);
        
        shireRatesData.action_id = actionData.id;
      }

      return this.mapToShireRates(shireRatesData);
    } catch (error) {
      this.logger.error('Error in create:', error);
      throw error;
    }
  }

  async findAll(query: ShireRatesQuery, userId: string): Promise<{ data: ShireRates[]; total: number }> {
    try {
      let queryBuilder = this.supabase.getServiceRoleClient()
        .from('shire_rates')
        .select('*', { count: 'exact' })
        .eq('created_by', userId);

      // Apply filters
      if (query.clientName) {
        queryBuilder = queryBuilder.ilike('client_name', `%${query.clientName}%`);
      }

      if (query.shireName) {
        queryBuilder = queryBuilder.ilike('shire_name', `%${query.shireName}%`);
      }

      if (query.paymentStatus) {
        queryBuilder = queryBuilder.eq('payment_status', query.paymentStatus);
      }

      if (query.financialYear) {
        queryBuilder = queryBuilder.eq('financial_year', query.financialYear);
      }

      if (query.dueDateFrom) {
        queryBuilder = queryBuilder.gte('due_date', query.dueDateFrom);
      }

      if (query.dueDateTo) {
        queryBuilder = queryBuilder.lte('due_date', query.dueDateTo);
      }

      if (query.tags && query.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', query.tags);
      }

      if (query.search) {
        queryBuilder = queryBuilder.or(`
          document_name.ilike.%${query.search}%,
          client_name.ilike.%${query.search}%,
          shire_name.ilike.%${query.search}%,
          property_address.ilike.%${query.search}%,
          assessment_number.ilike.%${query.search}%
        `);
      }

      // Apply sorting
      const sortBy = query.sortBy || 'created_at';
      const sortOrder = query.sortOrder || 'desc';
      queryBuilder = queryBuilder.order(this.mapSortField(sortBy), { ascending: sortOrder === 'asc' });

      // Apply pagination
      const limit = Math.min(query.limit || 50, 100);
      const offset = query.offset || 0;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        this.logger.error('Error fetching shire rates:', error);
        throw new BadRequestException('Failed to fetch shire rates');
      }

      return {
        data: data?.map(item => this.mapToShireRates(item)) || [],
        total: count || 0,
      };
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<ShireRates> {
    try {
      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('shire_rates')
        .select('*')
        .eq('id', id)
        .eq('created_by', userId)
        .single();

      if (error || !data) {
        throw new NotFoundException('Shire rates record not found');
      }

      return this.mapToShireRates(data);
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  async update(id: string, updateData: UpdateShireRatesRequest, userId: string): Promise<ShireRates> {
    try {
      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('shire_rates')
        .update({
          shire_name: updateData.shireName,
          property_address: updateData.propertyAddress,
          property_description: updateData.propertyDescription,
          assessment_number: updateData.assessmentNumber,
          property_owner: updateData.propertyOwner,
          land_value: updateData.landValue,
          capital_improved_value: updateData.capitalImprovedValue,
          annual_value: updateData.annualValue,
          general_rates: updateData.generalRates,
          water_rates: updateData.waterRates,
          sewerage_rates: updateData.sewerageRates,
          garbage_rates: updateData.garbageRates,
          other_charges: updateData.otherCharges,
          total_rates: updateData.totalRates,
          due_date: updateData.dueDate,
          payment_date: updateData.paymentDate,
          payment_status: updateData.paymentStatus,
          payment_method: updateData.paymentMethod,
          rating_period_start: updateData.ratingPeriodStart,
          rating_period_end: updateData.ratingPeriodEnd,
          financial_year: updateData.financialYear,
          client_name: updateData.clientName,
          client_id: updateData.clientId,
          tenement_id: updateData.tenementId,
          property_reference: updateData.propertyReference,
          notes: updateData.notes,
          tags: updateData.tags,
          metadata: updateData.metadata,
        })
        .eq('id', id)
        .eq('created_by', userId)
        .select()
        .single();

      if (error || !data) {
        throw new NotFoundException('Shire rates record not found or update failed');
      }

      return this.mapToShireRates(data);
    } catch (error) {
      this.logger.error('Error in update:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase.getServiceRoleClient()
        .from('shire_rates')
        .delete()
        .eq('id', id)
        .eq('created_by', userId);

      if (error) {
        this.logger.error('Error deleting shire rates record:', error);
        throw new BadRequestException('Failed to delete shire rates record');
      }
    } catch (error) {
      this.logger.error('Error in remove:', error);
      throw error;
    }
  }

  async updateOCRStatus(id: string, status: string, confidence?: number, rawText?: string): Promise<void> {
    try {
      const { error } = await this.supabase.getServiceRoleClient()
        .from('shire_rates')
        .update({
          ocr_status: status,
          ocr_confidence: confidence,
          raw_ocr_text: rawText,
        })
        .eq('id', id);

      if (error) {
        this.logger.error('Error updating OCR status:', error);
        throw new BadRequestException('Failed to update OCR status');
      }
    } catch (error) {
      this.logger.error('Error in updateOCRStatus:', error);
      throw error;
    }
  }

  async updateWithOCRData(id: string, ocrResult: OCRResult): Promise<ShireRates> {
    try {
      const updateData = {
        ocr_status: 'completed',
        ocr_confidence: ocrResult.confidence,
        raw_ocr_text: ocrResult.text,
        shire_name: ocrResult.extractedData.shireName,
        property_address: ocrResult.extractedData.propertyAddress,
        assessment_number: ocrResult.extractedData.assessmentNumber,
        property_owner: ocrResult.extractedData.propertyOwner,
        land_value: ocrResult.extractedData.landValue,
        capital_improved_value: ocrResult.extractedData.capitalImprovedValue,
        annual_value: ocrResult.extractedData.annualValue,
        general_rates: ocrResult.extractedData.generalRates,
        water_rates: ocrResult.extractedData.waterRates,
        sewerage_rates: ocrResult.extractedData.sewerageRates,
        garbage_rates: ocrResult.extractedData.garbageRates,
        other_charges: ocrResult.extractedData.otherCharges,
        total_rates: ocrResult.extractedData.totalRates,
        due_date: ocrResult.extractedData.dueDate,
        rating_period_start: ocrResult.extractedData.ratingPeriodStart,
        rating_period_end: ocrResult.extractedData.ratingPeriodEnd,
        financial_year: ocrResult.extractedData.financialYear,
        metadata: { ocrRawFields: ocrResult.rawFields },
      };

      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('shire_rates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        throw new BadRequestException('Failed to update with OCR data');
      }

      // Update associated action status
      if (data.action_id) {
        await this.updateActionStatus(data.action_id, 'in_progress', 'OCR processing completed successfully');
      }

      return this.mapToShireRates(data);
    } catch (error) {
      this.logger.error('Error in updateWithOCRData:', error);
      throw error;
    }
  }

  async getStats(userId: string): Promise<ShireRatesStats> {
    try {
      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('shire_rates')
        .select('payment_status, shire_name, financial_year, total_rates, due_date')
        .eq('created_by', userId);

      if (error) {
        this.logger.error('Error fetching stats:', error);
        throw new BadRequestException('Failed to fetch statistics');
      }

      const stats: ShireRatesStats = {
        total: data.length,
        byPaymentStatus: {},
        byShire: {},
        byFinancialYear: {},
        totalValue: 0,
        averageValue: 0,
        upcomingDue: 0,
        overdue: 0,
      };

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      data.forEach(item => {
        // Count by payment status
        stats.byPaymentStatus[item.payment_status] = (stats.byPaymentStatus[item.payment_status] || 0) + 1;

        // Count by shire
        if (item.shire_name) {
          stats.byShire[item.shire_name] = (stats.byShire[item.shire_name] || 0) + 1;
        }

        // Count by financial year
        if (item.financial_year) {
          stats.byFinancialYear[item.financial_year] = (stats.byFinancialYear[item.financial_year] || 0) + 1;
        }

        // Calculate totals
        if (item.total_rates) {
          stats.totalValue += item.total_rates;
        }

        // Check due dates
        if (item.due_date) {
          const dueDate = new Date(item.due_date);
          if (dueDate < now && item.payment_status === 'unpaid') {
            stats.overdue++;
          } else if (dueDate <= thirtyDaysFromNow && item.payment_status === 'unpaid') {
            stats.upcomingDue++;
          }
        }
      });

      stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

      return stats;
    } catch (error) {
      this.logger.error('Error in getStats:', error);
      throw error;
    }
  }

  private mapToShireRates(data: any): ShireRates {
    return {
      id: data.id,
      documentName: data.document_name,
      documentType: data.document_type,
      documentUrl: data.document_url,
      documentSizeBytes: data.document_size_bytes,
      ocrStatus: data.ocr_status,
      ocrConfidence: data.ocr_confidence,
      rawOcrText: data.raw_ocr_text,
      shireName: data.shire_name,
      propertyAddress: data.property_address,
      propertyDescription: data.property_description,
      assessmentNumber: data.assessment_number,
      propertyOwner: data.property_owner,
      landValue: data.land_value,
      capitalImprovedValue: data.capital_improved_value,
      annualValue: data.annual_value,
      generalRates: data.general_rates,
      waterRates: data.water_rates,
      sewerageRates: data.sewerage_rates,
      garbageRates: data.garbage_rates,
      otherCharges: data.other_charges,
      totalRates: data.total_rates,
      dueDate: data.due_date,
      paymentDate: data.payment_date,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method,
      ratingPeriodStart: data.rating_period_start,
      ratingPeriodEnd: data.rating_period_end,
      financialYear: data.financial_year,
      clientName: data.client_name,
      clientId: data.client_id,
      tenementId: data.tenement_id,
      propertyReference: data.property_reference,
      actionId: data.action_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      notes: data.notes,
      tags: data.tags,
      metadata: data.metadata,
    };
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      dueDate: 'due_date',
      createdAt: 'created_at',
      totalRates: 'total_rates',
      shireName: 'shire_name',
    };
    return fieldMap[sortBy] || 'created_at';
  }

  private async updateActionStatus(actionId: string, status: string, description?: string): Promise<void> {
    try {
      const updateData: any = { status };
      if (description) {
        updateData.description = description;
      }

      const { error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .update(updateData)
        .eq('id', actionId);

      if (error) {
        this.logger.warn('Failed to update action status:', error);
        // Don't throw error as this is a secondary operation
      }
    } catch (error) {
      this.logger.warn('Error updating action status:', error);
      // Don't throw error as this is a secondary operation
    }
  }
}
