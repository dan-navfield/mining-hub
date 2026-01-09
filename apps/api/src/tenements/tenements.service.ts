import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface TenementQuery {
  page?: number;
  limit?: number;
  jurisdiction?: string;
  status?: string;
  type?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class TenementsService {
  private readonly logger = new Logger(TenementsService.name);

  constructor(private supabase: SupabaseService) {}

  async findMany(query: TenementQuery): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 50,
      jurisdiction,
      status,
      type,
      search,
      sortBy = 'last_sync_at',
      sortOrder = 'desc'
    } = query;

    // Validate and sanitize inputs
    const validatedPage = Math.max(1, parseInt(String(page)));
    const validatedLimit = Math.min(200, Math.max(1, parseInt(String(limit))));
    const offset = (validatedPage - 1) * validatedLimit;

    try {
      // Build the query
      let supabaseQuery = this.supabase.getServiceRoleClient()
        .from('tenements')
        .select('*', { count: 'exact' });

      // Apply filters
      if (jurisdiction) {
        supabaseQuery = supabaseQuery.eq('jurisdiction', jurisdiction);
      }
      
      if (status) {
        supabaseQuery = supabaseQuery.eq('status', status);
      }
      
      if (type) {
        supabaseQuery = supabaseQuery.eq('type', type);
      }
      
      if (search) {
        supabaseQuery = supabaseQuery.or(`number.ilike.%${search}%,holder_name.ilike.%${search}%`);
      }

      // Apply sorting
      const validSortFields = ['number', 'type', 'status', 'holder_name', 'expiry_date', 'area_ha', 'last_sync_at'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'last_sync_at';
      supabaseQuery = supabaseQuery.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      supabaseQuery = supabaseQuery.range(offset, offset + validatedLimit - 1);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        this.logger.error('Error fetching tenements:', error);
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / validatedLimit);

      return {
        data: data || [],
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages,
          hasNext: validatedPage < totalPages,
          hasPrev: validatedPage > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error in findMany:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('tenements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error(`Error fetching tenement ${id}:`, error);
      throw error;
    }
  }

  async getStatsByJurisdiction() {
    try {
      const stats: Record<string, number> = {};
      const allJurisdictions = ['WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS'];
      
      // Count records for each jurisdiction separately
      for (const jurisdiction of allJurisdictions) {
        const { count, error } = await this.supabase.getServiceRoleClient()
          .from('tenements')
          .select('*', { count: 'exact', head: true })
          .eq('jurisdiction', jurisdiction);

        if (error) {
          this.logger.error(`Error counting ${jurisdiction} tenements:`, error);
          stats[jurisdiction] = 0;
        } else {
          stats[jurisdiction] = count || 0;
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Error getting tenement stats:', error);
      return {};
    }
  }
}
