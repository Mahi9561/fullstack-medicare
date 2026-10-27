import { z } from 'zod';
import { DAYS_OF_WEEK } from '../config/constants';
import { dateString, nullableText, paginationQuery, requiredText, timeString } from './common';

export const listDoctorsQuery = z.object({
  search: z.string().trim().max(100).optional(),
  specialization: z.string().trim().max(100).optional(),
  ...paginationQuery,
});
export type ListDoctorsQuery = z.infer<typeof listDoctorsQuery>;

export const slotsQuery = z.object({ date: dateString });
export type SlotsQuery = z.infer<typeof slotsQuery>;

export const updateDoctorProfileBody = z.object({
  first_name: requiredText('First name', 100),
  last_name: requiredText('Last name', 100),
  specialization: requiredText('Specialization', 100),
  qualification: requiredText('Qualification', 255),
  experience_years: z.number({ invalid_type_error: 'Experience must be a number' }).int().min(0).max(80),
  consultation_fee: z.number({ invalid_type_error: 'Fee must be a number' }).min(0).max(1_000_000),
  bio: nullableText(2000),
});
export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileBody>;

const windowSchema = z
  .object({
    day_of_week: z.enum(DAYS_OF_WEEK),
    start_time: timeString,
    end_time: timeString,
  })
  .refine((w) => w.end_time > w.start_time, { message: 'End time must be after start time', path: ['end_time'] });

export const replaceAvailabilityBody = z.object({
  windows: z.array(windowSchema).max(28, 'Too many time windows'),
});
export type ReplaceAvailabilityInput = z.infer<typeof replaceAvailabilityBody>;
