"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useGlobal, User } from "@/contexts/globalcontext";
import api from "@/lib/api";
import fetchFlag from "@/lib/fetchflag";
import { useParams } from "next/navigation";
import { ShieldOff, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

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

import { useWebSocket } from "@/contexts/WebSocketContext";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:5000";

type BlockStatus = {
  iBlocked: boolean;
  theyBlocked: boolean;
};

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

function BlockedProfileWall({
  username,
  blockStatus,
  onUnblock,
  onBlock,
}: {
  username: string;
  blockStatus: BlockStatus;
  onUnblock: () => Promise<void>;
  onBlock: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  const handleAction = async (fn: () => Promise<void>) => {
    setPending(true);
    try {
      await fn();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 text-center p-8 max-w-sm"
      >
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ShieldOff className="w-10 h-10 text-white/30" />
        </div>
        <div>
          <p className="text-xl font-semibold text-white mb-2">@{username}</p>
          <p className="text-white/40 text-sm">
            {blockStatus.iBlocked
              ? "You have blocked this user. Unblock to see their profile."
              : "This user has blocked you."}
          </p>
        </div>
        {blockStatus.iBlocked && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            onClick={() => handleAction(onUnblock)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg transition-all duration-300 font-semibold disabled:opacity-50"
          >
            Unblock
          </motion.button>
        )}
        {blockStatus.theyBlocked && !blockStatus.iBlocked && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            onClick={() => handleAction(onBlock)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-xl shadow-lg transition-all duration-300 border border-gray-700 disabled:opacity-50"
          >
            <ThumbsDown className="w-5 h-5" />
            Block as well
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, loading, fetchUserProfile } = useGlobal();
  const [showSettings, setShowSettings] = useState(false);
  const [flagUrl, setFlagUrl] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<User | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<"online" | "offline">("offline");
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
  const [blockedUsername, setBlockedUsername] = useState<string | null>(null);

  const { registerHandler, send, isConnected, onlineUsers, userStatuses } = useWebSocket();

  const updateLocationAllFields = useCallback(async (lat: number, lng: number) => {
    try {
      await api.put("/profile/update-location", { latitude: lat, longitude: lng });
      setCurrentProfile((prev) =>
        prev ? { ...prev, latitude: lat, longitude: lng, position: { latitude: lat, longitude: lng } } : prev
      );
    } catch (err) {
      console.error("[updateLocationAllFields] Error:", err);
    }
  }, []);

  const isCurrentUser = Boolean(user && user.username === decodeURIComponent(username));

  useEffect(() => {
    if (!user) return;

    const decodedUsername = decodeURIComponent(username);
    if (user.username === decodedUsername) {
      setCurrentProfile(user);
    } else {
      api.get(`/profile/user/${decodedUsername}`)
        .then((res) => {
          setCurrentProfile(res.data);
        })
        .catch((err) => {
          if (err.response?.status === 403 && err.response.data?.error === "blocked") {
            setBlockStatus({
              iBlocked: err.response.data.iBlocked,
              theyBlocked: err.response.data.theyBlocked,
            });
            setBlockedUsername(err.response.data.username);
          }
        });
    }
  }, [user, username, fetchUserProfile]);

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

  useEffect(() => {
    if (!currentProfile?.id) return;

    const profileId = currentProfile.id.toString();

    const isUserOnline = onlineUsers.some((u) => u.userId === profileId);
    setOnlineStatus(isUserOnline ? "online" : "offline");

    const status = userStatuses.get(profileId);
    if (status?.lastSeen) {
      setLastSeen(
        typeof status.lastSeen === "string"
          ? status.lastSeen
          : status.lastSeen.toISOString()
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile]);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const profileId = currentProfile.id.toString();

    const handleStatusChange = (data: UserStatusChangeMessage) => {
      if (data.data?.userId === profileId) {
        setOnlineStatus(data.data.status);
        if (data.data.lastSeen) setLastSeen(data.data.lastSeen);
      }
    };

    const handleUsersOnline = (data: UsersOnlineMessage) => {
      const isOnline = data.users?.some((u) => u.userId === profileId);
      setOnlineStatus(isOnline ? "online" : "offline");
    };

    const unsubscribeStatusChange = registerHandler("user_status_change", handleStatusChange);
    const unsubscribeUsersOnline = registerHandler("users_online", handleUsersOnline);

    if (isConnected) {
      send({ type: "get_user_status", userIds: [profileId] });
    }

    return () => {
      unsubscribeStatusChange();
      unsubscribeUsersOnline();
    };
  }, [currentProfile, isConnected, registerHandler, send]);

  const handleUnblock = async () => {
    try {
      await api.delete(`/users/block/${blockedUsername}`);
      setBlockStatus(null);
      setBlockedUsername(null);
      setCurrentProfile(null);
      api.get(`/profile/user/${decodeURIComponent(username)}`)
        .then((res) => setCurrentProfile(res.data))
        .catch((err) => {
          if (err.response?.status === 403 && err.response.data?.error === "blocked") {
            setBlockStatus({
              iBlocked: err.response.data.iBlocked,
              theyBlocked: err.response.data.theyBlocked,
            });
            setBlockedUsername(err.response.data.username);
          }
        });
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  const handleBlockBack = async () => {
    try {
      await api.post(`/users/block/${blockedUsername}`);
      setBlockStatus((prev) => prev ? { ...prev, iBlocked: true } : prev);
      toast.success("User blocked");
    } catch {
      toast.error("Failed to block user");
    }
  };

  if (loading || (!currentProfile && !blockStatus)) {
    return <ProfileLoading variant={loading ? "skeleton" : "spinner"} />;
  }

  if (!isCurrentUser && blockStatus && blockedUsername) {
    return (
      <BlockedProfileWall
        username={blockedUsername}
        blockStatus={blockStatus}
        onUnblock={handleUnblock}
        onBlock={handleBlockBack}
      />
    );
  }

  if (!currentProfile) {
    return <ProfileLoading variant="spinner" />;
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
              lastSeen={lastSeen}
              onEditClick={() => setShowSettings(true)}
            />

            <div className="flex-1 text-white w-full min-w-0 overflow-hidden">
              <ProfileInfo
                currentProfile={currentProfile}
                isCurrentUser={isCurrentUser}
                flagUrl={flagUrl}
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
