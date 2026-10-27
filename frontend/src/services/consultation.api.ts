import type { Consultation } from '../types';
import { getData, getPage, postData, putData } from './apiClient';

export interface ConsultationInput {
  symptoms: string;
  diagnosis: string;
  notes: string | null;
}

export const consultationApi = {
  create: (input: ConsultationInput & { appointment_id: number }) => postData<Consultation>('/consultations', input),
  list: (params: { page?: number; limit?: number }) => getPage<Consultation>('/consultations', params),
  get: (id: number) => getData<Consultation>(`/consultations/${id}`),
  update: (id: number, input: Partial<ConsultationInput>) => putData<Consultation>(`/consultations/${id}`, input),
};
