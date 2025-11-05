'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api'; // your axios override

interface Notification {
  id: number;
  type: string;
  is_read: boolean;
  created_at: string;
  from_username: string;
  from_user_id: number;
  message?: string;
}

const NotificationPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch notifications from your API
  const fetchNotifications = async () => {
    
    try {
      setLoading(true);
      const res = await api.post('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
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

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="icon"
        className="bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-lg rounded-full relative"
        onClick={() => {
          setShowPopup(!showPopup);
          if (!showPopup) fetchNotifications();
        }}
      >
        <Bell className="w-5 h-5 text-white" />
        {notifications.some((n) => !n.is_read) && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-pink-500 rounded-full" />
        )}
      </Button>

      {/* Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute top-12 right-0 z-50 w-80"
          >
            <Card className="bg-gradient-to-t from-indigo-900/95 to-indigo-900/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl">
              <CardContent className="p-4 space-y-3 text-white">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-white">Notifications</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-300 hover:bg-white/10"
                    onClick={() => setNotifications([])}
                  >
                    Clear All
                  </Button>
                </div>

                {loading ? (
                  <p className="text-center text-sm text-purple-300/60 py-4">Loading...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-center text-sm text-purple-300/60 py-4">
                    No new notifications
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 rounded-lg border border-white/10 hover:bg-white/20 transition cursor-pointer ${
                          n.is_read ? 'bg-white/5' : 'bg-white/10'
                        }`}
                      >
                        <p className="text-sm">
                          {n.message ??
                            (n.type === 'like'
                              ? `${n.from_username} liked your profile`
                              : n.type === 'match'
                              ? `You got a new match with ${n.from_username}`
                              : n.type === 'message'
                              ? `You received a new message from ${n.from_username}`
                              : 'New notification')}
                        </p>
                        <p className="text-xs text-purple-300/60 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPopup;
