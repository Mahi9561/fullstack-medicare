import { UniqueConstraintError, type Transaction } from 'sequelize';
import {
  DOUBLE_BOOKING_MESSAGE,
  NOTIFICATION_TYPES,
  SLOT_MINUTES,
  type AppointmentStatus,
  type AuditAction,
  type Role,
} from '../config/constants';
import { sequelize } from '../config/database';
import { assertParticipant } from '../domain/access';
import { canTransition } from '../domain/appointmentStatus';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../errors';
import type { Appointment } from '../models';
import { appointmentRepository } from '../repositories/appointment.repository';
import { availabilityRepository } from '../repositories/availability.repository';
import { doctorRepository } from '../repositories/doctor.repository';
import { patientRepository } from '../repositories/patient.repository';
import { userRepository } from '../repositories/user.repository';
import type { Actor, Paginated } from '../types';
import { requireDoctorId, requirePatientId } from '../utils/actor';
import { dayOfWeekOf, generateSlots, isInPast } from '../utils/dateTime';
import { buildMeta, offsetOf } from '../utils/pagination';
import type { BookAppointmentInput, ListAppointmentsQuery } from '../validators/appointment.validator';
import { auditService } from './audit.service';
import { fullName } from './mappers';
import { notificationService } from './notification.service';

interface TransitionRule {
  roles: Role[];
  audit: AuditAction;
}

/** Who may move an appointment INTO each status. The legal "from" statuses live in domain/appointmentStatus. */
const RULES: Partial<Record<AppointmentStatus, TransitionRule>> = {
  CONFIRMED: { roles: ['DOCTOR'], audit: 'APPOINTMENT_CONFIRMED' },
  CANCELLED: { roles: ['PATIENT', 'DOCTOR'], audit: 'APPOINTMENT_CANCELLED' },
  COMPLETED: { roles: ['DOCTOR'], audit: 'APPOINTMENT_COMPLETED' },
  NO_SHOW: { roles: ['DOCTOR'], audit: 'APPOINTMENT_NO_SHOW' },
};

const loadParticipants = async (appointment: Appointment, transaction: Transaction) => {
  const patient = await patientRepository.findById(appointment.patient_id, { transaction });
  const doctor = await doctorRepository.findById(appointment.doctor_id, { transaction });
  if (!patient || !doctor) throw new NotFoundError('Appointment participants not found');
  return { patient, doctor };
};

const describeSlot = (appointment: Appointment): string => `${appointment.appointment_date} at ${appointment.start_time}`;

const notifyStatusChange = async (actor: Actor, appointment: Appointment, target: AppointmentStatus, t: Transaction) => {
  const { patient, doctor } = await loadParticipants(appointment, t);
  const when = describeSlot(appointment);
  const doctorLabel = `Dr. ${fullName(doctor)}`;
  const link = { entityType: 'appointment', entityId: appointment.id };

  switch (target) {
    case 'CONFIRMED':
      return notificationService.notify(
        { userId: patient.user_id, type: NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED, message: `${doctorLabel} confirmed your appointment on ${when}.`, ...link },
        t,
      );
    case 'COMPLETED':
      return notificationService.notify(
        { userId: patient.user_id, type: NOTIFICATION_TYPES.APPOINTMENT_COMPLETED, message: `Your appointment with ${doctorLabel} on ${when} is complete.`, ...link },
        t,
      );
    case 'CANCELLED': {
      const cancelledByPatient = actor.role === 'PATIENT';
      return notificationService.notify(
        {
          userId: cancelledByPatient ? doctor.user_id : patient.user_id,
          type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
          message: cancelledByPatient
            ? `${fullName(patient)} cancelled the appointment on ${when}.`
            : `${doctorLabel} cancelled your appointment on ${when}.`,
          ...link,
        },
        t,
      );
    }
    default:
      return undefined; // no-shows do not notify anyone
  }
};

/** Shared by confirm, cancel, complete and no-show: lock the row, check access and the state machine, then write. */
const changeStatus = async (actor: Actor, id: number, target: AppointmentStatus, reason: string | null = null) => {
  const rule = RULES[target];
  if (!rule || !rule.roles.includes(actor.role)) {
    throw new ForbiddenError('You do not have permission to perform this action');
  }

  await sequelize.transaction(async (t) => {
    const appointment = await appointmentRepository.findByIdForUpdate(id, t);
    if (!appointment) throw new NotFoundError('Appointment not found');
    assertParticipant(actor, appointment, 'appointment');

    const from = appointment.status;
    if (!canTransition(from, target)) {
      throw new ConflictError(`An appointment that is ${from} cannot be changed to ${target}`);
    }
    if (target === 'NO_SHOW' && !isInPast(appointment.appointment_date, appointment.start_time)) {
      throw new ConflictError('An appointment can only be marked as a no-show after its start time');
    }

    await appointmentRepository.update(
      appointment,
      { status: target, ...(target === 'CANCELLED' ? { cancellation_reason: reason } : {}) },
      { transaction: t },
    );
    await auditService.log(actor, rule.audit, { entityType: 'appointment', entityId: appointment.id, metadata: { from, to: target } }, t);
    await notifyStatusChange(actor, appointment, target, t);
  });

  return appointmentService.getById(actor, id);
};

