import type { CreationAttributes } from 'sequelize';
import { Doctor, MedicalRecord } from '../models';
import type { Paging, Tx } from './types';

const doctorInclude = { model: Doctor, as: 'doctor', attributes: ['id', 'first_name', 'last_name', 'specialization'] };

export const medicalRecordRepository = {
  create: (values: CreationAttributes<MedicalRecord>, tx: Tx = {}) => MedicalRecord.create(values, tx),

  findDetailById: (id: number) => MedicalRecord.findByPk(id, { include: [doctorInclude] }),

  listByPatient: (patientId: number, { limit, offset }: Paging) =>
    MedicalRecord.findAndCountAll({
      where: { patient_id: patientId },
      include: [doctorInclude],
      order: [
        ['record_date', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
    }),
};
