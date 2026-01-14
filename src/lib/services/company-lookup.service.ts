/**
 * Company Lookup Service
 * Fetches company information from public Australian sources
 */

export interface CompanyInfo {
  abn?: string;
  acn?: string;
  entityName?: string;
  entityType?: string;
  status?: string;
  address?: {
    stateCode?: string;
    postcode?: string;
    suburb?: string;
  };
  gstStatus?: string;
  lastUpdated?: string;
}

export interface HolderContactInfo {
  id?: string;
  holder_name: string;
  abn?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  notes?: string;
  updated_at?: string;
  updated_by?: string;
}

class CompanyLookupService {
  // Australian Government Data Sources
  private readonly ABN_LOOKUP_URL = 'https://abr.business.gov.au/json/AbnDetails.aspx';
  private readonly ABN_SEARCH_URL = 'https://abr.business.gov.au/json/MatchingNames.aspx';
  private readonly ASIC_DATA_GOV_URL = 'https://data.gov.au/api/3/action/datastore_search';
  private readonly OPENCORPORATES_URL = 'https://api.opencorporates.com/v0.4/companies/search';
  
  /**
   * Search for company by name using multiple Australian data sources
   * Tries sources in order: ABN Lookup -> ASIC data.gov.au -> OpenCorporates -> Mock data
   */
  async searchCompanyByName(companyName: string): Promise<CompanyInfo | null> {
    try {
      console.log(`🔍 Searching for company: ${companyName}`);
      
      // 1. Try ABN Lookup Web Services (name search)
      let result = await this.searchABNByName(companyName);
      if (result) {
        console.log('✅ Found company data via ABN Lookup');
        return result;
      }
      
      // 2. Try ASIC data via data.gov.au
      result = await this.searchASICDataGov(companyName);
      if (result) {
        console.log('✅ Found company data via ASIC data.gov.au');
        return result;
      }
      
      // 3. Try OpenCorporates API
      result = await this.searchOpenCorporates(companyName);
      if (result) {
        console.log('✅ Found company data via OpenCorporates');
        return result;
      }
      
      // 4. Fallback to mock data for known companies
      result = this.getMockCompanyData(companyName);
      if (result) {
        console.log('✅ Found company data via mock data');
        return result;
      }
      
      console.log('❌ No company data found from any source');
      return null;
    } catch (error) {
      console.error('❌ Error looking up company:', error);
      return null;
    }
  }

  /**
   * Search ABN Lookup Web Services by company name via backend
   */
  private async searchABNByName(companyName: string): Promise<CompanyInfo | null> {
    try {
      console.log('🔍 Trying ABN Lookup via backend...');
      
      const response = await fetch(`http://localhost:4000/api/company-lookup/abn-search?name=${encodeURIComponent(companyName)}`);
      if (response.ok) {
        const data = await response.json();
        return data; // Backend already transforms the data
      }
      
      return null;
    } catch (error) {
      console.log('⚠️ ABN Lookup backend not available');
      return null;
    }
  }

  /**
   * Search ASIC data via backend
   */
  private async searchASICDataGov(companyName: string): Promise<CompanyInfo | null> {
    try {
      console.log('🔍 Trying ASIC data.gov.au via backend...');
      
      const response = await fetch(`http://localhost:4000/api/company-lookup/asic-search?name=${encodeURIComponent(companyName)}`);
      if (response.ok) {
        const data = await response.json();
        return data; // Backend already transforms the data
      }
      
      return null;
    } catch (error) {
      console.log('⚠️ ASIC backend search failed:', error);
      return null;
    }
  }

  /**
   * Search OpenCorporates API
   */
  private async searchOpenCorporates(companyName: string): Promise<CompanyInfo | null> {
    try {
      console.log('🔍 Trying OpenCorporates...');
      
      const searchUrl = `${this.OPENCORPORATES_URL}?q=${encodeURIComponent(companyName)}&jurisdiction_code=au&format=json&per_page=5`;
      
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.companies && data.results.companies.length > 0) {
          return this.transformOpenCorporatesData(data.results.companies[0].company);
        }
      }
      
