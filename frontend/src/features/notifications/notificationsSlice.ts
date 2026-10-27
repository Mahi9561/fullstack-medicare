import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { notificationApi } from '../../services/notification.api';
import { createApiThunk } from '../../store/createApiThunk';
import type { NotificationItem, PageMeta } from '../../types';
import { logout, sessionExpired } from '../auth/authSlice';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface NotificationsState {
  items: NotificationItem[];
  meta: PageMeta | null;
  unreadCount: number;
  status: LoadStatus;
  error: string | null;
}

const initialState: NotificationsState = { items: [], meta: null, unreadCount: 0, status: 'idle', error: null };

export const fetchNotifications = createApiThunk(
  'notifications/fetch',
  (params: { unread?: boolean; page?: number; limit?: number }) => notificationApi.list(params),
);
export const fetchUnreadCount = createApiThunk('notifications/unreadCount', () => notificationApi.unreadCount());
export const markNotificationRead = createApiThunk('notifications/markRead', (id: number) => notificationApi.markRead(id));
export const markAllNotificationsRead = createApiThunk('notifications/markAllRead', () => notificationApi.markAllRead());

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message ?? 'Could not load notifications';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload.id);
        if (item && !item.is_read) {
          item.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((item) => {
          item.is_read = true;
        });
        state.unreadCount = 0;
      })
      .addMatcher(isAnyOf(logout.fulfilled, sessionExpired), () => initialState);
  },
});

export default notificationsSlice.reducer;
