import { z } from 'zod';
import { isValidDateString, todayLocal } from '../utils/dateTime';

export const idParams = z.object({ id: z.coerce.number().int().positive('Id must be a positive whole number') });

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

export const searchPageQuery = z.object({
  search: z.string().trim().max(100).optional(),
  ...paginationQuery,
});
export type SearchPageQuery = z.infer<typeof searchPageQuery>;

export const pageQuery = z.object(paginationQuery);
export type PageQuery = z.infer<typeof pageQuery>;

export const dateString = z.string().refine(isValidDateString, 'Use a valid date in YYYY-MM-DD format');
export const pastOrTodayDate = dateString.refine((value) => value <= todayLocal(), 'Date cannot be in the future');
export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time in HH:mm format');

export const requiredText = (label: string, max: number) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

/** Optional free text. Blank or missing becomes null so clearing a form field really clears the column. */
export const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .nullish()
    .transform((value) => (value ? value : null));

export const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(255);

// bcrypt only uses the first 72 bytes, so longer passwords would be silently truncated.
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+()\-\s]{7,20}$/, 'Enter a valid phone number');
