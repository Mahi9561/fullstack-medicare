import type { Request } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';
import type { Actor } from '../types';

export const getActor = (req: Request): Actor => {
  const user = req.user;
  if (!user) throw new UnauthorizedError('Authentication required');
  return {
    userId: user.id,
    role: user.role,
    patientId: user.patientId,
    doctorId: user.doctorId,
    ip: req.ip ?? null,
  };
};

export const requirePatientId = (actor: Actor): number => {
  if (actor.patientId == null) throw new ForbiddenError('A patient profile is required for this action');
  return actor.patientId;
};

export const requireDoctorId = (actor: Actor): number => {
  if (actor.doctorId == null) throw new ForbiddenError('A doctor profile is required for this action');
  return actor.doctorId;
};

/** Reads a validated numeric route parameter (validate() has already coerced it). */
export const idParam = (req: Request, name = 'id'): number => Number(req.params[name]);

/** Reads the validated query object (validate() has already parsed and coerced it). */
export const queryOf = <T>(req: Request): T => req.query as unknown as T;
