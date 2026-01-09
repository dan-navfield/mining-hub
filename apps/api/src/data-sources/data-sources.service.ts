import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { WADataSourceService } from './providers/wa.service';
import { NSWDataSourceService } from './providers/nsw.service';
import { VICDataSourceService } from './providers/vic.service';
import { NTDataSourceService } from './providers/nt.service';
import { QLDDataSourceService } from './providers/qld.service';
import { TASDataSourceService } from './providers/tas.service';

export interface DataSourceProvider {
  getJurisdiction(): string;
  checkStatus(): Promise<{ status: 'Active' | 'Inactive' | 'Error'; error?: string }>;
  fetchTenements(): Promise<TenementData[]>;
}

export interface TenementData {
  number: string;
  type: string;
  status: string;
  holderName?: string;
  applicationDate?: string;
  grantDate?: string;
  expiryDate?: string;
  anniversaryDate?: string;
  markoutDate?: string;
  areaHa?: number;
  section29Flag?: boolean;
}

@Injectable()
export class DataSourcesService {
  private readonly logger = new Logger(DataSourcesService.name);
  private providers: Map<string, DataSourceProvider> = new Map();

  constructor(
    private supabase: SupabaseService,
    private waService: WADataSourceService,
    private nswService: NSWDataSourceService,
    private vicService: VICDataSourceService,
    private ntService: NTDataSourceService,
    private qldService: QLDDataSourceService,
    private tasService: TASDataSourceService,
  ) {
    // Register providers
    this.providers.set('WA', this.waService);
    this.providers.set('NSW', this.nswService);
    this.providers.set('VIC', this.vicService);
    this.providers.set('NT', this.ntService);
    this.providers.set('QLD', this.qldService);
    this.providers.set('TAS', this.tasService);
  }

