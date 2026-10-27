import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import type { Medication } from './medication.model';

export class PrescriptionItem extends Model<InferAttributes<PrescriptionItem>, InferCreationAttributes<PrescriptionItem>> {
  declare id: CreationOptional<number>;
  declare prescription_id: number;
  declare medication_id: number;
  declare dosage: string;
  declare frequency: string;
  declare duration_days: number;
  declare instructions: string | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare medication?: NonAttribute<Medication>;
}

PrescriptionItem.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    prescription_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    medication_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    dosage: { type: DataTypes.STRING(100), allowNull: false },
    frequency: { type: DataTypes.STRING(100), allowNull: false },
    duration_days: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    instructions: { type: DataTypes.STRING(255), allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'prescription_items', modelName: 'PrescriptionItem', createdAt: 'created_at', updatedAt: 'updated_at' },
);
