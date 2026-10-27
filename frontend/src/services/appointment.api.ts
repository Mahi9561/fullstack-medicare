import type { Appointment, AppointmentStatus, VitalSigns } from '../types';
import { compact } from '../utils/format';
import { getData, getPage, patchData, postData, putData } from './apiClient';

export interface AppointmentListParams {
  scope?: 'upcoming' | 'history';
  status?: AppointmentStatus;
  date?: string;
  page?: number;
  limit?: number;
}

export interface BookAppointmentInput {
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  reason: string;
}

export interface VitalSignsInput {
  bp_systolic: number | null;
  bp_diastolic: number | null;
  heart_rate: number | null;
  temperature_f: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  spo2: number | null;
}

export const appointmentApi = {
  list: (params: AppointmentListParams) => getPage<Appointment>('/appointments', compact(params)),
  get: (id: number) => getData<Appointment>(`/appointments/${id}`),
  book: (input: BookAppointmentInput) => postData<Appointment>('/appointments', input),
  confirm: (id: number) => patchData<Appointment>(`/appointments/${id}/confirm`),
  cancel: (id: number, reason: string | null) => patchData<Appointment>(`/appointments/${id}/cancel`, { reason }),
  complete: (id: number) => patchData<Appointment>(`/appointments/${id}/complete`),
  markNoShow: (id: number) => patchData<Appointment>(`/appointments/${id}/no-show`),
  saveVitals: (id: number, input: VitalSignsInput) => putData<VitalSigns>(`/appointments/${id}/vital-signs`, input),
  getVitals: (id: number) => getData<VitalSigns | null>(`/appointments/${id}/vital-signs`),
};
