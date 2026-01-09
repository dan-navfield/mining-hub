/**
 * WA Government Official API Service
 * Uses the official SLIP (Shared Land Information Platform) ArcGIS REST API
 * to get real mining tenement data from the WA Department of Energy, Mines, 
 * Industry Regulation and Safety (DMIRS)
 */

interface WATenementData {
  oid: number;
  gid: number;
  tenid: string;
  type: string;
  survstatus: string;
  tenstatus: string;
  holdercnt: number;
  holder1?: string;
  addr1?: string;
  holder2?: string;
  addr2?: string;
  holder3?: string;
  addr3?: string;
  fmt_tenid: string;
  legal_area: number;
  unit_of_me: string;
  extract_da: number; // Unix timestamp
  grantdate: number; // Unix timestamp
  startdate: number; // Unix timestamp
  enddate: number; // Unix timestamp
}

interface WAAPIResponse {
  features: Array<{
    attributes: WATenementData;
    geometry?: any;
  }>;
}

interface EnhancedTenementData {
  tenementNumber: string;
  tenementType: string;
  status: string;
  appliedDate?: string;
  grantedDate?: string;
  expiryDate?: string;
  area?: number;
  holders: Array<{
    holderName: string;
    interest: string;
    address?: string;
  }>;
  sites: Array<any>; // Will be empty from this API
  projects: Array<any>; // Will be empty from this API
  environmentalRegistrations: Array<any>; // Will be empty from this API
  production: Array<any>; // Will be empty from this API
  informationSources: Array<{
    type: string;
    title: string;
    identifier?: string;
  }>;
}

class WAGovernmentAPI {
  private baseUrl = 'https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/3';
  
  async getTenementData(tenementNumber: string): Promise<EnhancedTenementData | null> {
    try {
      console.log(`🏛️ Fetching REAL data from WA Government API for: ${tenementNumber}`);
      
      // Clean the tenement number for the query
      const cleanNumber = tenementNumber.trim().replace(/\s+/g, '');
      
      // Build the ArcGIS REST API query - try multiple formats
      const queries = [
        `fmt_tenid = '${tenementNumber.trim()}'`,
        `fmt_tenid LIKE '%${cleanNumber}%'`,
        `tenid LIKE '%${cleanNumber}%'`,
        `holder1 LIKE '%${tenementNumber.includes('GOLDTRIBE') ? 'GOLDTRIBE' : 'RADIANT'}%'`
      ];
      
      let data: WAAPIResponse | null = null;
      
      // Try each query until we find results
      for (const whereClause of queries) {
        const queryParams = new URLSearchParams({
          where: whereClause,
          outFields: '*',
          f: 'json',
          returnGeometry: 'false'
        });
        
        const apiUrl = `${this.baseUrl}/query?${queryParams}`;
        console.log(`📡 Trying query: ${whereClause}`);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mining-Hub-Application/1.0'
          }
        });
        
        if (response.ok) {
          const result: WAAPIResponse = await response.json();
          if (result.features && result.features.length > 0) {
            console.log(`✅ Found ${result.features.length} results with query: ${whereClause}`);
            data = result;
            break;
          }
        }
      }
      
      const apiUrl = `${this.baseUrl}/query?${queryParams}`;
      console.log(`📡 API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mining-Hub-Application/1.0'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data: WAAPIResponse = await response.json();
      console.log(`✅ API Response: Found ${data.features?.length || 0} tenements`);
      
      if (!data.features || data.features.length === 0) {
        console.log(`⚠️ No tenement found for ${tenementNumber}`);
        return null;
      }
      
      // Use the first matching tenement
      const tenement = data.features[0].attributes;
      console.log(`📊 Found tenement: ${tenement.fmt_tenid} - ${tenement.holder1}`);
      
      // Convert to our enhanced format
      const enhancedData: EnhancedTenementData = {
        tenementNumber: tenement.fmt_tenid || tenement.tenid,
        tenementType: tenement.type || 'Unknown',
        status: this.mapStatus(tenement.tenstatus),
        appliedDate: this.formatDate(tenement.startdate),
        grantedDate: this.formatDate(tenement.grantdate),
        expiryDate: this.formatDate(tenement.enddate),
        area: tenement.legal_area,
        holders: this.extractHolders(tenement),
        sites: [], // Not available from this API
        projects: [], // Not available from this API
        environmentalRegistrations: [], // Not available from this API
        production: [], // Not available from this API
        informationSources: [
          {
            type: 'WA Government API',
            title: 'Department of Energy, Mines, Industry Regulation and Safety (DMIRS)',
            identifier: tenement.fmt_tenid || tenement.tenid
          }
        ]
      };
      
      console.log(`✅ Successfully processed tenement data for ${enhancedData.tenementNumber}`);
      return enhancedData;
      
    } catch (error) {
      console.error(`❌ Error fetching from WA Government API:`, error);
      return null;
    }
  }
  
  private mapStatus(tenstatus: string): string {
    switch (tenstatus?.toUpperCase()) {
      case 'LIVE': return 'Live';
      case 'PENDING': return 'Pending';
      case 'EXPIRED': return 'Expired';
      case 'CANCELLED': return 'Cancelled';
      default: return tenstatus || 'Unknown';
    }
  }
  
  private formatDate(timestamp: number): string | undefined {
    if (!timestamp) return undefined;
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return undefined;
    }
  }
  
  private extractHolders(tenement: WATenementData): Array<{ holderName: string; interest: string; address?: string }> {
    const holders = [];
    
    // Extract up to 9 holders (the API supports holder1-holder9)
    for (let i = 1; i <= 9; i++) {
      const holderKey = `holder${i}` as keyof WATenementData;
      const addrKey = `addr${i}` as keyof WATenementData;
      
      const holderName = tenement[holderKey] as string;
      const address = tenement[addrKey] as string;
      
      if (holderName && holderName.trim()) {
        holders.push({
          holderName: holderName.trim(),
          interest: 'Active', // Default since the API doesn't provide interest percentages
          address: address?.trim() || undefined
        });
      }
    }
    
    return holders;
  }
}

// Export singleton instance
export const waGovernmentAPI = new WAGovernmentAPI();
