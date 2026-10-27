import { sequelize } from '../config/database';
import { ConflictError, NotFoundError } from '../errors';
import { departmentRepository } from '../repositories/department.repository';
import type { Actor } from '../types';
import type { DepartmentInput } from '../validators/department.validator';
import type { ActiveStatusInput } from '../validators/medication.validator';
import { auditService } from './audit.service';

export const departmentService = {
  /** Everyone sees active departments; only admins also see inactive ones. */
  list: (actor: Actor) => departmentRepository.list(actor.role !== 'ADMIN'),

  async create(actor: Actor, input: DepartmentInput) {
    return sequelize.transaction(async (t) => {
      if (await departmentRepository.findByName(input.name, { transaction: t })) {
        throw new ConflictError('A department with this name already exists');
      }
      const department = await departmentRepository.create({ name: input.name, description: input.description }, { transaction: t });
      await auditService.log(actor, 'DEPARTMENT_CREATED', { entityType: 'department', entityId: department.id }, t);
      return department;
    });
  },

  async update(actor: Actor, id: number, input: DepartmentInput) {
    return sequelize.transaction(async (t) => {
      const department = await departmentRepository.findById(id, { transaction: t });
      if (!department) throw new NotFoundError('Department not found');
      if (input.name !== department.name && (await departmentRepository.findByName(input.name, { transaction: t }))) {
        throw new ConflictError('A department with this name already exists');
      }
      await departmentRepository.update(department, { name: input.name, description: input.description }, { transaction: t });
      await auditService.log(actor, 'DEPARTMENT_UPDATED', { entityType: 'department', entityId: id }, t);
      return department;
    });
  },

  async setActive(actor: Actor, id: number, input: ActiveStatusInput) {
    return sequelize.transaction(async (t) => {
      const department = await departmentRepository.findById(id, { transaction: t });
      if (!department) throw new NotFoundError('Department not found');
      await departmentRepository.update(department, { is_active: input.is_active }, { transaction: t });
      await auditService.log(actor, 'DEPARTMENT_STATUS_CHANGED', { entityType: 'department', entityId: id, metadata: { is_active: input.is_active } }, t);
      return department;
    });
  },
};
