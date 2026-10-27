import { sequelize } from '../config/database';
import { Appointment } from './appointment.model';
import { AuditLog } from './auditLog.model';
import { Consultation } from './consultation.model';
import { Department } from './department.model';
import { Doctor } from './doctor.model';
import { DoctorAvailability } from './doctorAvailability.model';
import { DoctorDepartment } from './doctorDepartment.model';
import { MedicalRecord } from './medicalRecord.model';
import { Medication } from './medication.model';
import { Notification } from './notification.model';
import { Patient } from './patient.model';
import { Prescription } from './prescription.model';
import { PrescriptionItem } from './prescriptionItem.model';
import { User } from './user.model';
import { VitalSign } from './vitalSign.model';

// Every association in the schema lives here, in one place.
// The aliases (`as`) are also the JSON keys the API returns, so they are snake_case.

User.hasOne(Patient, { foreignKey: 'user_id', as: 'patient' });
Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctor' });
Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Doctor.belongsToMany(Department, { through: DoctorDepartment, foreignKey: 'doctor_id', otherKey: 'department_id', as: 'departments' });
Department.belongsToMany(Doctor, { through: DoctorDepartment, foreignKey: 'department_id', otherKey: 'doctor_id', as: 'doctors' });
DoctorDepartment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
DoctorDepartment.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Doctor.hasMany(DoctorAvailability, { foreignKey: 'doctor_id', as: 'availability' });
DoctorAvailability.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

Appointment.hasOne(Consultation, { foreignKey: 'appointment_id', as: 'consultation' });
Consultation.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
Appointment.hasOne(VitalSign, { foreignKey: 'appointment_id', as: 'vital_signs' });
VitalSign.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// Secondary links, copied from the appointment so a patient's history is one indexed lookup.
Patient.hasMany(Consultation, { foreignKey: 'patient_id', as: 'consultations' });
Consultation.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Doctor.hasMany(Consultation, { foreignKey: 'doctor_id', as: 'consultations' });
Consultation.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
Patient.hasMany(VitalSign, { foreignKey: 'patient_id', as: 'vital_signs' });
VitalSign.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Doctor.hasMany(VitalSign, { foreignKey: 'doctor_id', as: 'vital_signs' });
VitalSign.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

Consultation.hasOne(Prescription, { foreignKey: 'consultation_id', as: 'prescription' });
Prescription.belongsTo(Consultation, { foreignKey: 'consultation_id', as: 'consultation' });
Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescription_id', as: 'items' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });
Medication.hasMany(PrescriptionItem, { foreignKey: 'medication_id', as: 'prescription_items' });
PrescriptionItem.belongsTo(Medication, { foreignKey: 'medication_id', as: 'medication' });

Patient.hasMany(MedicalRecord, { foreignKey: 'patient_id', as: 'medical_records' });
MedicalRecord.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Doctor.hasMany(MedicalRecord, { foreignKey: 'doctor_id', as: 'medical_records' });
MedicalRecord.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

export {
  sequelize,
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
};
