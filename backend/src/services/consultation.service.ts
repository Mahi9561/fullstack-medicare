import { NOTIFICATION_TYPES } from '../config/constants';
import { sequelize } from '../config/database';
import { assertParticipant } from '../domain/access';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors';
import { appointmentRepository } from '../repositories/appointment.repository';
import { consultationRepository } from '../repositories/consultation.repository';
import { doctorRepository } from '../repositories/doctor.repository';
import { patientRepository } from '../repositories/patient.repository';
import type { Actor, Paginated } from '../types';
import { requireDoctorId } from '../utils/actor';
import { buildMeta, offsetOf } from '../utils/pagination';
import type { PageQuery } from '../validators/common';
import type { CreateConsultationInput, UpdateConsultationInput } from '../validators/consultation.validator';
import { auditService } from './audit.service';
import { fullName } from './mappers';
import { notificationService } from './notification.service';

export const consultationService = {
  /**
   * Saves the consultation and completes the appointment in ONE transaction: either both happen
   * or neither does. patient_id and doctor_id are copied from the appointment, never from the request.
   */
  async create(actor: Actor, input: CreateConsultationInput) {
    const doctorId = requireDoctorId(actor);

    const consultationId = await sequelize.transaction(async (t) => {
      const appointment = await appointmentRepository.findByIdForUpdate(input.appointment_id, t);
      if (!appointment) throw new NotFoundError('Appointment not found');
      if (appointment.doctor_id !== doctorId) {
        throw new ForbiddenError('You can only create consultations for your own appointments');
      }
      if (appointment.status !== 'CONFIRMED') {
        throw new ConflictError(`A consultation needs a CONFIRMED appointment, but this one is ${appointment.status}`);
      }
      if (await consultationRepository.findByAppointmentId(appointment.id, { transaction: t })) {
        throw new ConflictError('A consultation already exists for this appointment');
      }

      const consultation = await consultationRepository.create(
        {
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          symptoms: input.symptoms,
          diagnosis: input.diagnosis,
          notes: input.notes,
        },
        { transaction: t },
      );
      await appointmentRepository.update(appointment, { status: 'COMPLETED' }, { transaction: t });

      await auditService.log(actor, 'CONSULTATION_CREATED', { entityType: 'consultation', entityId: consultation.id, metadata: { appointment_id: appointment.id } }, t);
      await auditService.log(actor, 'APPOINTMENT_COMPLETED', { entityType: 'appointment', entityId: appointment.id, metadata: { from: 'CONFIRMED', to: 'COMPLETED' } }, t);

      const patient = await patientRepository.findById(appointment.patient_id, { transaction: t });
      const doctor = await doctorRepository.findById(appointment.doctor_id, { transaction: t });
      if (patient && doctor) {
        await notificationService.notify(
          {
            userId: patient.user_id,
            type: NOTIFICATION_TYPES.APPOINTMENT_COMPLETED,
            message: `Your appointment with Dr. ${fullName(doctor)} on ${appointment.appointment_date} is complete. Your consultation notes are available.`,
            entityType: 'consultation',
            entityId: consultation.id,
          },
          t,
        );
      }
      return consultation.id;
    });

    return consultationRepository.findDetailById(consultationId);
  },

  async list(actor: Actor, query: PageQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await consultationRepository.listByDoctor(requireDoctorId(actor), {
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },

  async getById(actor: Actor, id: number) {
    const consultation = await consultationRepository.findDetailById(id);
    if (!consultation) throw new NotFoundError('Consultation not found');
    assertParticipant(actor, consultation, 'consultation');
    return consultation;
  },

  /** Only the authoring doctor may edit. */
  async update(actor: Actor, id: number, input: UpdateConsultationInput) {
    const doctorId = requireDoctorId(actor);

    await sequelize.transaction(async (t) => {
      const consultation = await consultationRepository.findById(id, { transaction: t });
      if (!consultation) throw new NotFoundError('Consultation not found');
      if (consultation.doctor_id !== doctorId) throw new ForbiddenError('Only the doctor who wrote this consultation can edit it');

      await consultationRepository.update(consultation, input, { transaction: t });
      await auditService.log(actor, 'CONSULTATION_UPDATED', { entityType: 'consultation', entityId: id }, t);
    });
    return consultationRepository.findDetailById(id);
  },
};
