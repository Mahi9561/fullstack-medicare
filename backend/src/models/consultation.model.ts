import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import type { Appointment } from './appointment.model';
import type { Doctor } from './doctor.model';
import type { Patient } from './patient.model';
import type { Prescription } from './prescription.model';

export class Consultation extends Model<InferAttributes<Consultation>, InferCreationAttributes<Consultation>> {
  declare id: CreationOptional<number>;
  declare appointment_id: number;
  declare patient_id: number;
  declare doctor_id: number;
  declare symptoms: string;
  declare diagnosis: string;
  declare notes: string | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare appointment?: NonAttribute<Appointment>;
  declare patient?: NonAttribute<Patient>;
  declare doctor?: NonAttribute<Doctor>;
  declare prescription?: NonAttribute<Prescription>;
}

Consultation.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    appointment_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    patient_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    symptoms: { type: DataTypes.TEXT, allowNull: false },
    diagnosis: { type: DataTypes.TEXT, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'consultations', modelName: 'Consultation', createdAt: 'created_at', updatedAt: 'updated_at' },
);
