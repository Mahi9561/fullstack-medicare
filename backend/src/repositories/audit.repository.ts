import type { CreationAttributes } from 'sequelize';
import { AuditLog } from '../models';
import type { Tx } from './types';

export const auditRepository = {
  create: (values: CreationAttributes<AuditLog>, tx: Tx = {}) => AuditLog.create(values, tx),
};
