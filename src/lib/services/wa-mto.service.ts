/**
 * Western Australia Mineral Titles Online (MTO) Integration Service
 * 
 * This service integrates with the WA Government's open data APIs to fetch
 * real tenement data from the DMIRS-003 Mining Tenements dataset.
 */

import { 
  WATenement, 
  WATenementAPIResponse, 
  WATenementFeature,
  WATenementProperties,
  TenementSearchParams,
  TenementSearchResult,
  TenementType,
  TenementStatus
} from '@mining-hub/types';

// WA Government API endpoints
const WA_MTO_BASE_URL = 'https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/3';
const WA_WFS_URL = 'https://public-services.slip.wa.gov.au/public/services/SLIP_Public_Services/Industry_and_Mining_WFS/MapServer/WFSServer';

export class WAMTOService {
  private static instance: WAMTOService;
  
  public static getInstance(): WAMTOService {
    if (!WAMTOService.instance) {
      WAMTOService.instance = new WAMTOService();
    }
    return WAMTOService.instance;
  }

  /**
   * Search for tenements using the ArcGIS REST API - REAL DATA ONLY
   */
  async searchTenements(params: TenementSearchParams = {}): Promise<TenementSearchResult> {
    try {
      console.log('🔍 Searching REAL WA tenements with params:', params);
      console.log('🌐 Connecting to WA Government DMIRS-003 dataset...');
      
      const queryParams = this.buildQueryParams(params);
      const url = `${WA_MTO_BASE_URL}/query?${queryParams}`;
      
      console.log('📡 Fetching REAL DATA from WA Government URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HetheTrack-Mining-Hub/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`WA Government API error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data: any = await response.json();
      console.log('📊 Received REAL WA Government data:', { 
        totalFeatures: data.features?.length || 0,
        hasFeatures: !!data.features,
        dataSource: 'WA DMIRS-003 Mining Tenements',
        responseKeys: Object.keys(data),
        fullResponse: data,
        sampleFeature: data.features?.[0] ? {
          id: data.features[0].id,
          hasProperties: !!data.features[0].properties,
          propertiesKeys: data.features[0].properties ? Object.keys(data.features[0].properties) : [],
          sampleProperties: data.features[0].properties ? Object.entries(data.features[0].properties).slice(0, 10) : [],
          fullFeature: data.features[0]
        } : null
      });
      
      if (!data.features || data.features.length === 0) {
        console.warn('⚠️ No tenements returned from WA Government API');
        console.log('📋 Full API response:', data);
        return {
          tenements: [],
          total: 0,
          hasMore: false
        };
      }
      
      const tenements = data.features.map((feature: any) => {
        try {
          return this.transformFeatureToTenement(feature);
        } catch (error) {
          console.error('❌ Error transforming feature:', error, feature);
          throw error;
        }
      });
      console.log('✅ Successfully transformed', tenements.length, 'real WA tenements');
      
      return {
        tenements,
        total: tenements.length,
        hasMore: tenements.length === (params.limit || 50)
      };
    } catch (error) {
      console.error('❌ Error fetching REAL WA tenement data:', error);
      throw new Error(`Failed to fetch real WA tenement data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific tenement by ID
   */
  async getTenementById(tenementId: string): Promise<WATenement | null> {
    try {
      const result = await this.searchTenements({ 
        limit: 1 
      });
      
      // Find tenement by ID in the results
      const tenement = result.tenements.find(t => 
        t.tenid === tenementId || 
        t.name === tenementId ||
        t.sourceId === tenementId
      );
      
      return tenement || null;
    } catch (error) {
      console.error('❌ Error getting tenement by ID:', error);
      return null;
    }
  }

  /**
   * Get tenements by holder name
   */
  async getTenementsByHolder(holderName: string): Promise<WATenement[]> {
    try {
      const result = await this.searchTenements({
        holder: holderName,
        limit: 100
      });
      
      return result.tenements;
    } catch (error) {
      console.error('❌ Error getting tenements by holder:', error);
      return [];
    }
  }

  /**
   * Get sample tenements - REAL DATA ONLY
   */
  async getSampleTenements(): Promise<WATenement[]> {
    try {
      console.log('🌐 Fetching REAL tenement data from WA Government...');
      
      // Get a small sample of real tenements
      const result = await this.searchTenements({
        limit: 10
      });
      
      if (result.tenements.length === 0) {
        console.warn('⚠️ No real tenements returned from API, trying broader search...');
        
        // Try a broader search without filters
        const broadResult = await this.searchTenements({
          limit: 20
        });
        
        if (broadResult.tenements.length > 0) {
          console.log('✅ Found real tenements with broader search:', broadResult.tenements.length);
          return broadResult.tenements;
        }
      }
      
      console.log('✅ Retrieved real WA tenement data:', result.tenements.length);
      return result.tenements;
    } catch (error) {
      console.error('❌ Error getting real tenements from WA API:', error);
      // DO NOT return mock data - throw error to show real data is unavailable
      throw new Error(`Unable to fetch real WA tenement data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build query parameters for the ArcGIS REST API
   */
  private buildQueryParams(params: TenementSearchParams): string {
    const queryParams = new URLSearchParams();
    
    // Basic query parameters
    queryParams.set('f', 'json');
    queryParams.set('outFields', '*');
    queryParams.set('returnGeometry', 'true');
    queryParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryParams.set('returnCountOnly', 'false');
    queryParams.set('returnIdsOnly', 'false');
    queryParams.set('returnDistinctValues', 'false');
    queryParams.set('returnExtentOnly', 'false');
    
    // Set result limit (max 2000 for ArcGIS REST API)
    const limit = Math.min(params.limit || 50, 2000);
    queryParams.set('resultRecordCount', limit.toString());
    
    // Set offset for pagination
    if (params.offset) {
      queryParams.set('resultOffset', params.offset.toString());
    }
    
    // Build WHERE clause using actual WA Government field names
    const whereConditions: string[] = ['1=1']; // Base condition
    
    if (params.holder) {
      whereConditions.push(`UPPER(holder1) LIKE UPPER('%${params.holder.replace(/'/g, "''")}%')`);
    }
    
    if (params.type && params.type.length > 0) {
      const typeConditions = params.type.map(type => {
        // Map internal types to WA Government full names
        const typeMap: Record<string, string> = {
          'ML': 'MINING LEASE',
          'EL': 'EXPLORATION LICENCE',
          'PL': 'PROSPECTING LICENCE',
          'CML': 'COAL MINING LEASE',
          'GL': 'GENERAL PURPOSE LEASE'
        };
        const fullType = typeMap[type] || type;
        return `UPPER(type) LIKE UPPER('%${fullType}%')`;
      });
      whereConditions.push(`(${typeConditions.join(' OR ')})`);
    }
    
    if (params.status && params.status.length > 0) {
      const statusConditions = params.status.map(status => `UPPER(tenstatus) = UPPER('${status}')`);
      whereConditions.push(`(${statusConditions.join(' OR ')})`);
    }
    
    if (params.mineralField) {
      whereConditions.push(`UPPER(mineral_field) LIKE UPPER('%${params.mineralField.replace(/'/g, "''")}%')`);
    }
    
    // Area filters
    if (params.areaMin !== undefined) {
      whereConditions.push(`legal_area >= ${params.areaMin}`);
    }
    
    if (params.areaMax !== undefined) {
      whereConditions.push(`legal_area <= ${params.areaMax}`);
    }
    
    // Date filters
    if (params.expiryDateFrom) {
      const fromDate = params.expiryDateFrom.getTime();
      whereConditions.push(`enddate >= ${fromDate}`);
    }
    
    if (params.expiryDateTo) {
      const toDate = params.expiryDateTo.getTime();
      whereConditions.push(`enddate <= ${toDate}`);
    }
    
    queryParams.set('where', whereConditions.join(' AND '));
    
    // Bounding box filter
    if (params.bbox) {
      const [minLng, minLat, maxLng, maxLat] = params.bbox;
      queryParams.set('geometry', `${minLng},${minLat},${maxLng},${maxLat}`);
      queryParams.set('geometryType', 'esriGeometryEnvelope');
    }
    
    // Add ordering for consistent pagination
    queryParams.set('orderByFields', 'oid ASC');
    
    return queryParams.toString();
  }

  /**
   * Get total count of tenements matching search criteria
   */
  async getTenementCount(params: TenementSearchParams = {}): Promise<number> {
    try {
      const queryParams = this.buildQueryParams(params);
      const countParams = new URLSearchParams(queryParams);
      countParams.set('returnCountOnly', 'true');
      countParams.delete('resultRecordCount');
      countParams.delete('resultOffset');
      
      const url = `${WA_MTO_BASE_URL}/query?${countParams}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HetheTrack-Mining-Hub/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`WA Government API error! status: ${response.status}`);
      }
      
      const data: any = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('❌ Error getting tenement count:', error);
      return 0;
    }
  }

  /**
   * Transform API feature to internal tenement format - CAPTURING ALL FIELDS
   */
  private transformFeatureToTenement(feature: any): WATenement {
    // WA Government API uses 'attributes' instead of 'properties'
    const props = feature.attributes || feature.properties || {};
    
    console.log('🔄 Transforming feature with ALL fields:', { 
      hasAttributes: !!feature.attributes,
      hasProperties: !!feature.properties,
      totalFields: Object.keys(props).length,
      allFields: Object.keys(props),
      sampleProps: Object.entries(props).slice(0, 10)
    });
    
    // Core identification fields
    const oid = Number(props.oid) || 0;
    const gid = Number(props.gid) || 0;
    const tenid = String(props.tenid || 'Unknown').trim();
    const tentype = String(props.type || 'Other').trim();
    const fmt_tenid = String(props.fmt_tenid || props.tenid || 'Unknown').trim();
    const status = String(props.tenstatus || 'Unknown').trim();
    const survstatus = String(props.survstatus || 'Unknown').trim();
    
    // Holder information (all 9 possible holders)
    const holdercnt = Number(props.holdercnt) || 1;
    const holder1 = String(props.holder1 || 'Unknown').trim();
    const addr1 = props.addr1 ? String(props.addr1).trim() : undefined;
    const holder2 = props.holder2 ? String(props.holder2).trim() : undefined;
    const addr2 = props.addr2 ? String(props.addr2).trim() : undefined;
    const holder3 = props.holder3 ? String(props.holder3).trim() : undefined;
    const addr3 = props.addr3 ? String(props.addr3).trim() : undefined;
    const holder4 = props.holder4 ? String(props.holder4).trim() : undefined;
    const addr4 = props.addr4 ? String(props.addr4).trim() : undefined;
    const holder5 = props.holder5 ? String(props.holder5).trim() : undefined;
    const addr5 = props.addr5 ? String(props.addr5).trim() : undefined;
    const holder6 = props.holder6 ? String(props.holder6).trim() : undefined;
    const addr6 = props.addr6 ? String(props.addr6).trim() : undefined;
    const holder7 = props.holder7 ? String(props.holder7).trim() : undefined;
    const addr7 = props.addr7 ? String(props.addr7).trim() : undefined;
    const holder8 = props.holder8 ? String(props.holder8).trim() : undefined;
    const addr8 = props.addr8 ? String(props.addr8).trim() : undefined;
    const holder9 = props.holder9 ? String(props.holder9).trim() : undefined;
    const addr9 = props.addr9 ? String(props.addr9).trim() : undefined;
    
    // Area and measurement fields
    const legal_area = Number(props.legal_area) || 0;
    const unit_of_me = String(props.unit_of_me || 'HA.').trim();
    const st_area_geom = Number(props['st_area(the_geom)']) || 0;
    const st_perimeter_geom = Number(props['st_perimeter(the_geom)']) || 0;
    
    // Date fields
    const extract_da = this.parseDate(props.extract_da) || new Date();
    const grantdate = this.parseDate(props.grantdate);
    const granttime = props.granttime ? String(props.granttime).trim() : undefined;
    const startdate = this.parseDate(props.startdate);
    const starttime = props.starttime ? String(props.starttime).trim() : undefined;
    const enddate = this.parseDate(props.enddate);
    const endtime = props.endtime ? String(props.endtime).trim() : undefined;
    
    // Special fields
    const special_in = props.special_in ? String(props.special_in).trim() : undefined;
    
    return {
      // Core identification
      oid,
      gid,
      tenid,
      type: this.mapTenementType(tentype),
      name: fmt_tenid,
      fmt_tenid,
      
      // Status information
      status: this.mapTenementStatus(status),
      statusDate: extract_da,
      survstatus,
      
      // All holder information
      holdercnt,
      holder1,
      addr1,
      holder2,
      addr2,
      holder3,
      addr3,
      holder4,
      addr4,
      holder5,
      addr5,
      holder6,
      addr6,
      holder7,
      addr7,
      holder8,
      addr8,
      holder9,
      addr9,
      
      // Dates and times
      extract_da,
      grantdate,
      granttime,
      startdate,
      starttime,
      enddate,
      endtime,
      
      // Area and measurements
      legal_area,
      unit_of_me,
      st_area_geom,
      st_perimeter_geom,
      
      // Special indicators
      special_in,
      
      // Geographic data
      geometry: feature.geometry,
      centroid: this.calculateCentroid(feature.geometry),
      
      // Legacy compatibility fields
      mineralField: undefined, // Not available in WA API
      localGovernment: undefined, // Not available in WA API
      rentDue: undefined, // Not available in WA API
      expenditureCommitment: undefined, // Not available in WA API
      
      // Metadata
      lastUpdated: new Date(),
      sourceId: String(oid),
      
      // Computed compatibility fields
      holder: holder1,
      holderAddress: addr1,
      area: legal_area,
      applicationDate: startdate || extract_da,
      grantDate: grantdate,
      expiryDate: enddate
    };
  }

  /**
   * Parse date string safely
   */
  private parseDate(dateStr: any): Date | undefined {
    if (!dateStr) return undefined;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Map API tenement type to internal enum
   */
  private mapTenementType(apiType: string): TenementType {
    const typeMap: Record<string, TenementType> = {
      'ML': 'ML',
      'MINING LEASE': 'ML',
      'EL': 'EL',
      'EXPLORATION LICENCE': 'EL',
      'PL': 'PL',
      'PROSPECTING LICENCE': 'PL',
      'GL': 'GL',
      'GENERAL PURPOSE LEASE': 'GL',
      'RL': 'RL',
      'RETENTION LICENCE': 'RL',
      'MPL': 'MPL',
      'MISCELLANEOUS PURPOSES LICENCE': 'MPL',
      'SML': 'SML',
      'SPECIAL MINING LEASE': 'SML',
      'EPL': 'EPL',
      'EXTRACTIVE PURPOSES LICENCE': 'EPL',
      'CML': 'CML',
      'COAL MINING LEASE': 'CML'
    };
    
    // Handle both abbreviated and full names
    const upperType = apiType.toUpperCase().trim();
    return typeMap[upperType] || 'Other';
  }

  /**
   * Map API tenement status to internal enum
   */
  private mapTenementStatus(apiStatus: string): TenementStatus {
    const statusMap: Record<string, TenementStatus> = {
      'LIVE': 'Live',
      'Live': 'Live',
      'PENDING': 'Pending',
      'Pending': 'Pending',
      'GRANTED': 'Granted',
      'Granted': 'Granted',
      'EXPIRED': 'Expired',
      'Expired': 'Expired',
      'SURRENDERED': 'Surrendered',
      'Surrendered': 'Surrendered',
      'FORFEITED': 'Forfeited',
      'Forfeited': 'Forfeited',
      'WITHDRAWN': 'Withdrawn',
      'Withdrawn': 'Withdrawn',
      'REFUSED': 'Refused',
      'Refused': 'Refused',
      'CANCELLED': 'Cancelled',
      'Cancelled': 'Cancelled',
      'SUSPENDED': 'Suspended',
      'Suspended': 'Suspended'
    };
    
    const upperStatus = apiStatus.toUpperCase().trim();
    return statusMap[upperStatus] || 'Other';
  }

  /**
   * Calculate centroid from geometry (simplified)
   */
  private calculateCentroid(geometry: any): { latitude: number; longitude: number } | undefined {
    if (!geometry || !geometry.coordinates) return undefined;
    
    try {
      // Simple centroid calculation for polygon
      if (geometry.type === 'Polygon' && geometry.coordinates[0]) {
        const coords = geometry.coordinates[0];
        const sumLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
        const sumLng = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
        
        return {
          latitude: sumLat / coords.length,
          longitude: sumLng / coords.length
        };
      }
      
      // For other geometry types, return first coordinate
      if (geometry.coordinates[0]) {
        return {
          latitude: geometry.coordinates[0][1] || 0,
          longitude: geometry.coordinates[0][0] || 0
        };
      }
    } catch (error) {
      console.warn('Failed to calculate centroid:', error);
    }
    
    return undefined;
  }

  /**
   * Get comprehensive tenement statistics from real WA data
   */
  async getTenementStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalArea: number;
  }> {
    try {
      console.log('📊 Fetching comprehensive WA tenement statistics...');
      
      // Get a larger sample for better statistics
      const result = await this.searchTenements({
        limit: 100
      });
      
      const stats = {
        total: result.tenements.length,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        totalArea: 0
      };
      
      result.tenements.forEach(tenement => {
        // Count by status
        stats.byStatus[tenement.status] = (stats.byStatus[tenement.status] || 0) + 1;
        
        // Count by type
        stats.byType[tenement.type] = (stats.byType[tenement.type] || 0) + 1;
        
        // Sum total area
        stats.totalArea += tenement.area;
      });
      
      console.log('✅ Generated real WA tenement statistics:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error generating tenement statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const waMTOService = WAMTOService.getInstance();
