/**
 * Server-side ABN Lookup Service
 * Makes direct calls to the Australian Business Register ABN Lookup web service
 * This runs on the server and keeps the GUID secure
 */

import { ABNLookupResult, ABNLookupError } from './abn-lookup';

class ABNLookupServerService {
  private readonly guid: string;
  private readonly baseUrl = 'https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx';

  constructor() {
    // Get GUID from environment variables (server-side only)
    this.guid = process.env.ABN_LOOKUP_GUID || '';
    
    if (!this.guid) {
      console.warn('ABN_LOOKUP_GUID not found in environment variables');
    }
  }

  /**
   * Search for ABN by business name using the latest API
   */
  async searchByName(businessName: string): Promise<ABNLookupResult[] | ABNLookupError> {
    if (!this.guid) {
      return { error: 'Configuration Error', message: 'ABN Lookup GUID not configured' };
    }

    if (!businessName || businessName.trim().length < 3) {
      return { error: 'Invalid Input', message: 'Business name must be at least 3 characters' };
    }

    try {
      // Use the latest SimpleProtocol endpoint for name searches
      const url = `${this.baseUrl}/ABRSearchByNameAdvancedSimpleProtocol2017`;
      
      const params = new URLSearchParams({
        name: businessName.trim(),
        guid: this.guid,
        maxSearchResults: '50',
        legalName: 'Y',
        tradingName: 'Y',
        NSW: 'Y',
        SA: 'Y',
        ACT: 'Y',
        VIC: 'Y',
        WA: 'Y',
        NT: 'Y',
        QLD: 'Y',
        TAS: 'Y',
        authenticationGuid: this.guid
      });

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'Mining Hub - Tenement Management System'
        }
      });

      if (!response.ok) {
        return { error: 'API Error', message: `HTTP ${response.status}: ${response.statusText}` };
      }

      const xmlData = await response.text();
      return this.parseSearchResults(xmlData);

    } catch (error) {
      console.error('ABN Lookup API Error:', error);
      return { error: 'Network Error', message: 'Failed to connect to ABN Lookup service' };
    }
  }

  /**
   * Search for business details by ABN using the latest API (SearchByABNv202001)
   */
  async searchByABN(abn: string): Promise<ABNLookupResult | ABNLookupError> {
    if (!this.guid) {
      return { error: 'Configuration Error', message: 'ABN Lookup GUID not configured' };
    }

    const cleanABN = this.cleanABN(abn);
    if (!this.isValidABNFormat(cleanABN)) {
      return { error: 'Invalid ABN', message: 'ABN must be 11 digits' };
    }

    try {
      // Use the latest SearchByABNv202001 endpoint
      const params = new URLSearchParams({
        searchString: cleanABN,
        includeHistoricalDetails: 'N',
        authenticationGuid: this.guid
      });

      const url = `${this.baseUrl}/SearchByABNv202001?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'Mining Hub - Tenement Management System'
        }
      });

      if (!response.ok) {
        return { error: 'API Error', message: `HTTP ${response.status}: ${response.statusText}` };
      }

      const xmlData = await response.text();
      return this.parseABNResult(xmlData);

    } catch (error) {
      console.error('ABN Lookup API Error:', error);
      return { error: 'Network Error', message: 'Failed to connect to ABN Lookup service' };
    }
  }

  /**
   * Validate ABN using the standard algorithm
   */
  validateABN(abn: string): boolean {
    const cleanABN = this.cleanABN(abn);
    
    if (!this.isValidABNFormat(cleanABN)) {
      return false;
    }

    // ABN validation algorithm
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = cleanABN.split('').map(Number);
    
    // Subtract 1 from the first digit
    digits[0] -= 1;
    
    // Calculate weighted sum
    const sum = digits.reduce((acc, digit, index) => acc + (digit * weights[index]), 0);
    
    // Check if divisible by 89
    return sum % 89 === 0;
  }

  /**
   * Clean ABN by removing spaces and non-numeric characters
   */
  private cleanABN(abn: string): string {
    return abn.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  }

  /**
   * Check if ABN format is valid (11 digits)
   */
  private isValidABNFormat(abn: string): boolean {
    return /^\d{11}$/.test(abn);
  }

  /**
   * Parse XML response for name search results
   */
  private parseSearchResults(xmlData: string): ABNLookupResult[] | ABNLookupError {
    try {
      // Check for API errors first
      if (xmlData.includes('<exception>') || xmlData.includes('<error>')) {
        const errorMessage = this.extractXMLValue(xmlData, 'exceptionDescription') || 
                           this.extractXMLValue(xmlData, 'error') || 
                           'Unknown API error';
        return { error: 'API Error', message: errorMessage };
      }

      const results: ABNLookupResult[] = [];
      
      // Extract business entities from XML - handle both old and new response formats
      const entityMatches = xmlData.match(/<searchResultsRecord>[\s\S]*?<\/searchResultsRecord>/g) ||
                           xmlData.match(/<ABRSearchByNameAdvanced2017Response>[\s\S]*?<\/ABRSearchByNameAdvanced2017Response>/g);
      
      if (!entityMatches || entityMatches.length === 0) {
        // Check if it's an empty result vs an error
        if (xmlData.includes('searchResultsList') || xmlData.includes('response')) {
          return []; // Valid empty result
        }
        return { error: 'Parse Error', message: 'No valid results found in response' };
      }

      entityMatches.forEach(entity => {
        const abn = this.extractXMLValue(entity, 'abn') || this.extractXMLValue(entity, 'ABN');
        const entityName = this.extractXMLValue(entity, 'legalName') || 
                          this.extractXMLValue(entity, 'mainName') ||
                          this.extractXMLValue(entity, 'organisationName');
        const abnStatus = this.extractXMLValue(entity, 'abnStatus') || this.extractXMLValue(entity, 'ABNStatus');
        const entityType = this.extractXMLValue(entity, 'entityType') || this.extractXMLValue(entity, 'entityTypeText');
        const postcode = this.extractXMLValue(entity, 'postcode');
        const state = this.extractXMLValue(entity, 'stateCode');

        if (abn && entityName) {
          results.push({
            abn: abn.replace(/\s/g, ''), // Remove any spaces from ABN
            abnStatus: abnStatus || 'Unknown',
            entityName: entityName.trim(),
            entityType: entityType || 'Unknown',
            postcode,
            state,
            isValid: abnStatus === 'Active' || abnStatus === 'Current'
          });
        }
      });

      return results;

    } catch (error) {
      console.error('XML Parsing Error:', error);
      return { error: 'Parse Error', message: 'Failed to parse ABN Lookup response' };
    }
  }

  /**
   * Parse XML response for ABN search result (SearchByABNv202001)
   */
  private parseABNResult(xmlData: string): ABNLookupResult | ABNLookupError {
    try {
      // Check for API errors first
      if (xmlData.includes('<exception>') || xmlData.includes('<error>')) {
        const errorMessage = this.extractXMLValue(xmlData, 'exceptionDescription') || 
                           this.extractXMLValue(xmlData, 'error') || 
                           'Unknown API error';
        return { error: 'API Error', message: errorMessage };
      }

      // Handle different response formats from SearchByABNv202001
      const abn = this.extractXMLValue(xmlData, 'abn') || this.extractXMLValue(xmlData, 'ABN');
      const entityName = this.extractXMLValue(xmlData, 'legalName') || 
                        this.extractXMLValue(xmlData, 'mainName') ||
                        this.extractXMLValue(xmlData, 'organisationName');
      const abnStatus = this.extractXMLValue(xmlData, 'abnStatus') || this.extractXMLValue(xmlData, 'ABNStatus');
      const entityType = this.extractXMLValue(xmlData, 'entityType') || this.extractXMLValue(xmlData, 'entityTypeText');
      const gstStatus = this.extractXMLValue(xmlData, 'gstStatus') || this.extractXMLValue(xmlData, 'GSTStatus');
      const postcode = this.extractXMLValue(xmlData, 'postcode');
      const state = this.extractXMLValue(xmlData, 'stateCode');
      const lastUpdated = this.extractXMLValue(xmlData, 'recordLastUpdatedDate') || 
                         this.extractXMLValue(xmlData, 'lastUpdatedDate');

      if (!abn) {
        // Check if the response indicates no results vs an error
        if (xmlData.includes('response') || xmlData.includes('ABRPayloadSearchResults')) {
          return { error: 'Not Found', message: 'ABN not found in the Australian Business Register' };
        }
        return { error: 'Parse Error', message: 'Invalid response format' };
      }

      return {
        abn: abn.replace(/\s/g, ''), // Remove any spaces from ABN
        abnStatus: abnStatus || 'Unknown',
        entityName: entityName ? entityName.trim() : 'Unknown',
        entityType: entityType || 'Unknown',
        gstStatus: gstStatus || undefined,
        postcode,
        state,
        lastUpdated,
        isValid: abnStatus === 'Active' || abnStatus === 'Current'
      };

    } catch (error) {
      console.error('XML Parsing Error:', error);
      return { error: 'Parse Error', message: 'Failed to parse ABN Lookup response' };
    }
  }

  /**
   * Extract value from XML string
   */
  private extractXMLValue(xml: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : undefined;
  }
}

// Export singleton instance for server-side use
export const abnLookupServerService = new ABNLookupServerService();
