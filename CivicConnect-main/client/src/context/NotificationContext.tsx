import { createContext, useEffect, useState, type PropsWithChildren } from "react";

import { useAuth } from "../hooks/useAuth";
import api, { type AppNotification } from "../services/api";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<{ data: { items: AppNotification[]; unreadCount: number } }>("/notifications?limit=12");
      setNotifications(response.data.data.items);
      setUnreadCount(response.data.data.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await api.patch(`/notifications/${notificationId}/read`);
    setNotifications((current) => current.map((item) => (item._id === notificationId ? { ...item, read: true } : item)));
    setUnreadCount((current) => Math.max(0, current - 1));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const runLoad = async () => {
      await refreshNotifications();
    };

    void runLoad();
    const intervalId = window.setInterval(() => {
      void runLoad();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
