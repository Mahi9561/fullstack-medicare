import type { Medication } from '../types';
import { compact } from '../utils/format';
import { getPage, patchData, postData, putData } from './apiClient';

export interface MedicationInput {
  name: string;
  description: string | null;
}

export const medicationApi = {
  list: (params: { search?: string; active?: boolean; page?: number; limit?: number }) =>
    getPage<Medication>('/medications', compact(params)),
  create: (input: MedicationInput) => postData<Medication>('/medications', input),
  update: (id: number, input: MedicationInput) => putData<Medication>(`/medications/${id}`, input),
  setActive: (id: number, is_active: boolean) => patchData<Medication>(`/medications/${id}/status`, { is_active }),
};
