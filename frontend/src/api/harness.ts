import { api } from './config';
import { HarnessData } from '../types';

export const harnessApi = {
  async getAllVehicles(): Promise<HarnessData[]> {
    const response = await api.get('/vehicles');
    return response.data;
  },

  async getVehicle(slno: number): Promise<HarnessData> {
    const response = await api.get(`/vehicle/${slno}`);
    return response.data;
  },

  async createVehicle(data: any): Promise<void> {
    await api.post('/vehicle', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async updateVehicle(params: string, data: any): Promise<void> {
    await api.put(`/vehicle/${params}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async deleteVehicle(params: string): Promise<void> {
    await api.delete(`/vehicle/${params}`);
  },

  async uploadFile(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  },

  async getFileContent(folder: string, filename: string): Promise<Blob> {
    const response = await api.get('/file/download', {
      params: { folder, filename },
      responseType: 'blob',
      timeout: 60000,
    });
    return response.data;
  },

  async downloadFile(folder: string, filename: string): Promise<void> {
    try {
      const blob = await this.getFileContent(folder, filename);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
};