import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUnreadCount } from '../../features/notifications/notificationsSlice';
import { paths } from '../../routes/paths';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { BellIcon } from '../ui/icons';

const POLL_MS = 30_000;

/** Polls the unread count every 30 seconds. Plain HTTP is enough here; WebSockets would be overkill. */
export function NotificationBell() {
  const dispatch = useAppDispatch();
  const count = useAppSelector((state) => state.notifications.unreadCount);

  useEffect(() => {
    void dispatch(fetchUnreadCount());
    const timer = window.setInterval(() => void dispatch(fetchUnreadCount()), POLL_MS);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  return (
    <Link
      to={paths.notifications}
      aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-soft hover:bg-pine-50 hover:text-ink"
    >
      <BellIcon />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 min-w-[1.15rem] rounded-full bg-red-600 px-1 text-center text-[0.65rem] font-semibold leading-[1.15rem] text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
