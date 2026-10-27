import type { AvailabilityWindow, DoctorDashboard, DoctorProfile, PatientProfile, SlotsResponse } from '../types';
import { compact } from '../utils/format';
import { getData, getPage, putData } from './apiClient';

export interface DoctorSearchParams {
  search?: string;
  specialization?: string;
  page?: number;
  limit?: number;
}

export interface DoctorProfileInput {
  first_name: string;
  last_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
}

export const doctorApi = {
  search: (params: DoctorSearchParams) => getPage<DoctorProfile>('/doctors', compact(params)),
  get: (id: number) => getData<DoctorProfile>(`/doctors/${id}`),
  availability: (id: number) => getData<AvailabilityWindow[]>(`/doctors/${id}/availability`),
  slots: (id: number, date: string) => getData<SlotsResponse>(`/doctors/${id}/slots`, { date }),
  profile: () => getData<DoctorProfile>('/doctors/profile'),
  updateProfile: (input: DoctorProfileInput) => putData<DoctorProfile>('/doctors/profile', input),
  replaceAvailability: (windows: AvailabilityWindow[]) =>
    putData<AvailabilityWindow[]>('/doctors/availability', {
      windows: windows.map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time })),
    }),
  dashboard: () => getData<DoctorDashboard>('/doctors/dashboard'),
  patients: (params: { search?: string; page?: number; limit?: number }) =>
    getPage<PatientProfile>('/doctors/patients', compact(params)),
};
