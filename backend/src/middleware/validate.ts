import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { BadRequestError, type FieldError } from '../errors';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

const PARTS = ['params', 'query', 'body'] as const;

/**
 * Parses params, query and body with Zod and replaces them with the parsed (coerced,
 * trimmed, stripped) values. Unknown keys are dropped, which also blocks mass assignment
 * such as a "role" field in a registration body.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const errors: FieldError[] = [];

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (result.success) {
        (req as unknown as Record<string, unknown>)[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          errors.push({ field: issue.path.length ? issue.path.join('.') : part, message: issue.message });
        }
      }
    }

    if (errors.length) return next(new BadRequestError('Validation failed', errors));
    return next();
  };
