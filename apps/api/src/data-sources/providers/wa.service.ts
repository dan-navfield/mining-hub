import { Injectable, Logger } from '@nestjs/common';
import { DataSourceProvider, TenementData } from '../data-sources.service';
import axios from 'axios';

@Injectable()
export class WADataSourceService implements DataSourceProvider {
  private readonly logger = new Logger(WADataSourceService.name);
  
  // WA Government data sources
  private readonly ARCGIS_URL = 'https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/3';

  getJurisdiction(): string {
    return 'WA';
  }

  async checkStatus(): Promise<{ status: 'Active' | 'Inactive' | 'Error'; error?: string }> {
    try {
      const response = await axios.get(`${this.ARCGIS_URL}?f=json`, { timeout: 10000 });
      
      if (response.status === 200 && response.data) {
        return { status: 'Active' };
      } else {
        return { status: 'Error', error: 'Invalid response from WA data source' };
      }
    } catch (error) {
      this.logger.error('WA data source status check failed:', error);
      return { status: 'Error', error: error.message };
    }
  }

  async fetchTenements(): Promise<TenementData[]> {
    try {
      this.logger.log('🔄 Starting WA tenement fetch from DMIRS-003 dataset...');
      
      // First, get the total count
      const countResponse = await axios.get(`${this.ARCGIS_URL}/query`, {
        params: {
          where: '1=1',
          returnCountOnly: true,
          f: 'json',
        },
        timeout: 10000,
      });

      const totalCount = countResponse.data.count;
      this.logger.log(`📊 Total WA tenements available: ${totalCount}`);

      // Fetch in batches to handle large datasets
      const batchSize = 500; // Reduce batch size for better reliability
      const tenements: TenementData[] = [];
      let offset = 0;

      while (offset < totalCount) { // Fetch ALL records, not just 5000
        this.logger.log(`📥 Fetching batch ${Math.floor(offset / batchSize) + 1}, records ${offset + 1}-${Math.min(offset + batchSize, totalCount)}`);
        
        let response;
        let retries = 3;
        
        while (retries > 0) {
          try {
            response = await axios.get(`${this.ARCGIS_URL}/query`, {
              params: {
                where: '1=1',
                outFields: '*',
                f: 'json',
                resultOffset: offset,
                resultRecordCount: batchSize,
                orderByFields: 'oid ASC',
              },
              timeout: 60000, // Increase timeout to 60 seconds
            });
            break; // Success, exit retry loop
          } catch (error) {
            retries--;
            if (retries === 0) {
              this.logger.error(`❌ Failed to fetch batch at offset ${offset} after 3 retries: ${error.message}`);
              throw error;
            }
            this.logger.warn(`⚠️ Batch failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          }
        }

        if (!response.data || !response.data.features) {
          this.logger.warn(`⚠️ Invalid response for batch at offset ${offset}`);
          break;
        }

        const batchTenements = response.data.features.map((feature: any) => {
          const attrs = feature.attributes;
          return {
            number: attrs.tenid || attrs.fmt_tenid || `WA-${attrs.oid}`,
            type: attrs.type || 'Unknown',
            status: attrs.tenstatus || 'Unknown',
            holderName: attrs.holder1 || 'Unknown',
            applicationDate: this.parseDate(attrs.startdate),
            grantDate: this.parseDate(attrs.grantdate),
            expiryDate: this.parseDate(attrs.enddate),
            anniversaryDate: null, // Not available in WA data
            areaHa: parseFloat(attrs.legal_area) || null,
            section29Flag: attrs.special_in === 'Y',
          };
        });

        tenements.push(...batchTenements);
        offset += batchSize;

        // Add a small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.logger.log(`✅ Successfully fetched ${tenements.length} tenements from WA DMIRS-003 dataset`);
      return tenements;
    } catch (error) {
      this.logger.error('❌ Failed to fetch WA tenements:', error);
      throw error;
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
}
