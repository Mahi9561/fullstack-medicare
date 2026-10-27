import { z } from 'zod';
import { APPOINTMENT_STATUSES, USER_STATUSES } from '../config/constants';
import { dateString, emailSchema, nullableText, paginationQuery, passwordSchema, requiredText } from './common';

export const adminAppointmentsQuery = z.object({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  doctor_id: z.coerce.number().int().positive().optional(),
  date: dateString.optional(),
  ...paginationQuery,
});
export type AdminAppointmentsQuery = z.infer<typeof adminAppointmentsQuery>;

const doctorFields = {
  first_name: requiredText('First name', 100),
  last_name: requiredText('Last name', 100),
  specialization: requiredText('Specialization', 100),
  qualification: requiredText('Qualification', 255),
  experience_years: z.number({ invalid_type_error: 'Experience must be a number' }).int().min(0).max(80),
  consultation_fee: z.number({ invalid_type_error: 'Fee must be a number' }).min(0).max(1_000_000),
  bio: nullableText(2000),
  department_ids: z.array(z.number().int().positive()).min(1, 'Select at least one department').max(10),
};

export const createDoctorBody = z.object({
  email: emailSchema,
  password: passwordSchema,
  ...doctorFields,
});
export type CreateDoctorInput = z.infer<typeof createDoctorBody>;

export const updateDoctorBody = z.object(doctorFields);
export type UpdateDoctorInput = z.infer<typeof updateDoctorBody>;

export const doctorStatusBody = z.object({ status: z.enum(USER_STATUSES) });
export type DoctorStatusInput = z.infer<typeof doctorStatusBody>;

export const reportsQuery = z
  .object({ from: dateString.optional(), to: dateString.optional() })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: '"from" must not be after "to"', path: ['from'] });
export type ReportsQuery = z.infer<typeof reportsQuery>;
