import { z } from 'zod';
import { booleanQuery, nullableText, paginationQuery, requiredText } from './common';

export const listMedicationsQuery = z.object({
  search: z.string().trim().max(100).optional(),
  active: booleanQuery.optional(),
  ...paginationQuery,
});
export type ListMedicationsQuery = z.infer<typeof listMedicationsQuery>;

export const medicationBody = z.object({
  name: requiredText('Name', 150),
  description: nullableText(500),
});
export type MedicationInput = z.infer<typeof medicationBody>;

export const activeStatusBody = z.object({ is_active: z.boolean({ required_error: 'is_active is required' }) });
export type ActiveStatusInput = z.infer<typeof activeStatusBody>;
