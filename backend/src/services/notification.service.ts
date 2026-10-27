import type { Transaction } from 'sequelize';
import type { NotificationType } from '../config/constants';
import { NotFoundError } from '../errors';
import { notificationRepository } from '../repositories/notification.repository';
import type { Actor, Paginated } from '../types';
import { buildMeta, offsetOf } from '../utils/pagination';
import type { ListNotificationsQuery } from '../validators/notification.validator';

interface NotifyInput {
  userId: number;
  type: NotificationType;
  message: string;
  entityType?: string;
  entityId?: number;
}

export const notificationService = {
  /** Called by other services, inside their transaction, so a rolled-back action sends nothing. */
  notify: (input: NotifyInput, transaction?: Transaction) =>
    notificationRepository.create(
      {
        user_id: input.userId,
        type: input.type,
        message: input.message.slice(0, 255),
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        is_read: false,
      },
      { transaction },
    ),

  async list(actor: Actor, query: ListNotificationsQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await notificationRepository.list(actor.userId, {
      unreadOnly: query.unread ?? false,
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },

  async unreadCount(actor: Actor) {
    return { count: await notificationRepository.countUnread(actor.userId) };
  },

  async markRead(actor: Actor, id: number) {
    const notification = await notificationRepository.findOwned(id, actor.userId);
    if (!notification) throw new NotFoundError('Notification not found');
    return notificationRepository.markRead(notification);
  },

  async markAllRead(actor: Actor) {
    return { updated: await notificationRepository.markAllRead(actor.userId) };
  },
};
