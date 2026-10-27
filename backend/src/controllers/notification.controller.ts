import { notificationService } from '../services/notification.service';
import { getActor, idParam, queryOf } from '../utils/actor';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { ListNotificationsQuery } from '../validators/notification.validator';

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    sendPaginated(res, await notificationService.list(getActor(req), queryOf<ListNotificationsQuery>(req)));
  }),

  unreadCount: asyncHandler(async (req, res) => {
    sendSuccess(res, await notificationService.unreadCount(getActor(req)));
  }),

  markRead: asyncHandler(async (req, res) => {
    sendSuccess(res, await notificationService.markRead(getActor(req), idParam(req)), 'Marked as read');
  }),

  markAllRead: asyncHandler(async (req, res) => {
    sendSuccess(res, await notificationService.markAllRead(getActor(req)), 'All notifications marked as read');
  }),
};
