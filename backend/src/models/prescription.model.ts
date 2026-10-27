import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import type { Consultation } from './consultation.model';
import type { PrescriptionItem } from './prescriptionItem.model';

export class Prescription extends Model<InferAttributes<Prescription>, InferCreationAttributes<Prescription>> {
  declare id: CreationOptional<number>;
  declare consultation_id: number;
  declare notes: string | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare consultation?: NonAttribute<Consultation>;
  declare items?: NonAttribute<PrescriptionItem[]>;
}

Prescription.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    consultation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'prescriptions', modelName: 'Prescription', createdAt: 'created_at', updatedAt: 'updated_at' },
);
