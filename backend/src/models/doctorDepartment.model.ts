import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import type { Department } from './department.model';

export class DoctorDepartment extends Model<InferAttributes<DoctorDepartment>, InferCreationAttributes<DoctorDepartment>> {
  declare doctor_id: number;
  declare department_id: number;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare department?: NonAttribute<Department>;
}

DoctorDepartment.init(
  {
    doctor_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
    department_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'doctor_departments', modelName: 'DoctorDepartment', createdAt: 'created_at', updatedAt: 'updated_at' },
);
