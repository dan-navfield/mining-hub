import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface HolderQuery {
  page?: number;
  limit?: number;
  search?: string;
  jurisdiction?: string;
  minTenements?: number;
  maxTenements?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HolderRecord {
  name: string;
  slug: string;
  totalTenements: number;
  totalActions: number;
  totalValue: number;
  overdueActions: number;
  upcomingActions: number;
  jurisdictions: string[];
  primaryCommodity: string;
  lastActivity: string;
}

export interface PaginatedHoldersResponse {
  data: HolderRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class HoldersService {
  private readonly logger = new Logger(HoldersService.name);

  constructor(private supabase: SupabaseService) {}

  async findMany(query: HolderQuery): Promise<PaginatedHoldersResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      jurisdiction,
      minTenements,
      maxTenements,
      sortBy = 'totalTenements',
      sortOrder = 'desc'
    } = query;

    // Validate and sanitize inputs
    const validatedPage = Math.max(1, parseInt(String(page)));
    const validatedLimit = Math.min(100, Math.max(1, parseInt(String(limit))));
    const offset = (validatedPage - 1) * validatedLimit;

    try {
      // Use a simpler approach with Supabase's built-in aggregation
      // First, get all unique holders with basic filtering
      let baseQuery = this.supabase.getServiceRoleClient()
        .from('tenements')
        .select('holder_name, jurisdiction, type, last_sync_at', { count: 'exact' })
        .not('holder_name', 'is', null)
        .neq('holder_name', '')
        .neq('holder_name', 'Unknown')
        .neq('holder_name', 'Unknown Holder')
        .neq('holder_name', 'MINISTERIAL')
        .neq('holder_name', 'N/A')
        .gt('holder_name', '  '); // Length > 2

      // Apply filters
      if (search) {
        baseQuery = baseQuery.ilike('holder_name', `%${search}%`);
      }

      if (jurisdiction) {
        baseQuery = baseQuery.eq('jurisdiction', jurisdiction);
      }

      const { data: allTenements, error: tenementsError, count: totalTenements } = await baseQuery;

      if (tenementsError) {
        this.logger.error('Error fetching tenements for aggregation:', tenementsError);
        throw tenementsError;
      }

      // Group tenements by holder in memory (this is more efficient than complex SQL for this use case)
      const holderMap = new Map<string, {
        name: string;
        tenements: any[];
        jurisdictions: Set<string>;
        lastActivity: string;
      }>();

      (allTenements || []).forEach(tenement => {
        const holderName = tenement.holder_name;
        if (!holderMap.has(holderName)) {
          holderMap.set(holderName, {
            name: holderName,
            tenements: [],
            jurisdictions: new Set(),
            lastActivity: tenement.last_sync_at || ''
          });
        }
        
        const holder = holderMap.get(holderName)!;
        holder.tenements.push(tenement);
        holder.jurisdictions.add(tenement.jurisdiction);
        if (tenement.last_sync_at && tenement.last_sync_at > holder.lastActivity) {
          holder.lastActivity = tenement.last_sync_at;
        }
      });

      // Convert to array and apply tenement count filters
      let holders = Array.from(holderMap.values()).map(holder => {
        const slug = holder.name.toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        // Determine primary commodity
        let primaryCommodity = 'Mining';
        const types = holder.tenements.map(t => t.type?.toLowerCase() || '');
        if (types.some(type => type.includes('gold'))) {
          primaryCommodity = 'Gold';
        } else if (types.some(type => type.includes('iron'))) {
          primaryCommodity = 'Iron Ore';
        } else if (types.some(type => type.includes('copper'))) {
          primaryCommodity = 'Copper';
        } else if (types.some(type => type.includes('lithium'))) {
          primaryCommodity = 'Lithium';
        }

        return {
          name: holder.name,
          slug,
          totalTenements: holder.tenements.length,
          totalActions: 0, // TODO: Implement action aggregation
          totalValue: 0, // TODO: Implement value calculation
          overdueActions: 0, // TODO: Implement overdue actions
          upcomingActions: 0, // TODO: Implement upcoming actions
          jurisdictions: Array.from(holder.jurisdictions),
          primaryCommodity,
          lastActivity: holder.lastActivity,
        };
      });

      // Apply tenement count filters
      if (minTenements !== undefined) {
        holders = holders.filter(h => h.totalTenements >= minTenements);
      }
      if (maxTenements !== undefined) {
        holders = holders.filter(h => h.totalTenements <= maxTenements);
      }

      // Sort holders
      const validSortFields = ['name', 'totalTenements', 'totalActions', 'totalValue', 'lastActivity'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'totalTenements';
      
      holders.sort((a, b) => {
        let aVal = a[sortField as keyof typeof a];
        let bVal = b[sortField as keyof typeof b];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (sortOrder === 'desc') {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });

      const total = holders.length;
      const totalPages = Math.ceil(total / validatedLimit);

      // Apply pagination
      const paginatedHolders = holders.slice(offset, offset + validatedLimit);

      return {
        data: paginatedHolders,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages,
          hasNext: validatedPage < totalPages,
          hasPrev: validatedPage > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error in findMany:', error);
      throw error;
    }
  }

  async findOneBySlug(slug: string): Promise<HolderRecord | null> {
    try {
      // Convert slug back to holder name pattern for search
      const holderNamePattern = slug.replace(/-/g, '%');
      
      const { data: tenements, error } = await this.supabase.getServiceRoleClient()
        .from('tenements')
        .select('*')
        .ilike('holder_name', `%${holderNamePattern}%`)
        .limit(1);

      if (error || !tenements || tenements.length === 0) {
        throw new NotFoundException('Holder not found');
      }

      const holderName = tenements[0].holder_name;
      
      // Get full holder data using the same aggregation logic
      const holders = await this.findMany({ 
        search: holderName, 
        limit: 1 
      });

      return holders.data[0] || null;
    } catch (error) {
      this.logger.error(`Error finding holder by slug ${slug}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to fetch holder');
    }
  }

  async getStats() {
    try {
      // Get basic stats using simple queries
      const { data: tenements, error } = await this.supabase.getServiceRoleClient()
        .from('tenements')
        .select('holder_name, jurisdiction')
        .not('holder_name', 'is', null)
        .neq('holder_name', '')
        .neq('holder_name', 'Unknown')
        .neq('holder_name', 'Unknown Holder')
        .neq('holder_name', 'MINISTERIAL')
        .neq('holder_name', 'N/A')
        .gt('holder_name', '  ');

      if (error) {
        this.logger.error('Error getting stats:', error);
        throw error;
      }

      const uniqueHolders = new Set((tenements || []).map(t => t.holder_name));
      const uniqueJurisdictions = new Set((tenements || []).map(t => t.jurisdiction));

      return {
        total_holders: uniqueHolders.size,
        total_tenements: tenements?.length || 0,
        total_jurisdictions: uniqueJurisdictions.size,
        avg_tenements_per_holder: uniqueHolders.size > 0 ? (tenements?.length || 0) / uniqueHolders.size : 0
      };
    } catch (error) {
      this.logger.error('Error in getStats:', error);
      throw error;
    }
  }
}
