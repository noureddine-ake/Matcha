"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useGlobal, User } from "@/contexts/globalcontext";
import api from "@/lib/api";
import fetchFlag from "@/lib/fetchflag";
import { useParams } from "next/navigation";

import {
  ProfileHeader,
  ProfileInfo,
  ProfileBirthday,
  ProfileActions,
  ProfileBio,
  ProfileStats,
  ProfileContent,
  ProfileLoading,
} from "@/components/profile";
import SettingsPanel from "@/components/profile/SettingsPanel";

// Import WebSocket context
import { useWebSocket } from "@/contexts/WebSocketContext";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:5000";


type UserStatusChangeMessage = {
  type: "user_status_change";
  data: {
    userId: string;
    status: "online" | "offline";
    lastSeen?: string;
  };
};

type UsersOnlineMessage = {
  type: "users_online";
  users: {
    userId: string;
  }[];
};
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile, loading, fetchUserProfile } = useGlobal();
  const [showSettings, setShowSettings] = useState(false);
  const [flagUrl, setFlagUrl] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<User | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<"online" | "offline">("offline");
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  // Get WebSocket
  const { registerHandler, send, isConnected, onlineUsers, userStatuses } = useWebSocket();

  const updateLocationAllFields = useCallback(async (lat: number, lng: number) => {
    try {
      await api.put("/profile/update-location", { latitude: lat, longitude: lng });
      const res = await api.get('/profile');
      setCurrentProfile(res.data);
    } catch (err) {
      console.error("[updateLocationAllFields] Error:", err);
    }
  }, []);

  const isCurrentUser = Boolean(user && user.username === decodeURIComponent(username));

  // Fetch / set profile
  useEffect(() => {
    if (!user) return;

    const decodedUsername = decodeURIComponent(username);
    if (user.username === decodedUsername) {
      setCurrentProfile(user);
    } else {
      fetchUserProfile?.(username);
    }
  }, [user, username, fetchUserProfile]);

  useEffect(() => {
    if (profile && user && user.username !== username) {
      setCurrentProfile(profile);
    }
  }, [profile, user, username]);

  // Fetch flag and update location
  useEffect(() => {
    let userLocation = { latitude: null, longitude: null };
    try {
      const stored = window.localStorage.getItem("user_location");
      if (stored && stored !== "denied") {
        userLocation = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Invalid user_location in localStorage:", e);
    }
    const { latitude, longitude } = userLocation;

    const getFlag = async () => {
      if (latitude && longitude) {
        const url = await fetchFlag({ latitude, longitude });
        setFlagUrl(url || null);
      }
    };
    getFlag();

    if (isCurrentUser && latitude && longitude) {
      updateLocationAllFields(latitude, longitude);
    }
  }, [isCurrentUser, updateLocationAllFields]);

  // --- FIXED: WebSocket: Track online/offline status ---
  useEffect(() => {
    if (!currentProfile || !currentProfile.id) return;

    const profileId = currentProfile.id.toString();

    // Check initial status from onlineUsers list
    const isUserOnline = onlineUsers.some(user => user.userId === profileId);
    setOnlineStatus(isUserOnline ? "online" : "offline");

    // Check status from userStatuses map
    const status = userStatuses.get(profileId);
    if (status?.lastSeen) {
  const formatted =
    typeof status.lastSeen === "string"
      ? status.lastSeen
      : status.lastSeen.toISOString();

  setLastSeen(formatted);
}

    // Handler for status changes - FIXED: using 'user_status_change' which is what your server sends
    const handleStatusChange = (data: UserStatusChangeMessage) => {
      console.log("Status change received:", data);
      
      if (data.data && data.data.userId === profileId) {
        setOnlineStatus(data.data.status);
        if (data.data.lastSeen) {
          setLastSeen(data.data.lastSeen);
        }
      }
    };

    // Handler for initial users list
    const handleUsersOnline = (data: UsersOnlineMessage) => {
      console.log("Online users received:", data);
      const isOnline = data.users?.some((u) => u.userId === profileId);
      setOnlineStatus(isOnline ? "online" : "offline");
    };

    // Register handlers with CORRECT message types
    const unsubscribeStatusChange = registerHandler("user_status_change", handleStatusChange);
    const unsubscribeUsersOnline = registerHandler("users_online", handleUsersOnline);

    // Request current status for this user
    if (isConnected && profileId) {
      console.log("Requesting status for user:", profileId);
      send({ 
        type: "get_user_status", 
        userIds: [profileId] 
      });
    }

    return () => {
      unsubscribeStatusChange();
      unsubscribeUsersOnline();
    };
  }, [currentProfile, onlineUsers, userStatuses, registerHandler, send, isConnected]);

  // Debug logging
  useEffect(() => {
    if (currentProfile) {
      console.log(`Profile ${currentProfile.username} (ID: ${currentProfile.id}) status:`, onlineStatus);
      console.log("Online users:", onlineUsers);
    }
  }, [currentProfile, onlineStatus, onlineUsers]);

  if (loading || !currentProfile) {
    return <ProfileLoading variant={loading ? "skeleton" : "spinner"} />;
  }

  return (
    <div className="h-full overflow-scroll no-scrollbar w-full max-w-6xl">
      <div className="relative overflow-hidden w-full">
        <div className="absolute inset-0"></div>
        <div className="relative w-full mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col mx-auto max-w-full md:flex-row gap-8"
          >
            <ProfileHeader
              currentProfile={currentProfile}
              backendUrl={BACKEND_URL}
              isCurrentUser={isCurrentUser}
              onlineStatus={onlineStatus}
              lastSeen={lastSeen} // You might want to pass this to show "last seen" time
              onEditClick={() => setShowSettings(true)}
            />

            <div className="flex-1 text-white w-full min-w-0 overflow-hidden">
              <ProfileInfo
                currentProfile={currentProfile}
                isCurrentUser={isCurrentUser}
                flagUrl={flagUrl}
                // onlineStatus={onlineStatus}
              />

              {currentProfile.birth_date && (
                <ProfileBirthday birthDate={currentProfile.birth_date} />
              )}

              <ProfileActions
                isCurrentUser={isCurrentUser}
                username={username}
                userId={currentProfile.id.toString()}
              />

              <ProfileBio biography={currentProfile.biography} />

              <ProfileStats
                stats={currentProfile.stats}
                isCurrentUser={isCurrentUser}
              />
            </div>
          </motion.div>
        </div>
        <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>

      <ProfileContent
        currentProfile={currentProfile}
        backendUrl={BACKEND_URL}
        isCurrentUser={isCurrentUser}
      />
    </div>
  );
}