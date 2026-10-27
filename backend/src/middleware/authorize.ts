import type { RequestHandler } from 'express';
import type { Role } from '../config/constants';
import { ForbiddenError, UnauthorizedError } from '../errors';

/** Route-level role gate. Resource-level checks (is it YOUR appointment?) live in the services. */
export const authorizeRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError('Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    return next();
  };
