'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/contexts/notifications-provider';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';

const NotificationPopup = () => {
    const ntf = useNotifications();

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="icon"
        className="bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-lg rounded-full relative"
        onClick={() => {
          ntf.setShowPopup(!ntf.showPopup);
          // if (!ntf.showPopup) ntf.fetchNotifications();
        }}
      >
        <Bell className="w-5 h-5 text-white" />
        {ntf.notifications.some((n) => !n.is_read) && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-pink-500 rounded-full" />
        )}
      </Button>

      {/* Popup Modal */}
      <AnimatePresence>
        {ntf.showPopup && (
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
                    onClick={() => ntf.setNotifications([])}
                  >
                    Clear All
                  </Button>
                </div>

                {ntf.loading ? (
                  <p className="text-center text-sm text-purple-300/60 py-4">Loading...</p>
                ) : ntf.notifications.length === 0 ? (
                  <p className="text-center text-sm text-purple-300/60 py-4">
                    No new notifications
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {ntf.notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => ntf.markAsRead(n.id)}
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
