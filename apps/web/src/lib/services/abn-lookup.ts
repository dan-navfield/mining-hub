/**
 * ABN Lookup Service
 * Integrates with the Australian Business Register ABN Lookup web service
 */

interface ABNLookupResult {
  abn: string;
  abnStatus: string;
  entityName: string;
  entityType: string;
  gstStatus?: string;
  postcode?: string;
  state?: string;
  isValid: boolean;
  lastUpdated?: string;
}

interface ABNLookupError {
  error: string;
  message: string;
}

class ABNLookupService {
  private readonly apiBaseUrl = '/api/abn-lookup';

  constructor() {
    // Use server-side API routes to keep GUID secure
  }

  /**
   * Search for ABN by business name using the server-side API
   */
  async searchByName(businessName: string): Promise<ABNLookupResult[] | ABNLookupError> {
    if (!businessName || businessName.trim().length < 3) {
      return { error: 'Invalid Input', message: 'Business name must be at least 3 characters' };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}?q=${encodeURIComponent(businessName.trim())}&type=name`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: 'API Error', message: errorData.error || `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      
      if ('error' in data) {
        return data as ABNLookupError;
      }

      return data as ABNLookupResult[];

    } catch (error) {
      console.error('ABN Lookup API Error:', error);
      return { error: 'Network Error', message: 'Failed to connect to ABN Lookup service' };
    }
  }

  /**
   * Search for business details by ABN using the server-side API
   */
  async searchByABN(abn: string): Promise<ABNLookupResult | ABNLookupError> {
    const cleanABN = this.cleanABN(abn);
    if (!this.isValidABNFormat(cleanABN)) {
      return { error: 'Invalid ABN', message: 'ABN must be 11 digits' };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}?q=${encodeURIComponent(cleanABN)}&type=abn`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: 'API Error', message: errorData.error || `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      
      if ('error' in data) {
        return data as ABNLookupError;
      }

      // For ABN search, the API returns a single result, but we need to handle array format
      const result = Array.isArray(data) ? data[0] : data;
      return result as ABNLookupResult;

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
}

// Export singleton instance
export const abnLookupService = new ABNLookupService();

// Export types
export type { ABNLookupResult, ABNLookupError };