export const appointmentService = {
  /**
   * Books a slot. Double booking is prevented in three layers:
   *   1. a row lock on the doctor serializes concurrent bookings for the same doctor,
   *   2. an explicit conflict check gives a clean 409,
   *   3. the unique index on (doctor, date, start, active_slot) is the final guarantee.
   */
  async book(actor: Actor, input: BookAppointmentInput) {
    const patientId = requirePatientId(actor);
    if (isInPast(input.appointment_date, input.start_time)) {
      throw new BadRequestError('You cannot book an appointment in the past');
    }

    const appointmentId = await sequelize.transaction(async (t) => {
      const doctor = await doctorRepository.findByIdForUpdate(input.doctor_id, t);
      const doctorUser = doctor ? await userRepository.findById(doctor.user_id, { transaction: t }) : null;
      if (!doctor || !doctorUser || doctorUser.status !== 'ACTIVE') throw new NotFoundError('Doctor not found');

      const windows = await availabilityRepository.findByDoctorAndDay(doctor.id, dayOfWeekOf(input.appointment_date), { transaction: t });
      const slot = generateSlots(windows, SLOT_MINUTES).find((s) => s.start_time === input.start_time);
      if (!slot) throw new BadRequestError('That time is not an available slot for this doctor');

      if (await appointmentRepository.existsSlotHolder(doctor.id, input.appointment_date, slot.start_time, { transaction: t })) {
        throw new ConflictError(DOUBLE_BOOKING_MESSAGE);
      }

      let appointment: Appointment;
      try {
        appointment = await appointmentRepository.create(
          {
            patient_id: patientId,
            doctor_id: doctor.id,
            appointment_date: input.appointment_date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            reason: input.reason,
          },
          { transaction: t },
        );
      } catch (error) {
        // Lost a race that slipped past the checks above: the unique index still says no.
        if (error instanceof UniqueConstraintError) throw new ConflictError(DOUBLE_BOOKING_MESSAGE);
        throw error;
      }

      const patient = await patientRepository.findById(patientId, { transaction: t });
      await auditService.log(actor, 'APPOINTMENT_CREATED', {
        entityType: 'appointment',
        entityId: appointment.id,
        metadata: { doctor_id: doctor.id, date: input.appointment_date, start_time: slot.start_time },
      }, t);
      await notificationService.notify(
        {
          userId: doctor.user_id,
          type: NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
          message: `${patient ? fullName(patient) : 'A patient'} booked an appointment on ${input.appointment_date} at ${slot.start_time}.`,
          entityType: 'appointment',
          entityId: appointment.id,
        },
        t,
      );
      return appointment.id;
    });

    return appointmentService.getById(actor, appointmentId);
  },

  /** Role-scoped: patients see their own appointments, doctors see theirs. Admins use /api/admin/appointments. */
  async list(actor: Actor, query: ListAppointmentsQuery): Promise<Paginated<unknown>> {
    let owner: { patientId?: number; doctorId?: number };
    if (actor.role === 'PATIENT') owner = { patientId: requirePatientId(actor) };
    else if (actor.role === 'DOCTOR') owner = { doctorId: requireDoctorId(actor) };
    else throw new ForbiddenError('Use the admin endpoint to list all appointments');

    const { rows, count } = await appointmentRepository.list({
      ...owner,
      scope: query.scope,
      status: query.status,
      date: query.date,
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },

  async getById(actor: Actor, id: number) {
    const appointment = await appointmentRepository.findDetailById(id);
    if (!appointment) throw new NotFoundError('Appointment not found');
    assertParticipant(actor, appointment, 'appointment');
    return appointment;
  },

  confirm: (actor: Actor, id: number) => changeStatus(actor, id, 'CONFIRMED'),

  cancel: (actor: Actor, id: number, reason: string | null) => changeStatus(actor, id, 'CANCELLED', reason),

  /** Closes a visit that needs no consultation. Saving a consultation completes the appointment by itself. */
  complete: (actor: Actor, id: number) => changeStatus(actor, id, 'COMPLETED'),

  markNoShow: (actor: Actor, id: number) => changeStatus(actor, id, 'NO_SHOW'),
};
