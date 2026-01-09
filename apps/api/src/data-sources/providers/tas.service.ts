import { Injectable, Logger } from '@nestjs/common';
import { DataSourceProvider, TenementData } from '../data-sources.service';
import axios from 'axios';

@Injectable()
export class TASDataSourceService implements DataSourceProvider {
  private readonly logger = new Logger(TASDataSourceService.name);
  
  private readonly MRT_REST_BASE = 'https://data.stategrowth.tas.gov.au/ags/rest/services/MRT/TenementsWFS/MapServer';
  
  getJurisdiction(): string {
    return 'TAS';
  }

  async checkStatus(): Promise<{ status: 'Active' | 'Inactive' | 'Error'; error?: string }> {
    try {
      const response = await axios.get(`${this.MRT_REST_BASE}?f=json`, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (response.status === 200 && response.data.layers) {
        return { status: 'Active' };
      } else {
        return { status: 'Error', error: 'Tasmania MRT service not accessible' };
      }
    } catch (error) {
      this.logger.error('Tasmania data source status check failed:', error);
      return { status: 'Error', error: error.message };
    }
  }

  async fetchTenements(): Promise<TenementData[]> {
    try {
      this.logger.log('🔄 Starting Tasmania tenement fetch from MRT ArcGIS REST...');
      
      const allTenements: TenementData[] = [];
      
      // Fetch current licences (exploration/retention)
      const licences = await this.fetchFromLayer(36, 'Exploration Licence');
      allTenements.push(...licences);
      
      // Fetch current leases (mining leases)
      const leases = await this.fetchFromLayer(44, 'Mining Lease');
      allTenements.push(...leases);
      
      this.logger.log(`✅ Successfully fetched ${allTenements.length} tenements from Tasmania MRT`);
      return allTenements;
      
    } catch (error) {
      this.logger.error('❌ Failed to fetch Tasmania tenements:', error);
      throw error;
    }
  }

  private async fetchFromLayer(layerId: number, tenementType: string): Promise<TenementData[]> {
    try {
      this.logger.log(`📥 Fetching ${tenementType} data from layer ${layerId}`);
      
      let allTenements: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${this.MRT_REST_BASE}/${layerId}/query`, {
          params: {
            where: '1=1',
            outFields: '*',
            f: 'json',
            resultRecordCount: batchSize,
            resultOffset: offset,
          },
          timeout: 30000,
        });

        if (!response.data || !response.data.features) {
          this.logger.warn(`⚠️ No features found in layer ${layerId} at offset ${offset}`);
          break;
        }

        const features = response.data.features;
        allTenements.push(...features);
        
        this.logger.log(`📥 Fetched ${features.length} records from layer ${layerId} (offset: ${offset})`);
        
        // Check if we got fewer records than requested (end of data)
        if (features.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;
        }
      }

      this.logger.log(`📊 Total fetched from layer ${layerId}: ${allTenements.length} records`);

      const tenements = allTenements.map((feature: any) => {
        const attrs = feature.attributes;
        return {
          number: attrs.NAME || attrs.TENEMENT_NO || attrs.LICENCE_NO || attrs.LEASE_NO || `TAS-${attrs.OBJECTID}`,
          type: tenementType, // Use the type from layer mapping
          status: 'Current', // Tasmania data appears to be current tenements only
          holderName: attrs.HOLDER || attrs.TENEMENT_HOLDER || attrs.LICENCE_HOLDER || 'Unknown',
          applicationDate: this.parseDate(attrs.APP_DATE || attrs.APPLICATION_DATE),
          grantDate: this.parseDate(attrs.GRANT_DATE || attrs.GRANTED_DATE),
          expiryDate: this.parseDate(attrs.EXPIRY_DATE || attrs.EXP_DATE),
          anniversaryDate: this.parseDate(attrs.ANNIVERSARY_DATE),
          areaHa: this.calculateAreaFromGeometry(feature.geometry) || parseFloat(attrs.AREA_HA || attrs.AREA) || null,
          section29Flag: false, // Tasmania doesn't use Section 29
        };
      });

      // Remove duplicates based on tenement number
      const uniqueTenements = tenements.filter((tenement, index, self) => 
        index === self.findIndex(t => t.number === tenement.number)
      );

      this.logger.log(`📊 Processed ${tenements.length} ${tenementType} records from Tasmania (${uniqueTenements.length} unique)`);
      return uniqueTenements;
      
    } catch (error) {
      this.logger.error(`❌ Failed to fetch from layer ${layerId}:`, error);
      return [];
    }
  }

  private parseDate(dateValue: any): string | undefined {
    if (!dateValue) return undefined;
    
    if (typeof dateValue === 'number') {
      return new Date(dateValue).toISOString().split('T')[0];
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return undefined;
  }

  private calculateAreaFromGeometry(geometry: any): number | null {
    // For now, return null as area calculation from geometry is complex
    // Tasmania should provide area in attributes if available
    return null;
  }
}
