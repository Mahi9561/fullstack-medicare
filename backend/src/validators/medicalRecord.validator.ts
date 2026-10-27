import { z } from 'zod';
import { RECORD_TYPES } from '../config/constants';
import { pastOrTodayDate, requiredText } from './common';

export const createMedicalRecordBody = z.object({
  patient_id: z.number({ invalid_type_error: 'Choose a patient' }).int().positive(),
  title: requiredText('Title', 200),
  record_type: z.enum(RECORD_TYPES),
  description: requiredText('Description', 5000),
  record_date: pastOrTodayDate,
});
export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordBody>;
