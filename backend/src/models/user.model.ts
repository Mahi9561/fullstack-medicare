import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import { ROLES, USER_STATUSES, type Role, type UserStatus } from '../config/constants';
import type { Doctor } from './doctor.model';
import type { Patient } from './patient.model';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare password_hash: string;
  declare role: Role;
  declare status: CreationOptional<UserStatus>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare patient?: NonAttribute<Patient>;
  declare doctor?: NonAttribute<Doctor>;

  /** Belt and braces: the hash can never leave the API, even if a query forgets to exclude it. */
  toJSON(): object {
    const values = super.toJSON() as Record<string, unknown>;
    delete values.password_hash;
    return values;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false },
    status: { type: DataTypes.ENUM(...USER_STATUSES), allowNull: false, defaultValue: 'ACTIVE' },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Queries exclude the hash unless the caller opts in with User.unscoped().
    defaultScope: { attributes: { exclude: ['password_hash'] } },
  },
);
