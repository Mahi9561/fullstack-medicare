import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import { decimalColumn } from './columns';
import type { Department } from './department.model';
import type { User } from './user.model';

export class Doctor extends Model<InferAttributes<Doctor>, InferCreationAttributes<Doctor>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare first_name: string;
  declare last_name: string;
  declare specialization: string;
  declare qualification: string;
  declare experience_years: CreationOptional<number>;
  declare consultation_fee: number;
  declare bio: string | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare departments?: NonAttribute<Department[]>;
}

Doctor.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    last_name: { type: DataTypes.STRING(100), allowNull: false },
    specialization: { type: DataTypes.STRING(100), allowNull: false },
    qualification: { type: DataTypes.STRING(255), allowNull: false },
    experience_years: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    consultation_fee: decimalColumn('consultation_fee', 10, 2),
    bio: { type: DataTypes.TEXT, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'doctors', modelName: 'Doctor', createdAt: 'created_at', updatedAt: 'updated_at' },
);
