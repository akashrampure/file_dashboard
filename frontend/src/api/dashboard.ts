import { api } from './config';
import { FirmwareData, GroupSuggestion, ModelSuggestion } from '../types';

export const firmwareApi = {
  async getFirmwareData(): Promise<FirmwareData[]> {
    const response = await api.get(`/packages`);
    if (!response.data) {
      throw new Error("Package not found");
    }
    return response.data.map((item: any) => ({
      ...item,
      isvalid: Boolean(item.isvalid),
    }));
  },

  async getGroupSuggestions(query: string): Promise<GroupSuggestion[]> {
    const response = await api.get(`/groups?groupname=${encodeURIComponent(query)}`);
    return response.data;
  },

  async getModelSuggestions(groupname: string): Promise<ModelSuggestion[]> {
    const response = await api.get(`/groups/${encodeURIComponent(groupname)}`);
    return response.data;
  },

  async addFirmware(data: FirmwareData): Promise<void> {
    if (!data.filepackagecode) {
      throw new Error("File Package Code is required");
    }

    const payload = {
      ...data,
      isvalid: Boolean(data.isvalid),
      groupid: Number(data.groupid),
      modelid: Number(data.modelid),
    };

    try {
      await api.post('/package', payload);
    } catch (error) {
      console.error("Failed to create package", error);
      throw new Error("Failed to create package");
    }
  },

  async updateFirmware(data: FirmwareData): Promise<void> {
    if (!data.filepackagecode) {
      throw new Error("File Package Code is required");
    }

    const payload = {
      ...data,
      isvalid: Boolean(data.isvalid),
      groupid: Number(data.groupid),
      modelid: Number(data.modelid),
    };

    try {
      await api.put(`/package/${data.filepackagecode}`, payload);
    } catch (error) {
      console.error("Failed to update package", error);
      throw new Error("Failed to update package");
    }
  },

  async deleteFirmware(code: string): Promise<void> {
    if (!code) {
      throw new Error("File Package Code is required");
    }

    try {
      await api.delete(`/package/${code}`);
    } catch (error) {
      console.error("Failed to delete package", error);
      throw new Error("Failed to delete package");
    }
  }
};