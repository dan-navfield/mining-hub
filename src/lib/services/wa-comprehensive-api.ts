/**
 * WA Government Comprehensive API Service
 * Pulls ALL available data from WA Government SLIP APIs:
 * - Complete tenement details with all holders
 * - Mining sites with full project information
 * - Commodity data and site classifications
 * - Precise coordinates and geometry
 */

interface WATenementComplete {
  // Core identifiers
  oid: number;
  gid: number;
  tenid: string;
  fmt_tenid: string;
  
  // Tenement details
  type: string;
  survstatus: string;
  tenstatus: string;
  
  // Holders (up to 9)
  holdercnt: number;
  holder1?: string; addr1?: string;
  holder2?: string; addr2?: string;
  holder3?: string; addr3?: string;
  holder4?: string; addr4?: string;
  holder5?: string; addr5?: string;
  holder6?: string; addr6?: string;
  holder7?: string; addr7?: string;
  holder8?: string; addr8?: string;
  holder9?: string; addr9?: string;
  
  // Area and legal
  legal_area: number;
  unit_of_me: string;
  special_in: string;
  
  // Dates
  extract_da: number;
  grantdate: number;
  granttime: string;
  startdate: number;
  starttime: string;
  enddate: number;
  endtime: string;
  
  // Geometry
  st_area_the_geom: number;
  st_perimeter_the_geom: number;
}

interface WAMiningSite {
  // Core identifiers
  oid: number;
  gid: number;
  site_code: string;
  site_title: string;
  short_name: string;
  
  // Site classification
  site_type_: string;
  site_sub_t: string;
  site_stage: string;
  
  // Commodities
  site_commo: string;
  target_com: string;
  commodity: string;
  
  // Project links
  proj_code: string;
  proj_title: string;
  
  // Location
  latitude: number;
  longitude: number;
  confidenti: string;
  point_conf: string;
  
  // Additional
  web_link: string;
  extract_da: number;
}

interface ComprehensiveTenementData {
  // Basic tenement info
  tenementNumber: string;
  tenementType: string;
  status: string;
  surveyStatus: string;
  
  // Dates
  appliedDate?: string;
  grantedDate?: string;
  expiryDate?: string;
  
  // Area
  area: number;
  areaUnit: string;
  calculatedArea?: number;
  perimeter?: number;
  
  // All holders with addresses
  holders: Array<{
    holderName: string;
    address?: string;
    interest: string;
  }>;
  
  // Mining sites with full details
  sites: Array<{
    siteName: string;
    siteCode: string;
    shortName?: string;
    siteType: string;
    siteSubtype?: string;
    siteStage?: string;
    commodities: string[];
    targetCommodities?: string;
    primaryCommodity?: string;
    projectName?: string;
    projectCode?: string;
    latitude?: number;
    longitude?: number;
    confidence?: string;
    pointConfidence?: string;
    webLink?: string;
  }>;
  
  // Projects derived from sites
  projects: Array<{
    projectName: string;
    projectCode: string;
    sites: string[];
    commodities: string[];
    commodity?: string;
    projectStatus?: string;
    startDate?: string;
    endDate?: string;
  }>;
  
  // Environmental, production etc (empty for now)
  environmentalRegistrations: Array<any>;
  production: Array<any>;
  
  // Information sources
  informationSources: Array<{
    type: string;
    title: string;
    identifier: string;
  }>;
  
  // Metadata
  lastExtracted: string;
  dataCompleteness: number;
}

class WAComprehensiveAPI {
  private tenementsUrl = 'https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/3';
  private sitesUrl = 'https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/0';
  
  async getComprehensiveTenementData(tenementNumber: string): Promise<ComprehensiveTenementData | null> {
    try {
      console.log(`🏛️ Fetching COMPREHENSIVE data from WA Government APIs for: ${tenementNumber}`);
      
      // Step 1: Get tenement details
      const tenementData = await this.getTenementDetails(tenementNumber);
      if (!tenementData) {
        console.log(`⚠️ No tenement found for ${tenementNumber}`);
        return null;
      }
      
      // Step 2: Get related mining sites
      const sitesData = await this.getRelatedSites(tenementNumber);
      
      // Step 3: Combine and structure all data
      const comprehensiveData = this.combineAllData(tenementData, sitesData);
      
      console.log(`✅ Successfully compiled comprehensive data for ${tenementNumber}`);
      console.log(`📊 Found: ${comprehensiveData.holders.length} holders, ${comprehensiveData.sites.length} sites, ${comprehensiveData.projects.length} projects`);
      
      return comprehensiveData;
      
    } catch (error) {
      console.error(`❌ Error fetching comprehensive data:`, error);
      return null;
    }
  }
  
