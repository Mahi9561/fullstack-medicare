import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../features/notifications/notificationsSlice';
import { paths } from '../../routes/paths';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { NotificationItem, Role } from '../../types';
import { cx } from '../../utils/cx';
import { errorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';

/** Where a notification leads, if anywhere, for the signed-in role. */
const linkFor = (notification: NotificationItem, role: Role | undefined): string | null => {
  if (!notification.entity_id) return null;
  if (role === 'DOCTOR' && notification.entity_type === 'appointment') return paths.doctor.appointment(notification.entity_id);
  if (role === 'PATIENT') {
    if (notification.entity_type === 'appointment') return paths.patient.appointments;
    if (notification.entity_type === 'consultation') return paths.patient.consultations;
    if (notification.entity_type === 'prescription') return paths.patient.prescriptions;
  }
  return null;
};

export default function Notifications() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const role = useAppSelector((state) => state.user.user?.role);
  const { items, meta, status, error, unreadCount } = useAppSelector((state) => state.notifications);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    void dispatch(fetchNotifications({ unread: unreadOnly || undefined, page, limit: 15 }));
    void dispatch(fetchUnreadCount());
  }, [dispatch, unreadOnly, page]);

  useEffect(load, [load]);

  const markAll = async () => {
    try {
      await dispatch(markAllNotificationsRead()).unwrap();
      toast.success('All notifications marked as read');
      if (unreadOnly) load();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
        actions={
          <Button variant="secondary" onClick={markAll} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        }
      />

      <div className="mb-5 inline-flex rounded-md border border-rule bg-white p-0.5" role="group" aria-label="Filter notifications">
        {[
          { label: 'All', value: false },
          { label: 'Unread', value: true },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={unreadOnly === option.value}
            onClick={() => {
              setUnreadOnly(option.value);
              setPage(1);
            }}
            className={cx('rounded px-4 py-1.5 text-sm font-medium transition-colors', unreadOnly === option.value ? 'bg-pine-600 text-white' : 'text-ink-soft hover:text-ink')}
          >
            {option.label}
          </button>
        ))}
      </div>

      {status === 'failed' && error && <ErrorNote message={error} onRetry={load} />}
      {status === 'loading' && items.length === 0 && <p className="text-ink-soft">Loading...</p>}
      {status === 'succeeded' && items.length === 0 && (
        <EmptyState title={unreadOnly ? 'Nothing unread' : 'No notifications yet'} description="Booking updates and new prescriptions show up here." />
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-rule rounded-lg border border-rule bg-white">
          {items.map((notification) => {
            const link = linkFor(notification, role);
            return (
              <li key={notification.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 gap-3">
                  <span
                    aria-hidden="true"
                    className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', notification.is_read ? 'bg-transparent' : 'bg-pine-600')}
                  />
                  <div className="min-w-0">
                    <p className={cx('text-sm', !notification.is_read && 'font-medium')}>
                      {!notification.is_read && <span className="sr-only">Unread: </span>}
                      {notification.message}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">{formatDateTime(notification.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {link && (
                    <Link to={link} onClick={() => void dispatch(markNotificationRead(notification.id))}>
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                  {!notification.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => void dispatch(markNotificationRead(notification.id))}>
                      Mark as read
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination meta={meta} onPage={setPage} />
    </>
  );
}
