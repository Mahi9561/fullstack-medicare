import { z } from 'zod';
import { booleanQuery, paginationQuery } from './common';

export const listNotificationsQuery = z.object({
  unread: booleanQuery.optional(),
  ...paginationQuery,
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;
