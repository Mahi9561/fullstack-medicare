import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

/** Append-only: rows are inserted and never updated, so there is no updated_at. */
export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  declare id: CreationOptional<number>;
  declare user_id: number | null;
  declare action: string;
  declare entity_type: string | null;
  declare entity_id: number | null;
  declare metadata: Record<string, unknown> | null;
  declare ip_address: string | null;
  declare created_at: CreationOptional<Date>;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    action: { type: DataTypes.STRING(50), allowNull: false },
    entity_type: { type: DataTypes.STRING(50), allowNull: true },
    entity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    created_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'audit_logs', modelName: 'AuditLog', createdAt: 'created_at', updatedAt: false },
);
