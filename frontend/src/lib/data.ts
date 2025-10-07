import axios from 'axios';
import { FirmwareData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const firmwareApi = {
  async getFirmwareData(): Promise<FirmwareData[]> {
    const response = await api.get('/firmware');
    return response.data;
  },

  async addFirmware(data: FirmwareData): Promise<void> {
    await api.post('/firmware', data);
  },

  async updateFirmware(data: FirmwareData): Promise<void> {
    await api.put(`/firmware/${data.filepackagecode}`, data);
  },

  async deleteFirmware(code: string): Promise<void> {
    await api.delete(`/firmware/${code}`);
  }
};

export { api }