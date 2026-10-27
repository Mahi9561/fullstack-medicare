import type { Transaction } from 'sequelize';
import { NOTIFICATION_TYPES } from '../config/constants';
import { sequelize } from '../config/database';
import { assertParticipant } from '../domain/access';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../errors';
import { consultationRepository } from '../repositories/consultation.repository';
import { doctorRepository } from '../repositories/doctor.repository';
import { medicationRepository } from '../repositories/medication.repository';
import { patientRepository } from '../repositories/patient.repository';
import { prescriptionRepository, type PrescriptionItemInput } from '../repositories/prescription.repository';
import type { Actor, Paginated } from '../types';
import { requireDoctorId } from '../utils/actor';
import { buildMeta, offsetOf } from '../utils/pagination';
import type { PageQuery } from '../validators/common';
import type { CreatePrescriptionInput, UpdatePrescriptionInput } from '../validators/prescription.validator';
import { auditService } from './audit.service';
import { fullName } from './mappers';
import { notificationService } from './notification.service';

/** Every medication must exist, be active, and appear only once. */
const assertMedications = async (items: PrescriptionItemInput[], transaction: Transaction) => {
  const ids = items.map((item) => item.medication_id);
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestError('Each medication can appear only once in a prescription');
  }
  const found = await medicationRepository.findActiveByIds(ids, { transaction });
  if (found.length !== ids.length) {
    throw new BadRequestError('One or more medications do not exist or are no longer active');
  }
};

export const prescriptionService = {
  /** Prescription and its items are parent and child rows: they are written in one transaction. */
  async create(actor: Actor, input: CreatePrescriptionInput) {
    const doctorId = requireDoctorId(actor);

    const prescriptionId = await sequelize.transaction(async (t) => {
      const consultation = await consultationRepository.findById(input.consultation_id, { transaction: t });
      if (!consultation) throw new NotFoundError('Consultation not found');
      if (consultation.doctor_id !== doctorId) throw new ForbiddenError('You can only prescribe for your own consultations');
      if (await prescriptionRepository.findByConsultationId(consultation.id, { transaction: t })) {
        throw new ConflictError('A prescription already exists for this consultation');
      }
      await assertMedications(input.items, t);

      const prescription = await prescriptionRepository.create({ consultation_id: consultation.id, notes: input.notes }, { transaction: t });
      await prescriptionRepository.createItems(prescription.id, input.items, t);

      await auditService.log(actor, 'PRESCRIPTION_CREATED', {
        entityType: 'prescription',
        entityId: prescription.id,
        metadata: { consultation_id: consultation.id, items: input.items.length },
      }, t);

      const patient = await patientRepository.findById(consultation.patient_id, { transaction: t });
      const doctor = await doctorRepository.findById(doctorId, { transaction: t });
      if (patient && doctor) {
        await notificationService.notify(
          {
            userId: patient.user_id,
            type: NOTIFICATION_TYPES.PRESCRIPTION_CREATED,
            message: `Dr. ${fullName(doctor)} issued a new prescription for you.`,
            entityType: 'prescription',
            entityId: prescription.id,
          },
          t,
        );
      }
      return prescription.id;
    });

    return prescriptionRepository.findDetailById(prescriptionId);
  },

  async list(actor: Actor, query: PageQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await prescriptionRepository.listByDoctor(requireDoctorId(actor), {
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },

  async getById(actor: Actor, id: number) {
    const prescription = await prescriptionRepository.findDetailById(id);
    if (!prescription || !prescription.consultation) throw new NotFoundError('Prescription not found');
    assertParticipant(actor, prescription.consultation, 'prescription');
    return prescription;
  },

  /** Author only. Notes and items are replaced together, so a prescription is never half-edited. */
  async update(actor: Actor, id: number, input: UpdatePrescriptionInput) {
    const doctorId = requireDoctorId(actor);

    await sequelize.transaction(async (t) => {
      const prescription = await prescriptionRepository.findById(id, { transaction: t });
      if (!prescription) throw new NotFoundError('Prescription not found');
      const consultation = await consultationRepository.findById(prescription.consultation_id, { transaction: t });
      if (!consultation || consultation.doctor_id !== doctorId) {
        throw new ForbiddenError('Only the doctor who issued this prescription can edit it');
      }
      await assertMedications(input.items, t);

      await prescriptionRepository.update(prescription, { notes: input.notes }, { transaction: t });
      await prescriptionRepository.deleteItems(prescription.id, t);
      await prescriptionRepository.createItems(prescription.id, input.items, t);
      await auditService.log(actor, 'PRESCRIPTION_UPDATED', { entityType: 'prescription', entityId: id }, t);
    });
    return prescriptionRepository.findDetailById(id);
  },
};
