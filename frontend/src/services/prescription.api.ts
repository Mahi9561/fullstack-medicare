import type { Prescription } from '../types';
import { getData, getPage, postData, putData } from './apiClient';

export interface PrescriptionItemInput {
  medication_id: number;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string | null;
}

export interface PrescriptionInput {
  notes: string | null;
  items: PrescriptionItemInput[];
}

export const prescriptionApi = {
  create: (input: PrescriptionInput & { consultation_id: number }) => postData<Prescription>('/prescriptions', input),
  list: (params: { page?: number; limit?: number }) => getPage<Prescription>('/prescriptions', params),
  get: (id: number) => getData<Prescription>(`/prescriptions/${id}`),
  update: (id: number, input: PrescriptionInput) => putData<Prescription>(`/prescriptions/${id}`, input),
};
