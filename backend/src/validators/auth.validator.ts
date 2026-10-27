import { z } from 'zod';
import { GENDERS } from '../config/constants';
import { emailSchema, nullableText, passwordSchema, pastOrTodayDate, phoneSchema, requiredText } from './common';

export const registerBody = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: requiredText('First name', 100),
  last_name: requiredText('Last name', 100),
  date_of_birth: pastOrTodayDate,
  gender: z.enum(GENDERS),
  phone: phoneSchema,
  address: nullableText(255),
  emergency_contact: nullableText(150),
});
export type RegisterInput = z.infer<typeof registerBody>;

export const loginBody = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginBody>;
