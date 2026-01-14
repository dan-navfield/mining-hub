import { apiClient } from './client';
import {
  Tenement,
  TenementQuery,
  CreateTenementRequest,
  UpdateTenementRequest,
  PaginatedResponse,
} from '@mining-hub/types';

class TenementsAPI {
  async getAll(query: TenementQuery): Promise<PaginatedResponse<Tenement>> {
    const response = await apiClient.get('/tenements', { params: query });
    return response.data;
  }

  async getById(id: string): Promise<Tenement> {
    const response = await apiClient.get(`/tenements/${id}`);
    return response.data;
  }

  async create(data: CreateTenementRequest): Promise<Tenement> {
    const response = await apiClient.post('/tenements', data);
    return response.data;
  }

  async update(id: string, data: UpdateTenementRequest): Promise<Tenement> {
    const response = await apiClient.patch(`/tenements/${id}`, data);
    return response.data;
  }

  async importCsv(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/tenements/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const tenementsApi = new TenementsAPI();
