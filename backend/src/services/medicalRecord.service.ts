import { sequelize } from '../config/database';
import { ForbiddenError, NotFoundError } from '../errors';
import { appointmentRepository } from '../repositories/appointment.repository';
import { medicalRecordRepository } from '../repositories/medicalRecord.repository';
import { patientRepository } from '../repositories/patient.repository';
import type { Actor } from '../types';
import { requireDoctorId } from '../utils/actor';
import type { CreateMedicalRecordInput } from '../validators/medicalRecord.validator';
import { auditService } from './audit.service';

export const medicalRecordService = {
  /** A doctor can only add records for a patient they have an appointment with. */
  async create(actor: Actor, input: CreateMedicalRecordInput) {
    const doctorId = requireDoctorId(actor);
    const patient = await patientRepository.findById(input.patient_id);
    if (!patient) throw new NotFoundError('Patient not found');
    if (!(await appointmentRepository.existsRelationship(doctorId, patient.id))) {
      throw new ForbiddenError('You can only add records for patients you have an appointment with');
    }

    const record = await sequelize.transaction(async (t) => {
      const created = await medicalRecordRepository.create({ ...input, doctor_id: doctorId }, { transaction: t });
      await auditService.log(actor, 'MEDICAL_RECORD_CREATED', { entityType: 'medical_record', entityId: created.id, metadata: { patient_id: patient.id } }, t);
      return created;
    });
    return medicalRecordRepository.findDetailById(record.id);
  },
};