      return null;
    } catch (error) {
      console.log('⚠️ OpenCorporates search failed:', error);
      return null;
    }
  }

  /**
   * Transform ABN Lookup data to our format
   */
  private transformABNData(abnData: any): CompanyInfo {
    return {
      abn: abnData.Abn,
      acn: abnData.Acn,
      entityName: abnData.EntityName,
      entityType: abnData.EntityType,
      status: abnData.EntityStatus,
      address: abnData.MainBusinessPhysicalAddress ? {
        stateCode: abnData.MainBusinessPhysicalAddress.StateCode,
        postcode: abnData.MainBusinessPhysicalAddress.Postcode,
        suburb: abnData.MainBusinessPhysicalAddress.SuburbOrPlaceOrLocality,
      } : undefined,
      gstStatus: abnData.GstStatus,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Transform ASIC data.gov.au data to our format
   */
  private transformASICData(asicData: any): CompanyInfo {
    return {
      abn: asicData.abn,
      acn: asicData.acn,
      entityName: asicData.company_name || asicData.organisation_name,
      entityType: asicData.company_type,
      status: asicData.company_status,
      address: asicData.registered_office_address ? {
        stateCode: asicData.registered_office_address.state,
        postcode: asicData.registered_office_address.postcode,
        suburb: asicData.registered_office_address.suburb,
      } : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Transform OpenCorporates data to our format
   */
  private transformOpenCorporatesData(ocData: any): CompanyInfo {
    return {
      abn: ocData.registry_identifier,
      entityName: ocData.name,
      entityType: ocData.company_type,
      status: ocData.current_status,
      address: ocData.registered_address_in_full ? {
        stateCode: this.extractStateFromAddress(ocData.registered_address_in_full),
        postcode: this.extractPostcodeFromAddress(ocData.registered_address_in_full),
        suburb: this.extractSuburbFromAddress(ocData.registered_address_in_full),
      } : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Helper methods for address parsing
   */
  private extractStateFromAddress(address: string): string {
    const stateMatch = address.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i);
    return stateMatch ? stateMatch[1].toUpperCase() : '';
  }

  private extractPostcodeFromAddress(address: string): string {
    const postcodeMatch = address.match(/\b(\d{4})\b/);
    return postcodeMatch ? postcodeMatch[1] : '';
  }

  private extractSuburbFromAddress(address: string): string {
    // Simple extraction - could be improved with better parsing
    const parts = address.split(',');
    return parts.length > 0 ? parts[0].trim() : '';
  }

  /**
   * Lookup company by ABN
   */
  async lookupByABN(abn: string): Promise<CompanyInfo | null> {
    try {
      // Clean ABN (remove spaces, validate format)
      const cleanABN = abn.replace(/\s/g, '');
      if (!/^\d{11}$/.test(cleanABN)) {
        throw new Error('Invalid ABN format');
      }

      console.log(`🔍 Looking up ABN: ${cleanABN}`);
      
      // In production, this would call your backend API
      // const response = await fetch(`/api/company-lookup?abn=${cleanABN}`);
      // return response.ok ? await response.json() : null;
      
      return null;
    } catch (error) {
      console.error('❌ Error looking up ABN:', error);
      return null;
    }
  }

  /**
   * Save holder contact information to our database
   */
  async saveHolderContactInfo(contactInfo: HolderContactInfo): Promise<boolean> {
    try {
      const response = await fetch('/api/holders/contact-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactInfo,
          updated_at: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error saving holder contact info:', error);
      return false;
    }
  }

  /**
   * Get holder contact information from our database
   */
  async getHolderContactInfo(holderName: string): Promise<HolderContactInfo | null> {
    try {
      const response = await fetch(`/api/holders/contact-info?name=${encodeURIComponent(holderName)}`);
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('❌ Error getting holder contact info:', error);
      return null;
    }
  }

  /**
   * Mock data for demonstration purposes
   * In production, this would be replaced with real ABN Lookup API calls
   */
  private getMockCompanyData(companyName: string): CompanyInfo | null {
    const mockCompanies: Record<string, CompanyInfo> = {
      'RADIANT MINERALS PTY LTD': {
        abn: '12 345 678 901',
        acn: '345 678 901',
        entityName: 'RADIANT MINERALS PTY LTD',
        entityType: 'Australian Private Company',
        status: 'Active',
        address: {
          stateCode: 'WA',
          postcode: '6000',
          suburb: 'PERTH',
        },
        gstStatus: 'Registered',
        lastUpdated: new Date().toISOString(),
      },
      'RADIANT EXPLORATION PTY LTD': {
        abn: '98 765 432 109',
        acn: '765 432 109',
        entityName: 'RADIANT EXPLORATION PTY LTD',
        entityType: 'Australian Private Company',
        status: 'Active',
        address: {
          stateCode: 'WA',
          postcode: '6005',
          suburb: 'WEST PERTH',
        },
        gstStatus: 'Registered',
        lastUpdated: new Date().toISOString(),
      },
      'CENTRAL PILBARA NORTH IRON ORE PTY LTD': {
        abn: '11 222 333 444',
        acn: '222 333 444',
        entityName: 'CENTRAL PILBARA NORTH IRON ORE PTY LTD',
        entityType: 'Australian Private Company',
        status: 'Active',
        address: {
          stateCode: 'WA',
          postcode: '6000',
          suburb: 'PERTH',
        },
        gstStatus: 'Registered',
        lastUpdated: new Date().toISOString(),
      },
    };

    // Try exact match first
    if (mockCompanies[companyName.toUpperCase()]) {
      return mockCompanies[companyName.toUpperCase()];
    }

    // Try partial match
    const partialMatch = Object.keys(mockCompanies).find(key => 
      key.includes(companyName.toUpperCase()) || 
      companyName.toUpperCase().includes(key.split(' ')[0])
    );

    return partialMatch ? mockCompanies[partialMatch] : null;
  }

  /**
   * Format ABN for display
   */
  formatABN(abn: string): string {
    const clean = abn.replace(/\s/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
    }
    return abn;
  }

  /**
   * Validate ABN using checksum algorithm
   */
  validateABN(abn: string): boolean {
    const clean = abn.replace(/\s/g, '');
    if (!/^\d{11}$/.test(clean)) return false;

    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    let sum = 0;

    for (let i = 0; i < 11; i++) {
      sum += parseInt(clean[i]) * weights[i];
    }

    return sum % 89 === 0;
  }
}

export const companyLookupService = new CompanyLookupService();
