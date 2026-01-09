import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateActionDto, UpdateActionDto, ActionFiltersDto, ActionStatus } from './dto/actions.dto';

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);

  constructor(private supabase: SupabaseService) {}

  async findAll(filters: ActionFiltersDto) {
    try {
      let query = this.supabase.getServiceRoleClient()
        .from('actions')
        .select(`
          *,
          tenements!actions_tenement_id_fkey (
            id,
            number,
            jurisdiction,
            type,
            status,
            holder_name
          )
        `);

      // Apply filters
      if (filters.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
      }

      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.tenement_number) {
        query = query.ilike('tenement_number', `%${filters.tenement_number}%`);
      }

      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }

      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      if (filters.data_source) {
        query = query.eq('data_source', filters.data_source);
      }

      if (filters.search) {
        query = query.or(`action_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,comments.ilike.%${filters.search}%`);
      }

      // Sorting
      const sortBy = filters.sort_by || 'due_date';
      const sortOrder = filters.sort_order || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .limit(limit);

      if (error) {
        this.logger.error('Error fetching actions:', error);
        throw error;
      }

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .select(`
          *,
          tenements!actions_tenement_id_fkey (
            id,
            number,
            jurisdiction,
            type,
            status,
            holder_name,
            area_ha
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error('Error fetching action:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  async findByTenement(tenementId: string) {
    try {
      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .select('*')
        .eq('tenement_id', tenementId)
        .order('due_date', { ascending: true });

      if (error) {
        this.logger.error('Error fetching tenement actions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in findByTenement:', error);
      throw error;
    }
  }

  async getUpcoming(days: number = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .select(`
          *,
          tenements!actions_tenement_id_fkey (
            id,
            number,
            jurisdiction,
            type,
            status,
            holder_name
          )
        `)
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) {
        this.logger.error('Error fetching upcoming actions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in getUpcoming:', error);
      throw error;
    }
  }

  async getOverdue() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .select(`
          *,
          tenements!actions_tenement_id_fkey (
            id,
            number,
            jurisdiction,
            type,
            status,
            holder_name
          )
        `)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) {
        this.logger.error('Error fetching overdue actions:', error);
        throw error;
      }

      // Also update status to overdue
      if (data && data.length > 0) {
        const overdueIds = data.map(action => action.id);
        await this.supabase.getServiceRoleClient()
          .from('actions')
          .update({ status: 'overdue' })
          .in('id', overdueIds);
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in getOverdue:', error);
      throw error;
    }
  }

  async getStats(jurisdiction?: string) {
    try {
      let query = this.supabase.getServiceRoleClient()
        .from('actions')
        .select('status, action_type, amount, due_date');

      if (jurisdiction) {
        query = query.eq('jurisdiction', jurisdiction);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Error fetching action stats:', error);
        throw error;
      }

      const today = new Date().toISOString().split('T')[0];
      const stats = {
        total: data?.length || 0,
        by_status: {
          pending: 0,
          completed: 0,
          overdue: 0,
          cancelled: 0,
        },
        by_type: {},
        upcoming_30_days: 0,
        total_amount: 0,
        overdue_amount: 0,
      };

      data?.forEach(action => {
        // Status counts
        stats.by_status[action.status] = (stats.by_status[action.status] || 0) + 1;

        // Type counts
        stats.by_type[action.action_type] = (stats.by_type[action.action_type] || 0) + 1;

        // Upcoming actions (next 30 days)
        const dueDate = new Date(action.due_date);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        if (action.status === 'pending' && dueDate >= new Date() && dueDate <= thirtyDaysFromNow) {
          stats.upcoming_30_days++;
        }

        // Amount calculations
        if (action.amount) {
          stats.total_amount += parseFloat(action.amount);
          
          if (action.status === 'overdue' || (action.status === 'pending' && action.due_date < today)) {
            stats.overdue_amount += parseFloat(action.amount);
          }
        }
      });

      return stats;
    } catch (error) {
      this.logger.error('Error in getStats:', error);
      throw error;
    }
  }

  async create(createActionDto: CreateActionDto) {
    try {
      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .insert([createActionDto])
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating action:', error);
        throw error;
      }

      this.logger.log(`Created action: ${data.action_name} for tenement ${data.tenement_number}`);
      return data;
    } catch (error) {
      this.logger.error('Error in create:', error);
      throw error;
    }
  }

  async update(id: string, updateActionDto: UpdateActionDto) {
    try {
      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .update(updateActionDto)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error('Error updating action:', error);
        throw error;
      }

      this.logger.log(`Updated action: ${id}`);
      return data;
    } catch (error) {
      this.logger.error('Error in update:', error);
      throw error;
    }
  }

  async markComplete(id: string, completedDate?: string) {
    try {
      const updateData = {
        status: ActionStatus.COMPLETED,
        completed_date: completedDate || new Date().toISOString().split('T')[0],
      };

      const { data, error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error('Error completing action:', error);
        throw error;
      }

      this.logger.log(`Completed action: ${id}`);
      return data;
    } catch (error) {
      this.logger.error('Error in markComplete:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const { error } = await this.supabase.getServiceRoleClient()
        .from('actions')
        .delete()
        .eq('id', id);

      if (error) {
        this.logger.error('Error deleting action:', error);
        throw error;
      }

      this.logger.log(`Deleted action: ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Error in remove:', error);
      throw error;
    }
  }

  // Sync actions from external sources (e.g., MTO)
  async syncFromExternalSource(jurisdiction: string, dataSource: string) {
    try {
      this.logger.log(`Starting sync from ${dataSource} for ${jurisdiction}`);
      
      // TODO: Implement actual sync logic based on jurisdiction
      // This would call the appropriate external API and create/update actions
      
      // For now, just log the sync attempt
      this.logger.log(`Sync completed for ${jurisdiction} from ${dataSource}`);
      
      return {
        success: true,
        message: `Sync completed for ${jurisdiction}`,
        synced_count: 0, // Would be actual count
      };
    } catch (error) {
      this.logger.error('Error in syncFromExternalSource:', error);
      throw error;
    }
  }
}
