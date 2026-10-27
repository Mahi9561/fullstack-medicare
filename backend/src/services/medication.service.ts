import { sequelize } from '../config/database';
import { ConflictError, NotFoundError } from '../errors';
import { medicationRepository } from '../repositories/medication.repository';
import type { Actor, Paginated } from '../types';
import { buildMeta, offsetOf } from '../utils/pagination';
import type { ActiveStatusInput, ListMedicationsQuery, MedicationInput } from '../validators/medication.validator';
import { auditService } from './audit.service';

export const medicationService = {
  /** Doctors only ever see active medications; admins can see (and filter) everything. */
  async list(actor: Actor, query: ListMedicationsQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await medicationRepository.search({
      search: query.search,
      active: actor.role === 'DOCTOR' ? true : query.active,
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },

  async create(actor: Actor, input: MedicationInput) {
    return sequelize.transaction(async (t) => {
      if (await medicationRepository.findByName(input.name, { transaction: t })) {
        throw new ConflictError('A medication with this name already exists');
      }
      const medication = await medicationRepository.create({ name: input.name, description: input.description }, { transaction: t });
      await auditService.log(actor, 'MEDICATION_CREATED', { entityType: 'medication', entityId: medication.id }, t);
      return medication;
    });
  },

  async update(actor: Actor, id: number, input: MedicationInput) {
    return sequelize.transaction(async (t) => {
      const medication = await medicationRepository.findById(id, { transaction: t });
      if (!medication) throw new NotFoundError('Medication not found');
      if (input.name !== medication.name && (await medicationRepository.findByName(input.name, { transaction: t }))) {
        throw new ConflictError('A medication with this name already exists');
      }
      await medicationRepository.update(medication, { name: input.name, description: input.description }, { transaction: t });
      await auditService.log(actor, 'MEDICATION_UPDATED', { entityType: 'medication', entityId: id }, t);
      return medication;
    });
  },

  /** Medications are deactivated, never deleted, so old prescriptions keep pointing at a real row. */
  async setActive(actor: Actor, id: number, input: ActiveStatusInput) {
    return sequelize.transaction(async (t) => {
      const medication = await medicationRepository.findById(id, { transaction: t });
      if (!medication) throw new NotFoundError('Medication not found');
      await medicationRepository.update(medication, { is_active: input.is_active }, { transaction: t });
      await auditService.log(actor, 'MEDICATION_STATUS_CHANGED', { entityType: 'medication', entityId: id, metadata: { is_active: input.is_active } }, t);
      return medication;
    });
  },
};
