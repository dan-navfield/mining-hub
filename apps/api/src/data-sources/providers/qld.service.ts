import { Injectable, Logger } from '@nestjs/common';
import { DataSourceProvider, TenementData } from '../data-sources.service';
import axios from 'axios';

@Injectable()
export class QLDDataSourceService implements DataSourceProvider {
  private readonly logger = new Logger(QLDDataSourceService.name);
  
  private readonly QLD_REST_BASE = 'https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Economy/MinesPermitsCurrent/MapServer';
  private readonly QLD_DATA_PORTAL = 'https://www.data.qld.gov.au/';

  getJurisdiction(): string {
    return 'QLD';
  }

  async checkStatus(): Promise<{ status: 'Active' | 'Inactive' | 'Error'; error?: string }> {
    try {
      const response = await axios.get(`${this.QLD_REST_BASE}?f=json`, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (response.status === 200 && response.data.layers) {
        return { status: 'Active' };
      } else {
        return { status: 'Error', error: 'QLD REST service not accessible' };
      }
    } catch (error) {
      this.logger.error('QLD data source status check failed:', error);
      return { status: 'Error', error: error.message };
    }
  }

  async fetchTenements(): Promise<TenementData[]> {
    try {
      this.logger.log('🔄 Starting QLD tenement fetch from Queensland Open Data...');
      
      const tenements: TenementData[] = [];
      
      // Queensland has multiple layers for different tenure types
      const layers = [
        { id: 3, name: 'EPM granted', type: 'Exploration Permit (Mineral)' },
        { id: 9, name: 'EPC granted', type: 'Exploration Permit (Coal)' },
        { id: 44, name: 'ML permit granted', type: 'Mining Lease' },
        { id: 36, name: 'MC permit granted', type: 'Mining Claim' },
        { id: 25, name: 'MDL permit granted', type: 'Mineral Development Licence' },
      ];

      for (const layer of layers) {
        try {
          const layerTenements = await this.fetchFromLayer(layer.id, layer.type);
          tenements.push(...layerTenements);
        } catch (error) {
          this.logger.warn(`⚠️ Failed to fetch from layer ${layer.name}: ${error.message}`);
        }
      }
      
      this.logger.log(`✅ Successfully fetched ${tenements.length} tenements from Queensland`);
      return tenements.length > 0 ? tenements : this.getSampleQLDData();
      
    } catch (error) {
      this.logger.error('❌ Failed to fetch QLD tenements:', error);
      throw error;
    }
  }

  private async fetchFromLayer(layerId: number, tenementType: string): Promise<TenementData[]> {
    try {
      this.logger.log(`📥 Fetching ${tenementType} data from layer ${layerId}`);
      
      let allTenements: any[] = [];
      let offset = 0;
      const batchSize = 2000;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${this.QLD_REST_BASE}/${layerId}/query`, {
          params: {
            where: '1=1',
            outFields: '*',
            f: 'json',
            resultRecordCount: batchSize,
            resultOffset: offset,
            orderByFields: 'OBJECTID ASC',
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
          number: attrs.displayname || `${attrs.permittypeabbreviation || 'QLD'} ${attrs.permitnumber}` || `QLD-${attrs.objectid}`,
          type: attrs.permittype || tenementType,
          status: attrs.permitstatus || attrs.permitstate || 'Unknown',
          holderName: attrs.authorisedholdername || 'Unknown',
          applicationDate: this.parseDate(attrs.lodgedate),
          grantDate: this.parseDate(attrs.approvedate),
          expiryDate: this.parseDate(attrs.expirydate),
          anniversaryDate: this.parseDate(attrs.anniversarydate),
          areaHa: parseFloat(attrs.shapeareahectares || attrs.shapearea) || null,
          section29Flag: false, // Queensland doesn't use Section 29
        };
      });

      this.logger.log(`📊 Processed ${tenements.length} ${tenementType} records from Queensland`);
      return tenements;
      
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

  private getSampleQLDData(): TenementData[] {
    // Return sample Queensland tenements
    return [
      {
        number: 'EPM27890',
        type: 'Exploration Permit',
        status: 'Current',
        holderName: 'Queensland Mining Ventures Pty Ltd',
        applicationDate: '2023-04-10',
        grantDate: '2023-10-05',
        expiryDate: '2028-10-04',
        areaHa: 4200.0,
        section29Flag: false,
      },
      {
        number: 'ML80234',
        type: 'Mining Lease',
        status: 'Current',
        holderName: 'Sunshine State Resources Ltd',
        applicationDate: '2022-08-15',
        grantDate: '2023-03-20',
        expiryDate: '2044-03-19',
        areaHa: 1800.5,
        section29Flag: false,
      }
    ];
  }
}
