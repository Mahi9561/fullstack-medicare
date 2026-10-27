import type { AdminDashboard, AdminReport, Appointment, AppointmentStatus, DoctorProfile, PatientProfile, UserStatus } from '../types';
import { compact } from '../utils/format';
import { getData, getPage, patchData, postData, putData } from './apiClient';

export interface AdminDoctorInput {
  first_name: string;
  last_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
  department_ids: number[];
}

export interface AdminCreateDoctorInput extends AdminDoctorInput {
  email: string;
  password: string;
}

interface SearchPage {
  search?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  dashboard: () => getData<AdminDashboard>('/admin/dashboard'),
  reports: (params: { from?: string; to?: string }) => getData<AdminReport>('/admin/reports', compact(params)),
  doctors: (params: SearchPage) => getPage<DoctorProfile>('/admin/doctors', compact(params)),
  createDoctor: (input: AdminCreateDoctorInput) => postData<DoctorProfile>('/admin/doctors', input),
  updateDoctor: (id: number, input: AdminDoctorInput) => putData<DoctorProfile>(`/admin/doctors/${id}`, input),
  setDoctorStatus: (id: number, status: UserStatus) => patchData<DoctorProfile>(`/admin/doctors/${id}/status`, { status }),
  patients: (params: SearchPage) => getPage<PatientProfile>('/admin/patients', compact(params)),
  appointments: (params: { status?: AppointmentStatus; doctor_id?: number; date?: string; page?: number; limit?: number }) =>
    getPage<Appointment>('/admin/appointments', compact(params)),
};
