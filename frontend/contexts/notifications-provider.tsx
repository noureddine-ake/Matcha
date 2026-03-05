"use client";

import api from "@/lib/api";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { useWebSocket } from "./WebSocketContext";
import { NotificationWrapper } from "@/types/websocket.types";

const getNotificationMessage = (type: string, username: string): string => {
  switch (type) {
    case "like":    return `${username} liked your profile`;
    case "match":   return `You matched with ${username}!`;
    case "view":    return `${username} viewed your profile`;
    case "message": return `New message from ${username}`;
    case "unlike":  return `${username} unliked your profile`;
    default:        return "New notification";
  }
};

export interface Notification {
  id: number;
  type: string;
  is_read: boolean;
  created_at: string;
  from_username: string;
  from_user_id: number;
  message?: string;
}

interface NotificationsContextType {
  showPopup: boolean;
  loading: boolean;
  error: string;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;

  // Functions
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

// ==== Context ====

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

// ==== Provider ====

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showPopup, setShowPopup] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Get WebSocket context for registering handlers
  const { registerHandler } = useWebSocket();

  // ✅ Handle incoming notification from WebSocket
  const handleNotification = useCallback((message: NotificationWrapper) => {
    const { type, from_user } = message.data;
    const msg = getNotificationMessage(type, from_user.username);

    const newNotification: Notification = {
      id: message.data.id,
      type,
      is_read: message.data.is_read,
      created_at: new Date().toISOString(),
      from_username: from_user.username,
      from_user_id: from_user.id,
      message: msg,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    toast(msg);
  }, []);

  // ✅ Register WebSocket handler for notifications
  useEffect(() => {
    const unsubscribe = registerHandler("notification", handleNotification);
    return () => {
      unsubscribe();
    };
  }, [registerHandler, handleNotification]);

  // ✅ Fetch notifications from your API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.post("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      setError("Error fetching notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ==== Memoized value ====
  const value = useMemo(
    () => ({
      loading,
      error,
      notifications,
      showPopup,

      setNotifications,
      setShowPopup,
      fetchNotifications,
      markAsRead,
    }),
    [loading, error, notifications, showPopup]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// ==== Custom hook ====

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context)
    throw new Error("useGlobal must be used within a NotificationsProvider");
  return context;
};
