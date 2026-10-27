import { sequelize } from '../config/database';
import { ForbiddenError, NotFoundError } from '../errors';
import { appointmentRepository } from '../repositories/appointment.repository';
import { consultationRepository } from '../repositories/consultation.repository';
import { medicalRecordRepository } from '../repositories/medicalRecord.repository';
import { patientRepository } from '../repositories/patient.repository';
import { prescriptionRepository } from '../repositories/prescription.repository';
import { vitalSignRepository } from '../repositories/vitalSign.repository';
import type { Actor, Paginated } from '../types';
import { requireDoctorId, requirePatientId } from '../utils/actor';
import { buildMeta, offsetOf } from '../utils/pagination';
import type { PageQuery } from '../validators/common';
import type { UpdatePatientProfileInput } from '../validators/patient.validator';
import { auditService } from './audit.service';
import { toPatientProfile } from './mappers';

const assertDoctorTreats = async (doctorId: number, patientId: number) => {
  if (!(await appointmentRepository.existsRelationship(doctorId, patientId))) {
    throw new ForbiddenError('You can only view patients you have an appointment with');
  }
};

export const patientService = {
  async getProfile(actor: Actor) {
    const patient = await patientRepository.findWithUserById(requirePatientId(actor));
    if (!patient) throw new NotFoundError('Patient profile not found');
    return toPatientProfile(patient);
  },

  async updateProfile(actor: Actor, input: UpdatePatientProfileInput) {
    const patientId = requirePatientId(actor);
    const patient = await patientRepository.findById(patientId);
    if (!patient) throw new NotFoundError('Patient profile not found');

    await sequelize.transaction(async (t) => {
      await patientRepository.update(patient, input, { transaction: t });
      await auditService.log(actor, 'PROFILE_UPDATED', { entityType: 'patient', entityId: patientId }, t);
    });
    return patientService.getProfile(actor);
  },

  async dashboard(actor: Actor) {
    const patientId = requirePatientId(actor);
    const [next, upcomingCount, consultations, prescriptions] = await Promise.all([
      appointmentRepository.findNextForPatient(patientId),
      appointmentRepository.countUpcomingForPatient(patientId),
      consultationRepository.listByPatient(patientId, { limit: 3, offset: 0 }),
      prescriptionRepository.listByPatient(patientId, { limit: 3, offset: 0 }),
    ]);
    return {
      next_appointment: next,
      upcoming_count: upcomingCount,
      total_consultations: consultations.count,
      recent_consultations: consultations.rows,
      recent_prescriptions: prescriptions.rows,
    };
  },

  async listConsultations(actor: Actor, query: PageQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await consultationRepository.listByPatient(requirePatientId(actor), {
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },

  async listPrescriptions(actor: Actor, query: PageQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await prescriptionRepository.listByPatient(requirePatientId(actor), {
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },

  async listMedicalRecords(actor: Actor, query: PageQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await medicalRecordRepository.listByPatient(requirePatientId(actor), {
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },

  /** Doctors need an appointment with the patient. Admins see profile fields only, never clinical data. */
  async getById(actor: Actor, patientId: number) {
    const patient = await patientRepository.findWithUserById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');
    if (actor.role === 'DOCTOR') await assertDoctorTreats(requireDoctorId(actor), patientId);
    return toPatientProfile(patient);
  },

  async getHistory(actor: Actor, patientId: number) {
    const doctorId = requireDoctorId(actor);
    const patient = await patientRepository.findWithUserById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');
    await assertDoctorTreats(doctorId, patientId);

    const recent = { limit: 20, offset: 0 };
    const [consultations, prescriptions, vitals, records] = await Promise.all([
      consultationRepository.listByPatient(patientId, recent),
      prescriptionRepository.listByPatient(patientId, recent),
      vitalSignRepository.listByPatient(patientId, recent),
      medicalRecordRepository.listByPatient(patientId, { limit: 50, offset: 0 }),
    ]);
    return {
      patient: toPatientProfile(patient),
      consultations: consultations.rows,
      prescriptions: prescriptions.rows,
      vital_signs: vitals,
      medical_records: records.rows,
    };
  },
};
