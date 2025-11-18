"use client";

import FilterPopup from "@/components/FilterPopup";
import NotificationPopup from "@/components/NotificationPopup";
import WebSocketProvider from "@/contexts/WebsocketProvider";
import { DiscoverProvider } from "@/contexts/discover-context";
import { NotificationsProvider } from "@/contexts/notifications-provider";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Flame, Heart, MessageCircle, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("discover");

  const pathname = usePathname();

  useEffect(() => {
    setActiveTab(pathname.slice(1));
  }, [pathname]);
  useEffect(() => {
    const stored = localStorage.getItem("user_location");

    // already stored successfully
    if (stored && stored !== "denied") return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          // ✅ Format to 6 decimal places to match DECIMAL(9,6)
          const latitude = parseFloat(pos.coords.latitude.toFixed(6));
          const longitude = parseFloat(pos.coords.longitude.toFixed(6));

          localStorage.setItem(
            "user_location",
            JSON.stringify({ latitude, longitude })
          );

          try {
            // send location to backend
            await api.put("/profile/update-location", { latitude, longitude });
            console.log("✅ Location synced with backend");
          } catch (err) {
            console.error("❌ Failed to send location:", err);
          }
        },
        (err) => {
          console.warn("⚠️ Location access denied:", err);
          localStorage.setItem("user_location", "denied");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      console.warn("❌ Geolocation not supported by this browser");
    }
  }, []);

  return (
    <DiscoverProvider>
      <NotificationsProvider>
        <WebSocketProvider>
          <div className="h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 pb-24 overflow-hidden flex items-center">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
                animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
              />
              <motion.div
                className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
                animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
                transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
              />
            </div>

            {/* Header */}
            <motion.div
              className="fixed top-0 left-0 right-0 h-[90px] bg-linear-to-b from-indigo-900/80 to-transparent backdrop-blur-lg border-b border-white/10 px-6 py-4 z-30"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-10 h-10 bg-linear-to-br from-pink-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white fill-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">Matcha</span>
                </motion.div>
                <div className="flex gap-2">
                  <FilterPopup />
                  <NotificationPopup />
                </div>
              </div>
            </motion.div>

            {/* Content Area */}
            <div className="z-10 max-w-7xl mx-auto w-full px-6 h-[calc(100%-180px)] overflow-hidden">
              {children}
            </div>

            {/* Bottom Navigation */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-linear-to-t from-indigo-900/95 to-indigo-900/80 backdrop-blur-lg border-t border-white/10 z-50 h-[90px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-around">
                  {[
                    { id: "discover", icon: Flame, label: "Discover" },
                    { id: "likes", icon: Heart, label: "Likes" },
                    { id: "chat", icon: MessageCircle, label: "Chat" },
                    // { id: "search", icon: Search, label: "Search" },
                    { id: "profile", icon: User, label: "Profile" },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        router.push(`/${tab.id}`);
                      }}
                      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? "bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <tab.icon className="w-6 h-6" />
                      <span className="text-xs font-semibold">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </WebSocketProvider>
      </NotificationsProvider>
    </DiscoverProvider>
  );
}
