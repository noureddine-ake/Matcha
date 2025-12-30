"use client";

import api from "@/lib/api";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ==== Types ====

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
