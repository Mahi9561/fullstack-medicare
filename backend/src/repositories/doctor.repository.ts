import { Op, type CreationAttributes, type Transaction, type WhereOptions } from 'sequelize';
import { Department, Doctor, DoctorDepartment, User } from '../models';
import { andWhere, nameSearch } from '../utils/search';
import type { Paging, Tx } from './types';

const userInclude = (activeOnly: boolean) => ({
  model: User,
  as: 'user',
  attributes: ['id', 'email', 'status'],
  required: true,
  ...(activeOnly ? { where: { status: 'ACTIVE' } } : {}),
});

interface SearchParams extends Paging {
  search?: string;
  specialization?: string;
  activeOnly: boolean;
}

export interface DepartmentLite {
  id: number;
  name: string;
}

export const doctorRepository = {
  findById: (id: number, tx: Tx = {}) => Doctor.findByPk(id, tx),

  /** SELECT ... FOR UPDATE on the doctor row: serializes concurrent bookings for that doctor. */
  findByIdForUpdate: (id: number, transaction: Transaction) =>
    Doctor.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }),

  findDetailById: (id: number) =>
    Doctor.findByPk(id, {
      include: [
        userInclude(false),
        { model: Department, as: 'departments', attributes: ['id', 'name'], through: { attributes: [] }, required: false },
      ],
    }),

  create: (values: CreationAttributes<Doctor>, tx: Tx = {}) => Doctor.create(values, tx),

  update: (doctor: Doctor, values: Partial<CreationAttributes<Doctor>>, tx: Tx = {}) => doctor.update(values, tx),

  search: ({ search, specialization, activeOnly, limit, offset }: SearchParams) => {
    const conditions: WhereOptions[] = [];
    if (specialization) conditions.push({ specialization });
    if (search) conditions.push(nameSearch('Doctor', search));
    return Doctor.findAndCountAll({
      where: andWhere(conditions),
      include: [userInclude(activeOnly)],
      order: [
        ['last_name', 'ASC'],
        ['first_name', 'ASC'],
        ['id', 'ASC'],
      ],
      limit,
      offset,
    });
  },

  /**
   * Departments for a page of doctors in one extra query. Loading them with the main query
   * would multiply rows and break LIMIT/OFFSET, so they are attached afterwards.
   */
  async findDepartmentsByDoctorIds(doctorIds: number[]): Promise<Map<number, DepartmentLite[]>> {
    const map = new Map<number, DepartmentLite[]>();
    if (!doctorIds.length) return map;
    const links = await DoctorDepartment.findAll({
      where: { doctor_id: { [Op.in]: doctorIds } },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
    });
    for (const link of links) {
      if (!link.department) continue;
      const list = map.get(link.doctor_id) ?? [];
      list.push({ id: link.department.id, name: link.department.name });
      map.set(link.doctor_id, list);
    }
    return map;
  },

  async replaceDepartments(doctorId: number, departmentIds: number[], transaction: Transaction): Promise<void> {
    await DoctorDepartment.destroy({ where: { doctor_id: doctorId }, transaction });
    if (departmentIds.length) {
      await DoctorDepartment.bulkCreate(
        departmentIds.map((department_id) => ({ doctor_id: doctorId, department_id })),
        { transaction },
      );
    }
  },
};
