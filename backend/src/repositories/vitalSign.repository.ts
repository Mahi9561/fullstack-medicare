import type { CreationAttributes } from 'sequelize';
import { Appointment, Doctor, VitalSign } from '../models';
import type { Paging, Tx } from './types';

export const vitalSignRepository = {
  findByAppointmentId: (appointmentId: number, tx: Tx = {}) =>
    VitalSign.findOne({ where: { appointment_id: appointmentId }, ...tx }),

  create: (values: CreationAttributes<VitalSign>, tx: Tx = {}) => VitalSign.create(values, tx),

  update: (vitals: VitalSign, values: Partial<CreationAttributes<VitalSign>>, tx: Tx = {}) => vitals.update(values, tx),

  listByPatient: (patientId: number, { limit, offset }: Paging) =>
    VitalSign.findAll({
      where: { patient_id: patientId },
      include: [
        { model: Appointment, as: 'appointment', attributes: ['id', 'appointment_date', 'start_time'] },
        { model: Doctor, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
    }),
};
