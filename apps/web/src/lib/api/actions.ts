import { apiClient } from './client';
import {
  Action,
  ActionQuery,
  CreateActionRequest,
  UpdateActionRequest,
  BulkUpdateActionsRequest,
  PaginatedResponse,
} from '@mining-hub/types';

class ActionsAPI {
  async getAll(query: ActionQuery): Promise<PaginatedResponse<Action>> {
    const response = await apiClient.get('/actions', { params: query });
    return response.data;
  }

  async getById(id: string): Promise<Action> {
    const response = await apiClient.get(`/actions/${id}`);
    return response.data;
  }

  async getUpcoming(days?: number): Promise<Action[]> {
    const response = await apiClient.get('/actions/upcoming', { 
      params: days ? { days } : {} 
    });
    return response.data;
  }

  async getOverdue(): Promise<Action[]> {
    const response = await apiClient.get('/actions/overdue');
    return response.data;
  }

  async create(data: CreateActionRequest): Promise<Action> {
    const response = await apiClient.post('/actions', data);
    return response.data;
  }

  async update(id: string, data: UpdateActionRequest): Promise<Action> {
    const response = await apiClient.patch(`/actions/${id}`, data);
    return response.data;
  }

  async bulkUpdate(data: BulkUpdateActionsRequest): Promise<{ updated: number }> {
    const response = await apiClient.post('/actions/bulk', data);
    return response.data;
  }
}

export const actionsApi = new ActionsAPI();
