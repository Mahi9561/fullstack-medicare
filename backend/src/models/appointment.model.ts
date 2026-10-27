import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import { APPOINTMENT_STATUSES, type AppointmentStatus } from '../config/constants';
import { timeColumn } from './columns';
import type { Consultation } from './consultation.model';
import type { Doctor } from './doctor.model';
import type { Patient } from './patient.model';
import type { VitalSign } from './vitalSign.model';

// The generated column `active_slot` is deliberately not declared here: MySQL maintains it,
// and Sequelize must never try to write to it.
export class Appointment extends Model<InferAttributes<Appointment>, InferCreationAttributes<Appointment>> {
  declare id: CreationOptional<number>;
  declare patient_id: number;
  declare doctor_id: number;
  declare appointment_date: string;
  declare start_time: string;
  declare end_time: string;
  declare status: CreationOptional<AppointmentStatus>;
  declare reason: string;
  declare cancellation_reason: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare patient?: NonAttribute<Patient>;
  declare doctor?: NonAttribute<Doctor>;
  declare consultation?: NonAttribute<Consultation>;
  declare vital_signs?: NonAttribute<VitalSign>;
}

Appointment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    patient_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    appointment_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: timeColumn('start_time'),
    end_time: timeColumn('end_time'),
    status: { type: DataTypes.ENUM(...APPOINTMENT_STATUSES), allowNull: false, defaultValue: 'BOOKED' },
    reason: { type: DataTypes.STRING(500), allowNull: false },
    cancellation_reason: { type: DataTypes.STRING(500), allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'appointments', modelName: 'Appointment', createdAt: 'created_at', updatedAt: 'updated_at' },
);
