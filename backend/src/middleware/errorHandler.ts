import type { ErrorRequestHandler } from 'express';
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize';
import { ZodError } from 'zod';
import { AppError } from '../errors';

interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

/** The single place where errors become HTTP responses. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  // UniqueConstraintError extends ValidationError, so it must be checked first.
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ success: false, message: 'A record with the same value already exists' });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({ success: false, message: 'This record is linked to other data and cannot be changed that way' });
  }

  if (err instanceof SequelizeValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path ?? '', message: e.message })),
    });
  }

  const bodyError = err as BodyParserError;
  if (bodyError.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
  }
  if (bodyError.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large' });
  }

  // Never leak internals: log the details here, return a generic message.
  console.error('Unhandled error:', err);
  return res.status(500).json({ success: false, message: 'Something went wrong on our side. Please try again.' });
};