  async getAllDataSources() {
    const { data, error } = await this.supabase.getServiceRoleClient()
      .from('data_sources')
      .select('*')
      .order('jurisdiction', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getDataSourcesByJurisdiction(jurisdiction: string) {
    const { data, error } = await this.supabase.getServiceRoleClient()
      .from('data_sources')
      .select('*')
      .eq('jurisdiction', jurisdiction)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async updateDataSourceStatus(id: string, status: 'Active' | 'Inactive' | 'Error' | 'Maintenance', errorMsg?: string) {
    const updateData: any = {
      status,
      last_error: errorMsg,
    };

    if (status === 'Active') {
      updateData.last_sync_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase.getServiceRoleClient()
      .from('data_sources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async checkAllDataSourcesStatus() {
    const { data: dataSources, error } = await this.supabase.getServiceRoleClient()
      .from('data_sources')
      .select('*')
      .eq('is_enabled', true);

    if (error) throw error;

    const results = [];

    for (const dataSource of dataSources) {
      try {
        const provider = this.providers.get(dataSource.jurisdiction);
        if (!provider) {
          await this.updateDataSourceStatus(dataSource.id, 'Error', 'No provider available');
          results.push({
            id: dataSource.id,
            name: dataSource.name,
            jurisdiction: dataSource.jurisdiction,
            status: 'Error',
            error: 'No provider available',
          });
          continue;
        }

        const statusCheck = await provider.checkStatus();
        await this.updateDataSourceStatus(dataSource.id, statusCheck.status, statusCheck.error);
        
        results.push({
          id: dataSource.id,
          name: dataSource.name,
          jurisdiction: dataSource.jurisdiction,
          status: statusCheck.status,
          error: statusCheck.error,
        });
      } catch (error) {
        this.logger.error(`Error checking status for ${dataSource.name}:`, error);
        await this.updateDataSourceStatus(dataSource.id, 'Error', error.message);
        results.push({
          id: dataSource.id,
          name: dataSource.name,
          jurisdiction: dataSource.jurisdiction,
          status: 'Error',
          error: error.message,
        });
      }
    }

    return results;
  }

  async syncDataSource(jurisdiction: string) {
    const provider = this.providers.get(jurisdiction);
    if (!provider) {
      throw new Error(`No provider available for jurisdiction: ${jurisdiction}`);
    }

    const { data: dataSource, error } = await this.supabase.getServiceRoleClient()
      .from('data_sources')
      .select('*')
      .eq('jurisdiction', jurisdiction)
      .eq('is_enabled', true)
      .single();

    if (error || !dataSource) {
      throw new Error(`No enabled data source found for jurisdiction: ${jurisdiction}`);
    }

    try {
      // Update status to indicate sync is starting
      await this.updateDataSourceStatus(dataSource.id, 'Active');

      // Fetch tenements from the provider
      const tenements = await provider.fetchTenements();
      
      // Import tenements
      const importResult = await this.importTenements(tenements, jurisdiction);
      
      // Update last sync time
      await this.supabase.getServiceRoleClient()
        .from('data_sources')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', dataSource.id);

      return {
        success: true,
        imported: importResult.imported,
        errors: importResult.errors,
      };
    } catch (error) {
      this.logger.error(`Error syncing ${jurisdiction}:`, error);
      await this.updateDataSourceStatus(dataSource.id, 'Error', error.message);
      throw error;
    }
  }

  private async importTenements(tenements: TenementData[], jurisdiction: string) {
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    // Process in batches of 500 for better performance with upserts
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < tenements.length; i += batchSize) {
      batches.push(tenements.slice(i, i + batchSize));
    }

    this.logger.log(`📥 Upserting ${tenements.length} tenements in ${batches.length} batches`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        let batchData = batch.map(tenement => ({
          jurisdiction,
          number: tenement.number,
          type: tenement.type,
          status: tenement.status,
          holder_name: tenement.holderName,
          application_date: tenement.applicationDate,
          grant_date: tenement.grantDate,
          expiry_date: tenement.expiryDate,
          anniversary_date: tenement.anniversaryDate,
          markout_date: tenement.markoutDate,
          area_ha: tenement.areaHa,
          section29_flag: tenement.section29Flag || false,
          last_sync_at: new Date().toISOString(),
        }));

        // Remove duplicates within the batch to prevent ON CONFLICT errors
        batchData = batchData.filter((item, index, self) => 
          index === self.findIndex(t => t.jurisdiction === item.jurisdiction && t.number === item.number)
        );

        // Use PostgreSQL's ON CONFLICT for proper upsert
        const { error } = await this.supabase.getServiceRoleClient()
          .from('tenements')
          .upsert(batchData, { 
            onConflict: 'jurisdiction,number'
          });

        if (error) {
          this.logger.error(`❌ Batch ${batchIndex + 1} failed: ${error.message}`);
          errors.push(`Batch ${batchIndex + 1}: ${error.message}`);
        } else {
          imported += batch.length;
          this.logger.log(`✅ Batch ${batchIndex + 1}/${batches.length} upserted ${batch.length} records`);
        }
      } catch (error) {
        this.logger.error(`❌ Batch ${batchIndex + 1} error: ${error.message}`);
        errors.push(`Batch ${batchIndex + 1}: ${error.message}`);
      }
    }

    this.logger.log(`🎉 Upsert complete: ${imported} records processed, ${errors.length} errors`);
    return { 
      imported, // Total processed records (upserted)
      errors 
    };
  }

  async getTenementStats() {
    try {
      // Get all jurisdictions first
      const { data: jurisdictions, error: jurisdictionsError } = await this.supabase.getServiceRoleClient()
        .from('tenements')
        .select('jurisdiction')
        .limit(1000);

      if (jurisdictionsError) {
        throw jurisdictionsError;
      }

      // Get unique jurisdictions
      const uniqueJurisdictions = [...new Set(jurisdictions.map((row: any) => row.jurisdiction))];
      
      // Count records for each jurisdiction
      const stats: Record<string, number> = {};
      
      for (const jurisdiction of uniqueJurisdictions) {
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
