import { Injectable, Logger } from '@nestjs/common';
import { DataSourceProvider, TenementData } from '../data-sources.service';
import axios from 'axios';

@Injectable()
export class NSWDataSourceService implements DataSourceProvider {
  private readonly logger = new Logger(NSWDataSourceService.name);
  
  private readonly MTR_BASE_URL = 'https://www.resources.nsw.gov.au/mining-and-exploration/public-registers/mining-titles-register';
  private readonly NSW_CSV_URL = 'https://gs.geoscience.nsw.gov.au/geoserver/gsnsw/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gsnsw:bl_title&outputFormat=csv';

  getJurisdiction(): string {
    return 'NSW';
  }

  async checkStatus(): Promise<{ status: 'Active' | 'Inactive' | 'Error'; error?: string }> {
    try {
      const response = await axios.get(this.MTR_BASE_URL, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (response.status === 200 && (response.data.includes('Mining Titles Register') || response.data.includes('mining-titles-register'))) {
        return { status: 'Active' };
      } else {
        return { status: 'Error', error: 'NSW MTR not accessible' };
      }
    } catch (error) {
      this.logger.error('NSW data source status check failed:', error);
      return { status: 'Error', error: error.message };
    }
  }

  async fetchTenements(): Promise<TenementData[]> {
    try {
      this.logger.log('🔄 Starting NSW tenement fetch from GeoServer CSV...');
      
      // Fetch CSV data from NSW GeoServer
      const response = await axios.get(this.NSW_CSV_URL, {
        timeout: 60000, // Longer timeout for large CSV
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        }
      });

      if (response.status === 200 && response.data) {
        this.logger.log('✅ Successfully fetched NSW CSV data');
        return this.processNSWCSV(response.data);
      } else {
        this.logger.warn('⚠️ NSW CSV data not available, using sample data');
        return this.getSampleNSWData();
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to fetch NSW tenements:', error);
      this.logger.warn('📋 Falling back to sample NSW data');
      return this.getSampleNSWData();
    }
  }

  private processNSWCSV(csvData: string): TenementData[] {
    try {
      this.logger.log('📊 Processing NSW CSV data...');
      
      const lines = csvData.split('\n');
      if (lines.length < 2) {
        this.logger.warn('⚠️ NSW CSV has no data rows');
        return [];
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const tenements: TenementData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV parsing more robustly - NSW data has complex comma-separated values
        const values = this.parseCSVLine(line);
        if (values.length < 10) continue; // Minimum required fields

        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });

        // Map NSW fields to our standard format using the correct field names
        const tenement: TenementData = {
          number: `${record.title_code || 'NSW'}${record.title_no || i}`, // Combine code and number to ensure uniqueness
          type: record.title_code || 'Unknown',
          status: 'Current', // NSW data appears to be current titles only
          holderName: record.holder || record.company || 'Unknown',
          applicationDate: this.parseDate(record.grant_date),
          grantDate: this.parseDate(record.grant_date),
          expiryDate: this.parseDate(record.expiry_date),
          anniversaryDate: this.parseDate(record.last_renewed),
          areaHa: this.parseArea(record.title_area),
          section29Flag: false,
        };

        tenements.push(tenement);
      }

      // Remove duplicates based on tenement number
      const uniqueTenements = tenements.filter((tenement, index, self) => 
        index === self.findIndex(t => t.number === tenement.number)
      );

      this.logger.log(`📊 Processed ${tenements.length} NSW tenements from CSV (${uniqueTenements.length} unique)`);
      return uniqueTenements;
      
    } catch (error) {
      this.logger.error('❌ Failed to process NSW CSV:', error);
      return [];
    }
  }

  private parseDate(dateStr: string): string | undefined {
    if (!dateStr || dateStr === 'null' || dateStr === '') return undefined;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  private parseArea(areaStr: string): number | null {
    if (!areaStr || areaStr === 'null' || areaStr === '') return null;
    
    try {
      // Extract numeric value from area string (e.g., "118.04 HA" -> 118.04)
      const match = areaStr.match(/[\d.]+/);
      if (match) {
        const value = parseFloat(match[0]);
        // Convert to hectares if needed (most NSW data is already in HA)
        if (areaStr.toLowerCase().includes('m2')) {
          return value / 10000; // Convert m2 to hectares
        }
        return value;
      }
      return null;
    } catch {
      return null;
    }
  }

  private getSampleNSWData(): TenementData[] {
    // Return a few sample NSW tenements to show the structure
    return [
      {
        number: 'EL8888',
        type: 'Exploration Licence',
        status: 'Current',
        holderName: 'NSW Mining Company Pty Ltd',
        applicationDate: '2023-01-15',
        grantDate: '2023-06-01',
        expiryDate: '2026-05-31',
        areaHa: 1500.0,
        section29Flag: false,
      },
      {
        number: 'ML1234',
        type: 'Mining Lease',
        status: 'Current',
        holderName: 'Hunter Valley Resources Ltd',
        applicationDate: '2022-03-10',
        grantDate: '2022-12-15',
        expiryDate: '2043-12-14',
        areaHa: 850.5,
        section29Flag: true,
      }
    ];
  }
}
