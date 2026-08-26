import { useCallback, useState } from "react";

const DEFAULT_TIMEOUT = 5500;

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const dismissNotification = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    ({
      title,
      message,
      type = "info",
      browserId = null,
      timeout = DEFAULT_TIMEOUT,
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const notification = {
        id,
        title,
        message,
        type,
        browserId,
        createdAt: new Date().toLocaleTimeString("pl-PL"),
      };

      setNotifications((current) => [notification, ...current].slice(0, 5));

      if (timeout > 0) {
        window.setTimeout(() => dismissNotification(id), timeout);
      }

      return id;
    },
    [dismissNotification],
  );

  return {
    notifications,
    notify,
    dismissNotification,
  };
}
