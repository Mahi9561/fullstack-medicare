import type {
  Consultation,
  Gender,
  MedicalRecord,
  PatientDashboard,
  PatientHistory,
  PatientProfile,
  Prescription,
} from '../types';
import { getData, getPage, putData } from './apiClient';

export interface PatientProfileInput {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  address: string | null;
  emergency_contact: string | null;
}

interface Page {
  page?: number;
  limit?: number;
}

export const patientApi = {
  profile: () => getData<PatientProfile>('/patients/profile'),
  updateProfile: (input: PatientProfileInput) => putData<PatientProfile>('/patients/profile', input),
  dashboard: () => getData<PatientDashboard>('/patients/dashboard'),
  consultations: (params: Page) => getPage<Consultation>('/patients/consultations', params),
  prescriptions: (params: Page) => getPage<Prescription>('/patients/prescriptions', params),
  medicalRecords: (params: Page) => getPage<MedicalRecord>('/patients/medical-records', params),
  get: (id: number) => getData<PatientProfile>(`/patients/${id}`),
  history: (id: number) => getData<PatientHistory>(`/patients/${id}/history`),
};
