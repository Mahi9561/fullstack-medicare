import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';
import { decimalColumn } from './columns';

export class VitalSign extends Model<InferAttributes<VitalSign>, InferCreationAttributes<VitalSign>> {
  declare id: CreationOptional<number>;
  declare appointment_id: number;
  declare patient_id: number;
  declare doctor_id: number;
  declare bp_systolic: number | null;
  declare bp_diastolic: number | null;
  declare heart_rate: number | null;
  declare temperature_f: number | null;
  declare weight_kg: number | null;
  declare height_cm: number | null;
  declare spo2: number | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

VitalSign.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    appointment_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    patient_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    bp_systolic: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    bp_diastolic: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    heart_rate: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    temperature_f: decimalColumn('temperature_f', 4, 1, true),
    weight_kg: decimalColumn('weight_kg', 5, 2, true),
    height_cm: decimalColumn('height_cm', 5, 1, true),
    spo2: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'vital_signs', modelName: 'VitalSign', createdAt: 'created_at', updatedAt: 'updated_at' },
);
