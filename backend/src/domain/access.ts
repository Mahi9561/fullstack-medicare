import { ForbiddenError } from '../errors';
import type { Actor } from '../types';

interface HasParticipants {
  patient_id: number;
  doctor_id: number;
}

/** Resource-level authorization: only the patient or the doctor on a record may touch it. */
export const isParticipant = (actor: Actor, record: HasParticipants): boolean =>
  (actor.role === 'PATIENT' && actor.patientId === record.patient_id) ||
  (actor.role === 'DOCTOR' && actor.doctorId === record.doctor_id);

export const assertParticipant = (actor: Actor, record: HasParticipants, what = 'record'): void => {
  if (!isParticipant(actor, record)) throw new ForbiddenError(`You do not have access to this ${what}`);
};
