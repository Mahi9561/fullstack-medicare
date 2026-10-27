import { Op, type CreationAttributes, type WhereOptions } from 'sequelize';
import { Medication } from '../models';
import { andWhere, likeContains } from '../utils/search';
import type { Paging, Tx } from './types';

interface SearchParams extends Paging {
  search?: string;
  active?: boolean;
}

export const medicationRepository = {
  findById: (id: number, tx: Tx = {}) => Medication.findByPk(id, tx),

  findByName: (name: string, tx: Tx = {}) => Medication.findOne({ where: { name }, ...tx }),

  create: (values: CreationAttributes<Medication>, tx: Tx = {}) => Medication.create(values, tx),

  update: (medication: Medication, values: Partial<CreationAttributes<Medication>>, tx: Tx = {}) =>
    medication.update(values, tx),

  search: ({ search, active, limit, offset }: SearchParams) => {
    const conditions: WhereOptions[] = [];
    if (search) conditions.push({ name: likeContains(search) });
    if (active !== undefined) conditions.push({ is_active: active });
    return Medication.findAndCountAll({ where: andWhere(conditions), order: [['name', 'ASC']], limit, offset });
  },

  findActiveByIds: (ids: number[], tx: Tx = {}) =>
    Medication.findAll({ where: { id: { [Op.in]: ids }, is_active: true }, ...tx }),
};
