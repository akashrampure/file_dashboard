import axios from 'axios';

export type SearchResult = string;
export type DetailResult = Record<string, any>;

// const API_BASE_URL = "https://products.intellicar.in/api/v1/products";
const API_BASE_URL = "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const jsonApis = {
  getAllRecords: async (): Promise<SearchResult[]> => {
    const response = await api.get('/cansettings/all');
    return response.data;
  },

  getAllNrfSettings: async (): Promise<SearchResult[]> => {
    const response = await api.get('/nrfsettings/all');
    return response.data;
  },

  getNrfSettingsDetails: async (id: string): Promise<DetailResult> => {
    const response = await api.get(`/nrfsettings/${encodeURIComponent(id)}`);
    return response.data;
  },

  getRecordDetails: async (id: string): Promise<DetailResult> => {
    const response = await api.get(`/cansettings/${encodeURIComponent(id)}`);
    return response.data;
  },
};