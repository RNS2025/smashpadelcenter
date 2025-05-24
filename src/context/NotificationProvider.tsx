// context/NotificationProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useUser } from "./UserContext";
import { notificationService } from "../services/notificationsService";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link?: string;
  route?: string;
  timestamp: string;
  data?: any;
  read?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useUser();

  // Helper to get the localStorage key for the current user
  const getStorageKey = () =>
    user && user.username ? `notifications_${user.username}` : null;

  // Load notifications from localStorage when user changes
  useEffect(() => {
    const key = getStorageKey();
    if (key) {
      const savedNotifications = localStorage.getItem(key);
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch (error) {
          console.error("Error parsing saved notifications:", error);
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
  }, [user?.username]);

  // Save notifications to localStorage whenever they change (per user)
  useEffect(() => {
    const key = getStorageKey();
    if (key) {
      localStorage.setItem(key, JSON.stringify(notifications));
    }
  }, [notifications, user?.username]);

  // Handle new notifications
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      // Avoid duplicates
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) return prev;

      // Add new notification to the beginning
      const updated = [{ ...notification, read: false }, ...prev];

      // Keep only last 50 notifications
      return updated.slice(0, 50);
    });

    // Show browser notification if supported and permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
      });

      // Close notification after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle click on browser notification
      browserNotification.onclick = () => {
        window.focus();
        if (notification.route) {
          // You can use your router here
          window.location.hash = notification.route;
        } else if (notification.link) {
          window.open(notification.link, "_blank");
        }
        browserNotification.close();
      };
    }
  }, []);
  // Connect to notification service when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      notificationService.connect(handleNewNotification, setIsConnected);

      // Request notification permission and subscribe to push notifications
      const setupPushNotifications = async () => {
        try {
          const permission =
            await notificationService.requestNotificationPermission();
          if (permission === "granted") {
            const subscribed =
              await notificationService.subscribeToPushNotifications();
            if (subscribed) {
              console.log("Successfully set up push notifications");
            }
          }
        } catch (error) {
          console.error("Error setting up push notifications:", error);
        }
      };

      setupPushNotifications();

      return () => {
        notificationService.disconnect();
      };
    } else {
      notificationService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated, user, handleNewNotification]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
