import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env';

const message = { success: false, message: 'Too many requests. Please wait a few minutes and try again.' };

const common = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  message,
  // Tests fire many requests from one IP; the limiter is covered by configuration, not by tests.
  skip: () => isTest,
};

export const globalLimiter = rateLimit({ ...common, limit: 1000 });

/** Applied to login and register to slow down password guessing. */
export const authLimiter = rateLimit({ ...common, limit: 30 });
