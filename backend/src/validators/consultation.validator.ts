import { z } from 'zod';
import { paginationQuery, requiredText } from './common';

export const createConsultationBody = z.object({
  appointment_id: z.number({ invalid_type_error: 'Choose an appointment' }).int().positive(),
  symptoms: requiredText('Symptoms', 5000),
  diagnosis: requiredText('Diagnosis', 5000),
  notes: z.string().trim().max(5000).nullish().transform((v) => (v ? v : null)),
});
export type CreateConsultationInput = z.infer<typeof createConsultationBody>;

export const updateConsultationBody = z
  .object({
    symptoms: requiredText('Symptoms', 5000).optional(),
    diagnosis: requiredText('Diagnosis', 5000).optional(),
    notes: z
      .string()
      .trim()
      .max(5000)
      .nullish()
      .transform((v) => (v === undefined ? undefined : v || null)),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Nothing to update' });
export type UpdateConsultationInput = z.infer<typeof updateConsultationBody>;

export const listConsultationsQuery = z.object(paginationQuery);
