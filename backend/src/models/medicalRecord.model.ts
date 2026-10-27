import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import { RECORD_TYPES, type RecordType } from '../config/constants';
import type { Doctor } from './doctor.model';

export class MedicalRecord extends Model<InferAttributes<MedicalRecord>, InferCreationAttributes<MedicalRecord>> {
  declare id: CreationOptional<number>;
  declare patient_id: number;
  declare doctor_id: number;
  declare title: string;
  declare record_type: RecordType;
  declare description: string;
  declare record_date: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare doctor?: NonAttribute<Doctor>;
}

MedicalRecord.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    patient_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    record_type: { type: DataTypes.ENUM(...RECORD_TYPES), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    record_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'medical_records', modelName: 'MedicalRecord', createdAt: 'created_at', updatedAt: 'updated_at' },
);