  private async getTenementDetails(tenementNumber: string): Promise<WATenementComplete | null> {
    const cleanNumber = tenementNumber.trim().replace(/\s+/g, '');
    
    // Try multiple query strategies
    const queries = [
      `fmt_tenid = '${tenementNumber.trim()}'`,
      `fmt_tenid LIKE '%${cleanNumber}%'`,
      `tenid LIKE '%${cleanNumber}%'`,
    ];
    
    for (const whereClause of queries) {
      try {
        const queryParams = new URLSearchParams({
          where: whereClause,
          outFields: '*',
          f: 'json',
          returnGeometry: 'false'
        });
        
        const response = await fetch(`${this.tenementsUrl}/query?${queryParams}`);
        if (response.ok) {
          const result = await response.json();
          if (result.features && result.features.length > 0) {
            console.log(`✅ Found tenement with query: ${whereClause}`);
            return result.features[0].attributes;
          }
        }
      } catch (error) {
        console.log(`❌ Query failed: ${whereClause}`);
        continue;
      }
    }
    
    return null;
  }
  
  private async getRelatedSites(tenementNumber: string): Promise<WAMiningSite[]> {
    try {
      // Search for sites that might be related to this tenement
      // We'll search by tenement number in various fields with multiple strategies
      const cleanNumber = tenementNumber.trim().replace(/\s+/g, '');
      const numberParts = tenementNumber.match(/(\w+)\s*(\d+)\/(\d+)/);
      
      let queries = [
        `site_title LIKE '%${cleanNumber}%'`,
        `proj_title LIKE '%${cleanNumber}%'`,
        `site_code LIKE '%${cleanNumber.substring(1)}%'`, // Remove the 'E' prefix
        `site_title LIKE '%${tenementNumber}%'`,
        `proj_title LIKE '%${tenementNumber}%'`,
      ];
      
      // If we can parse the tenement number (e.g., E 28/3429), try more specific searches
      if (numberParts) {
        const [, prefix, block, number] = numberParts;
        queries.push(
          `site_title LIKE '%${block}/${number}%'`,
          `proj_title LIKE '%${block}/${number}%'`,
          `site_code LIKE '%${block}${number}%'`,
          `site_title LIKE '%${prefix}${block}${number}%'`,
          `proj_title LIKE '%${prefix}${block}${number}%'`
        );
      }
      
      // Also try broader geographic searches - get sites in the same area
      if (numberParts) {
        const [, , block] = numberParts;
        queries.push(
          `site_title LIKE '%${block}/%'`, // All sites in the same block
          `proj_title LIKE '%${block}/%'`
        );
      }
      
      const allSites: WAMiningSite[] = [];
      
      for (const whereClause of queries) {
        try {
          const queryParams = new URLSearchParams({
            where: whereClause,
            outFields: '*',
            f: 'json',
            returnGeometry: 'false',
            resultRecordCount: '100' // Get more results
          });
          
          const response = await fetch(`${this.sitesUrl}/query?${queryParams}`);
          if (response.ok) {
            const result = await response.json();
            if (result.features && result.features.length > 0) {
              console.log(`✅ Found ${result.features.length} sites with query: ${whereClause}`);
              allSites.push(...result.features.map((f: any) => f.attributes));
            }
          }
        } catch (error) {
          console.log(`❌ Sites query failed: ${whereClause}`);
          continue;
        }
      }
      
      // Remove duplicates based on site_code
      const uniqueSites = allSites.filter((site, index, self) => 
        index === self.findIndex(s => s.site_code === site.site_code)
      );
      
      console.log(`📍 Found ${uniqueSites.length} unique sites for ${tenementNumber}`);
      
      // If we still don't have sites, try a very broad search for any sites in the area
      if (uniqueSites.length === 0 && numberParts) {
        try {
          console.log(`🔍 Trying broad area search for sites near ${tenementNumber}...`);
          const [, , block] = numberParts;
          const broadQuery = `site_title LIKE '%${block}%' OR proj_title LIKE '%${block}%'`;
          
          const queryParams = new URLSearchParams({
            where: broadQuery,
            outFields: '*',
            f: 'json',
            returnGeometry: 'false',
            resultRecordCount: '50'
          });
          
          const response = await fetch(`${this.sitesUrl}/query?${queryParams}`);
          if (response.ok) {
            const result = await response.json();
            if (result.features && result.features.length > 0) {
              console.log(`✅ Broad search found ${result.features.length} sites in area`);
              const broadSites = result.features.map((f: any) => f.attributes);
              uniqueSites.push(...broadSites);
            }
          }
        } catch (error) {
          console.log(`❌ Broad area search failed`);
        }
      }
      
      return uniqueSites;
      
    } catch (error) {
      console.error(`❌ Error fetching sites:`, error);
      return [];
    }
  }
  
