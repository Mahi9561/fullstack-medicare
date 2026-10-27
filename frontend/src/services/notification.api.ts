import type { NotificationItem } from '../types';
import { compact } from '../utils/format';
import { getData, getPage, patchData } from './apiClient';

export const notificationApi = {
  list: (params: { unread?: boolean; page?: number; limit?: number }) =>
    getPage<NotificationItem>('/notifications', compact(params)),
  unreadCount: async () => (await getData<{ count: number }>('/notifications/unread-count')).count,
  markRead: (id: number) => patchData<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => patchData<{ updated: number }>('/notifications/read-all'),
};
