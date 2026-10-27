import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { listNotificationsQuery } from '../validators/notification.validator';

const router = Router();
router.use(authenticateUser);

router.get('/', validate({ query: listNotificationsQuery }), notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', validate({ params: idParams }), notificationController.markRead);

export default router;