  private combineAllData(tenement: WATenementComplete, sites: WAMiningSite[]): ComprehensiveTenementData {
    // Extract all holders
    const holders = [];
    for (let i = 1; i <= 9; i++) {
      const holderKey = `holder${i}` as keyof WATenementComplete;
      const addrKey = `addr${i}` as keyof WATenementComplete;
      
      const holderName = tenement[holderKey] as string;
      const address = tenement[addrKey] as string;
      
      if (holderName && holderName.trim() && holderName.trim() !== ' ') {
        holders.push({
          holderName: holderName.trim(),
          address: address?.trim() || undefined,
          interest: 'Active'
        });
      }
    }
    
    // Process sites
    const processedSites = sites.map(site => ({
      siteName: site.site_title || site.short_name || 'Unknown Site',
      siteCode: site.site_code,
      shortName: site.short_name,
      siteType: site.site_type_ || 'Unknown',
      siteSubtype: site.site_sub_t || undefined,
      siteStage: site.site_stage || undefined,
      commodities: this.parseCommodities(site.site_commo || site.commodity),
      targetCommodities: site.target_com || undefined,
      primaryCommodity: site.commodity || undefined,
      projectName: site.proj_title || undefined,
      projectCode: site.proj_code || undefined,
      latitude: site.latitude || undefined,
      longitude: site.longitude || undefined,
      confidence: site.confidenti || undefined,
      pointConfidence: site.point_conf || undefined,
      webLink: site.web_link || undefined,
    }));
    
    // Extract unique projects from sites
    const projectsMap = new Map();
    sites.forEach(site => {
      if (site.proj_code && site.proj_title) {
        if (!projectsMap.has(site.proj_code)) {
          projectsMap.set(site.proj_code, {
            projectName: site.proj_title,
            projectCode: site.proj_code,
            sites: [],
            commodities: new Set()
          });
        }
        
        const project = projectsMap.get(site.proj_code);
        project.sites.push(site.site_title || site.short_name);
        
        // Add commodities
        const commodities = this.parseCommodities(site.site_commo || site.commodity);
        commodities.forEach(c => project.commodities.add(c));
      }
    });
    
    const projects = Array.from(projectsMap.values()).map(p => ({
      ...p,
      commodities: Array.from(p.commodities),
      commodity: Array.from(p.commodities).join(', '),
      projectStatus: 'Active',
      startDate: undefined,
      endDate: undefined
    }));
    
    // Calculate data completeness
    let completenessScore = 0;
    if (tenement.fmt_tenid) completenessScore += 10;
    if (tenement.type) completenessScore += 10;
    if (tenement.tenstatus) completenessScore += 10;
    if (holders.length > 0) completenessScore += 20;
    if (tenement.grantdate) completenessScore += 10;
    if (tenement.legal_area) completenessScore += 10;
    if (sites.length > 0) completenessScore += 20;
    if (projects.length > 0) completenessScore += 10;
    
    return {
      tenementNumber: tenement.fmt_tenid || tenement.tenid,
      tenementType: tenement.type,
      status: this.mapStatus(tenement.tenstatus),
      surveyStatus: tenement.survstatus,
      
      appliedDate: this.formatDate(tenement.startdate),
      grantedDate: this.formatDate(tenement.grantdate),
      expiryDate: this.formatDate(tenement.enddate),
      
      area: tenement.legal_area,
      areaUnit: tenement.unit_of_me,
      calculatedArea: tenement.st_area_the_geom,
      perimeter: tenement.st_perimeter_the_geom,
      
      holders,
      sites: processedSites,
      projects,
      
      environmentalRegistrations: [],
      production: [],
      
      informationSources: [
        {
          type: 'WA Government API',
          title: 'Department of Energy, Mines, Industry Regulation and Safety (DMIRS)',
          identifier: tenement.fmt_tenid || tenement.tenid
        }
      ],
      
      lastExtracted: new Date().toISOString(),
      dataCompleteness: completenessScore
    };
  }
  
  private parseCommodities(commodityString?: string): string[] {
    if (!commodityString) return [];
    
    return commodityString
      .split(/[,;]/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
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
      return undefined;
    }
  }
}

// Export singleton instance
export const waComprehensiveAPI = new WAComprehensiveAPI();
