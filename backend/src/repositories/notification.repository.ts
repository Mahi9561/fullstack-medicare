import type { CreationAttributes } from 'sequelize';
import { Notification } from '../models';
import type { Paging, Tx } from './types';

interface ListParams extends Paging {
  unreadOnly: boolean;
}

export const notificationRepository = {
  create: (values: CreationAttributes<Notification>, tx: Tx = {}) => Notification.create(values, tx),

  list: (userId: number, { unreadOnly, limit, offset }: ListParams) =>
    Notification.findAndCountAll({
      where: { user_id: userId, ...(unreadOnly ? { is_read: false } : {}) },
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
    }),

  countUnread: (userId: number) => Notification.count({ where: { user_id: userId, is_read: false } }),

  findOwned: (id: number, userId: number) => Notification.findOne({ where: { id, user_id: userId } }),

  markRead: (notification: Notification) => notification.update({ is_read: true }),

  markAllRead: async (userId: number): Promise<number> => {
    const [updated] = await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
    return updated;
  },
};
