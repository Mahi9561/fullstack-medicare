import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';
import { DAYS_OF_WEEK, type DayOfWeek } from '../config/constants';
import { timeColumn } from './columns';

export class DoctorAvailability extends Model<InferAttributes<DoctorAvailability>, InferCreationAttributes<DoctorAvailability>> {
  declare id: CreationOptional<number>;
  declare doctor_id: number;
  declare day_of_week: DayOfWeek;
  declare start_time: string;
  declare end_time: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

DoctorAvailability.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    doctor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    day_of_week: { type: DataTypes.ENUM(...DAYS_OF_WEEK), allowNull: false },
    start_time: timeColumn('start_time'),
    end_time: timeColumn('end_time'),
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'doctor_availability', modelName: 'DoctorAvailability', createdAt: 'created_at', updatedAt: 'updated_at' },
);
