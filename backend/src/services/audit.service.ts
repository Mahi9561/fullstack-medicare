import type { Transaction } from 'sequelize';
import type { AuditAction } from '../config/constants';
import { auditRepository } from '../repositories/audit.repository';

interface Who {
  userId: number | null;
  ip: string | null;
}

interface Details {
  entityType?: string;
  entityId?: number;
  /** Non-sensitive context only. Never put passwords, tokens or clinical text here. */
  metadata?: Record<string, unknown>;
}

export const auditService = {
  /** Pass the caller's transaction so the audit row commits or rolls back together with the action. */
  log: (who: Who, action: AuditAction, details: Details = {}, transaction?: Transaction) =>
    auditRepository.create(
      {
        user_id: who.userId,
        action,
        entity_type: details.entityType ?? null,
        entity_id: details.entityId ?? null,
        metadata: details.metadata ?? null,
        ip_address: who.ip,
      },
      { transaction },
    ),
};
