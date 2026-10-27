import type { Model, ModelStatic } from 'sequelize';
import {
  Appointment,
  AuditLog,
  Consultation,
  Department,
  Doctor,
  DoctorAvailability,
  DoctorDepartment,
  MedicalRecord,
  Medication,
  Notification,
  Patient,
  Prescription,
  PrescriptionItem,
  User,
  VitalSign,
} from '../../src/models';

// Children before parents, so foreign keys never block a delete.
const DELETE_ORDER: ModelStatic<Model>[] = [
  Notification,
  AuditLog,
  PrescriptionItem,
  Prescription,
  Consultation,
  VitalSign,
  Appointment,
  MedicalRecord,
  DoctorAvailability,
  DoctorDepartment,
  Doctor,
  Patient,
  User,
  Department,
  Medication,
];

export const resetDatabase = async (): Promise<void> => {
  for (const model of DELETE_ORDER) {
    await model.destroy({ where: {} });
  }
};
