import { useState, useRef, useEffect } from 'react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative"
      >
        <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
            <h3 className="font-headline font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-primary font-semibold">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto" aria-live="polite" aria-label="Notification list">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-on-surface-variant text-sm">No notifications</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n._id} onClick={() => !n.isRead && markRead.mutate(n._id)}
                  className={`p-4 border-b border-outline-variant/5 cursor-pointer hover:bg-surface-container-low transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}>
                  <p className="text-sm font-semibold text-on-surface">{n.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
