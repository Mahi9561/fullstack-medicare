import { z } from 'zod';
import { nullableText, requiredText } from './common';

export const departmentBody = z.object({
  name: requiredText('Name', 100),
  description: nullableText(500),
});
export type DepartmentInput = z.infer<typeof departmentBody>;
