import { sequelize } from '../config/database';
import { assertParticipant } from '../domain/access';
import { ConflictError, NotFoundError } from '../errors';
import { appointmentRepository } from '../repositories/appointment.repository';
import { vitalSignRepository } from '../repositories/vitalSign.repository';
import type { Actor } from '../types';
import { requireDoctorId } from '../utils/actor';
import type { VitalSignsInput } from '../validators/appointment.validator';
import { auditService } from './audit.service';

export const vitalSignService = {
  /** One reading per visit: the first PUT creates it, later PUTs correct it. */
  async upsert(actor: Actor, appointmentId: number, input: VitalSignsInput) {
    const doctorId = requireDoctorId(actor);

    return sequelize.transaction(async (t) => {
      const appointment = await appointmentRepository.findByIdForUpdate(appointmentId, t);
      if (!appointment) throw new NotFoundError('Appointment not found');
      assertParticipant(actor, appointment, 'appointment');
      if (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
        throw new ConflictError(`Vital signs cannot be recorded for a ${appointment.status} appointment`);
      }

      const values = {
        bp_systolic: input.bp_systolic ?? null,
        bp_diastolic: input.bp_diastolic ?? null,
        heart_rate: input.heart_rate ?? null,
        temperature_f: input.temperature_f ?? null,
        weight_kg: input.weight_kg ?? null,
        height_cm: input.height_cm ?? null,
        spo2: input.spo2 ?? null,
      };

      const existing = await vitalSignRepository.findByAppointmentId(appointment.id, { transaction: t });
      const vitals = existing
        ? await vitalSignRepository.update(existing, { ...values, doctor_id: doctorId }, { transaction: t })
        : await vitalSignRepository.create(
            { ...values, appointment_id: appointment.id, patient_id: appointment.patient_id, doctor_id: doctorId },
            { transaction: t },
          );

      await auditService.log(actor, 'VITALS_RECORDED', { entityType: 'appointment', entityId: appointment.id }, t);
      return { vitals, created: !existing };
    });
  },

  /** Returns null (not 404) when nothing has been recorded yet: that is a normal state, not an error. */
  async get(actor: Actor, appointmentId: number) {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) throw new NotFoundError('Appointment not found');
    assertParticipant(actor, appointment, 'appointment');
    return vitalSignRepository.findByAppointmentId(appointmentId);
  },
};
