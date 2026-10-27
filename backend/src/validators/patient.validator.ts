import { z } from 'zod';
import { GENDERS } from '../config/constants';
import { nullableText, pastOrTodayDate, phoneSchema, requiredText } from './common';

export const updatePatientProfileBody = z.object({
  first_name: requiredText('First name', 100),
  last_name: requiredText('Last name', 100),
  date_of_birth: pastOrTodayDate,
  gender: z.enum(GENDERS),
  phone: phoneSchema,
  address: nullableText(255),
  emergency_contact: nullableText(150),
});
export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileBody>;
