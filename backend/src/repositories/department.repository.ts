import { Op, type CreationAttributes } from 'sequelize';
import { Department } from '../models';
import type { Tx } from './types';

export const departmentRepository = {
  list: (activeOnly: boolean) =>
    Department.findAll({ where: activeOnly ? { is_active: true } : undefined, order: [['name', 'ASC']] }),

  findById: (id: number, tx: Tx = {}) => Department.findByPk(id, tx),

  findByName: (name: string, tx: Tx = {}) => Department.findOne({ where: { name }, ...tx }),

  findByIds: (ids: number[], tx: Tx = {}) => Department.findAll({ where: { id: { [Op.in]: ids } }, ...tx }),

  create: (values: CreationAttributes<Department>, tx: Tx = {}) => Department.create(values, tx),

  update: (department: Department, values: Partial<CreationAttributes<Department>>, tx: Tx = {}) =>
    department.update(values, tx),
};
