import { Op, Sequelize, type CreationAttributes, type WhereOptions } from 'sequelize';
import { Patient, User } from '../models';
import { andWhere, nameSearch } from '../utils/search';
import type { Paging, Tx } from './types';

const userInclude = { model: User, as: 'user', attributes: ['id', 'email', 'status'], required: true };

const ORDER: [string, string][] = [
  ['last_name', 'ASC'],
  ['first_name', 'ASC'],
  ['id', 'ASC'],
];

interface SearchParams extends Paging {
  search?: string;
}

export const patientRepository = {
  findById: (id: number, tx: Tx = {}) => Patient.findByPk(id, tx),

  findWithUserById: (id: number) => Patient.findByPk(id, { include: [userInclude] }),

  create: (values: CreationAttributes<Patient>, tx: Tx = {}) => Patient.create(values, tx),

  update: (patient: Patient, values: Partial<CreationAttributes<Patient>>, tx: Tx = {}) => patient.update(values, tx),

  search: ({ search, limit, offset }: SearchParams) => {
    const conditions: WhereOptions[] = [];
    if (search) conditions.push(nameSearch('Patient', search));
    return Patient.findAndCountAll({ where: andWhere(conditions), include: [userInclude], order: ORDER, limit, offset });
  },

  /** Patients who have at least one non-cancelled appointment with this doctor. */
  searchTreatedBy: (doctorId: number, { search, limit, offset }: SearchParams) => {
    const conditions: WhereOptions[] = [
      {
        id: {
          [Op.in]: Sequelize.literal(
            `(SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = ${Number(doctorId)} AND status <> 'CANCELLED')`,
          ),
        },
      },
    ];
    if (search) conditions.push(nameSearch('Patient', search));
    return Patient.findAndCountAll({ where: andWhere(conditions), include: [userInclude], order: ORDER, limit, offset });
  },
};
