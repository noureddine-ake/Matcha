"use client";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/notifications-provider";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X, Heart, MessageCircle, Eye, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart className="w-4 h-4 text-pink-400" />;
    case "match":
      return <Sparkles className="w-4 h-4 text-purple-400" />;
    case "message":
      return <MessageCircle className="w-4 h-4 text-blue-400" />;
    case "view":
      return <Eye className="w-4 h-4 text-green-400" />;
    default:
      return <Bell className="w-4 h-4 text-white/60" />;
  }
};

const NotificationPopup = () => {
  const ntf = useNotifications();
  const [mounted, setMounted] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        ntf.setShowPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ntf]);

  return (
    <div className="relative" ref={popupRef}>
      <Button
        variant="outline"
        size="icon"
        className="bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-3xl rounded-full relative w-10 h-10"
        onClick={() => ntf.setShowPopup(!ntf.showPopup)}
      >
        <Bell className="w-5 h-5 text-white" />
        {mounted && ntf.notifications.some((n) => !n.is_read) && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse" />
        )}
      </Button>

      <AnimatePresence>
        {ntf.showPopup && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-0 z-50 w-80"
          >
            <div className="bg-black/80 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Notifications</h2>
                  {ntf.notifications.length > 0 && (
                    <button
                      onClick={() => ntf.setNotifications([])}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {ntf.loading ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-white/50 text-sm mt-3">Loading...</p>
                  </div>
                ) : ntf.notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <p className="text-white/50 text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {ntf.notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        onClick={() => ntf.markAsRead(n.id)}
                        className={`p-4 hover:bg-white/10 cursor-pointer transition-all ${
                          n.is_read ? "opacity-60" : "bg-white/5"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            n.is_read ? "bg-white/10" : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                          }`}>
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {n.message ??
                                (n.type === "like"
                                  ? `${n.from_username} liked your profile`
                                  : n.type === "match"
                                  ? `You got a new match with ${n.from_username}`
                                  : n.type === "message"
                                  ? `You received a new message from ${n.from_username}`
                                  : n.type === "view"
                                  ? `You received a new view from ${n.from_username}`
                                  : "New notification")}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!n.is_read && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPopup;
