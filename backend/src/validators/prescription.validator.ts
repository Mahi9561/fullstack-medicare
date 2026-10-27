import { z } from 'zod';
import { nullableText, paginationQuery, requiredText } from './common';

const itemSchema = z.object({
  medication_id: z.number({ invalid_type_error: 'Choose a medication' }).int().positive(),
  dosage: requiredText('Dosage', 100),
  frequency: requiredText('Frequency', 100),
  duration_days: z.number({ invalid_type_error: 'Duration must be a number' }).int().min(1, 'At least 1 day').max(365, 'At most 365 days'),
  instructions: nullableText(255),
});

const items = z.array(itemSchema).min(1, 'Add at least one medication').max(20, 'At most 20 medications');

export const createPrescriptionBody = z.object({
  consultation_id: z.number({ invalid_type_error: 'Choose a consultation' }).int().positive(),
  notes: nullableText(2000),
  items,
});
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionBody>;

export const updatePrescriptionBody = z.object({ notes: nullableText(2000), items });
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionBody>;

export const listPrescriptionsQuery = z.object(paginationQuery);
