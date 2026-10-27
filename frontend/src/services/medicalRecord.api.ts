import type { MedicalRecord, RecordType } from '../types';
import { postData } from './apiClient';

export interface MedicalRecordInput {
  patient_id: number;
  title: string;
  record_type: RecordType;
  description: string;
  record_date: string;
}

export const medicalRecordApi = {
  create: (input: MedicalRecordInput) => postData<MedicalRecord>('/medical-records', input),
};
