import type { CreationAttributes, Transaction } from 'sequelize';
import { Consultation, Doctor, Medication, Patient, Prescription, PrescriptionItem } from '../models';
import type { Paging, Tx } from './types';

export interface PrescriptionItemInput {
  medication_id: number;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string | null;
}

const consultationAttrs = ['id', 'appointment_id', 'patient_id', 'doctor_id', 'diagnosis', 'created_at'];
const medicationInclude = { model: Medication, as: 'medication', attributes: ['id', 'name'] };

// `separate: true` loads items in their own query, so LIMIT/OFFSET still count prescriptions, not joined rows.
const separateItems = { model: PrescriptionItem, as: 'items', separate: true, order: [['id', 'ASC']], include: [medicationInclude] };

export const prescriptionRepository = {
  create: (values: CreationAttributes<Prescription>, tx: Tx = {}) => Prescription.create(values, tx),

  update: (prescription: Prescription, values: Partial<CreationAttributes<Prescription>>, tx: Tx = {}) =>
    prescription.update(values, tx),

  findById: (id: number, tx: Tx = {}) => Prescription.findByPk(id, tx),

  findByConsultationId: (consultationId: number, tx: Tx = {}) =>
    Prescription.findOne({ where: { consultation_id: consultationId }, ...tx }),

  createItems: (prescriptionId: number, items: PrescriptionItemInput[], transaction: Transaction) =>
    PrescriptionItem.bulkCreate(
      items.map((item) => ({ ...item, prescription_id: prescriptionId, instructions: item.instructions ?? null })),
      { transaction },
    ),

  deleteItems: (prescriptionId: number, transaction: Transaction) =>
    PrescriptionItem.destroy({ where: { prescription_id: prescriptionId }, transaction }),

  findDetailById: (id: number) =>
    Prescription.findByPk(id, {
      include: [
        {
          model: Consultation,
          as: 'consultation',
          attributes: consultationAttrs,
          include: [
            { model: Doctor, as: 'doctor', attributes: ['id', 'first_name', 'last_name', 'specialization'] },
            { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] },
          ],
        },
        { model: PrescriptionItem, as: 'items', include: [medicationInclude] },
      ],
      order: [[{ model: PrescriptionItem, as: 'items' }, 'id', 'ASC']],
    }),

  listByDoctor: (doctorId: number, { limit, offset }: Paging) =>
    Prescription.findAndCountAll({
      include: [
        {
          model: Consultation,
          as: 'consultation',
          required: true,
          where: { doctor_id: doctorId },
          attributes: consultationAttrs,
          include: [{ model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] }],
        },
        separateItems,
      ],
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
    }),

  listByPatient: (patientId: number, { limit, offset }: Paging) =>
    Prescription.findAndCountAll({
      include: [
        {
          model: Consultation,
          as: 'consultation',
          required: true,
          where: { patient_id: patientId },
          attributes: consultationAttrs,
          include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'first_name', 'last_name', 'specialization'] }],
        },
        separateItems,
      ],
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
    }),
};
