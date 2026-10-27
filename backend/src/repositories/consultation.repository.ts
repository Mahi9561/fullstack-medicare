import type { CreationAttributes } from 'sequelize';
import { Appointment, Consultation, Doctor, Medication, Patient, Prescription, PrescriptionItem } from '../models';
import type { Paging, Tx } from './types';

const appointmentAttrs = ['id', 'appointment_date', 'start_time', 'end_time'];
const patientAttrs = ['id', 'first_name', 'last_name'];
const doctorAttrs = ['id', 'first_name', 'last_name', 'specialization'];

export const consultationRepository = {
  create: (values: CreationAttributes<Consultation>, tx: Tx = {}) => Consultation.create(values, tx),

  update: (consultation: Consultation, values: Partial<CreationAttributes<Consultation>>, tx: Tx = {}) =>
    consultation.update(values, tx),

  findById: (id: number, tx: Tx = {}) => Consultation.findByPk(id, tx),

  findByAppointmentId: (appointmentId: number, tx: Tx = {}) =>
    Consultation.findOne({ where: { appointment_id: appointmentId }, ...tx }),

  findDetailById: (id: number) =>
    Consultation.findByPk(id, {
      include: [
        { model: Appointment, as: 'appointment' },
        { model: Patient, as: 'patient', attributes: [...patientAttrs, 'date_of_birth', 'gender'] },
        { model: Doctor, as: 'doctor', attributes: doctorAttrs },
        {
          model: Prescription,
          as: 'prescription',
          required: false,
          include: [
            { model: PrescriptionItem, as: 'items', include: [{ model: Medication, as: 'medication', attributes: ['id', 'name'] }] },
          ],
        },
      ],
      order: [[{ model: Prescription, as: 'prescription' }, { model: PrescriptionItem, as: 'items' }, 'id', 'ASC']],
    }),

  listByDoctor: (doctorId: number, { limit, offset }: Paging) =>
    Consultation.findAndCountAll({
      where: { doctor_id: doctorId },
      include: [
        { model: Patient, as: 'patient', attributes: patientAttrs },
        { model: Appointment, as: 'appointment', attributes: appointmentAttrs },
        { model: Prescription, as: 'prescription', attributes: ['id'], required: false },
      ],
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
    }),

  listByPatient: (patientId: number, { limit, offset }: Paging) =>
    Consultation.findAndCountAll({
      where: { patient_id: patientId },
      include: [
        { model: Doctor, as: 'doctor', attributes: doctorAttrs },
        { model: Appointment, as: 'appointment', attributes: appointmentAttrs },
        { model: Prescription, as: 'prescription', attributes: ['id'], required: false },
      ],
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
    }),
};
