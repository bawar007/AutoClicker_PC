const TYPE_LABELS = {
  success: "OK",
  warning: "UWAGA",
  error: "BŁĄD",
  info: "INFO",
};

export default function Notifications({ notifications, onDismiss }) {
  if (!notifications.length) return null;

  return (
    <div className="notifications-stack" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-toast notification-toast--${notification.type}`}
        >
          <div className="notification-toast__accent">
            {TYPE_LABELS[notification.type] ?? "INFO"}
          </div>
          <div className="notification-toast__content">
            <div className="notification-toast__header">
              <strong>{notification.title}</strong>
              <span>{notification.createdAt}</span>
            </div>
            <div className="notification-toast__message">
              {notification.message}
            </div>
          </div>
          <button
            className="notification-toast__close"
            type="button"
            title="Zamknij powiadomienie"
            onClick={() => onDismiss(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
