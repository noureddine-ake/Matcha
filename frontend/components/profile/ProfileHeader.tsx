"use client";

import { useState, useEffect } from "react";
import { Settings, LogOut, Loader2 } from "lucide-react";
import ProfilePicture from "@/components/ProfilePicture";
import { User } from "@/contexts/globalcontext";
import api from "@/lib/api";

interface ProfileHeaderProps {
  currentProfile: User;
  backendUrl: string;
  isCurrentUser: boolean;
  onEditClick: () => void;
  onlineStatus?: "online" | "offline";
  lastSeen?: string | null;
}

export default function ProfileHeader({
  currentProfile,
  backendUrl,
  isCurrentUser,
  onEditClick,
  onlineStatus = "offline",
  lastSeen = null,
}: ProfileHeaderProps) {
  const [loading, setLoading] = useState(false);
  const [formattedLastSeen, setFormattedLastSeen] = useState<string>("");

  // Format last seen time
  useEffect(() => {
    if (!lastSeen || onlineStatus === "online") {
      setFormattedLastSeen("");
      return;
    }

    const formatLastSeen = () => {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      
      return lastSeenDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    setFormattedLastSeen(formatLastSeen());

    // Update every minute
    const interval = setInterval(() => {
      setFormattedLastSeen(formatLastSeen());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [lastSeen, onlineStatus]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout");
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Error during logout:", err);
      window.location.href = "/auth/login";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        <ProfilePicture
          photos={currentProfile.photos}
          size={192}
          editable={isCurrentUser}
        />

        {/* Online Status Badge */}
        <div className="absolute -bottom-2 -right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
          <span
            className={`
              w-3 h-3 rounded-full 
              ${onlineStatus === "online" 
                ? "bg-green-500 animate-pulse" 
                : "bg-gray-500"
              }
            `}
          />
          <span className="text-xs font-medium text-white">
            {onlineStatus === "online" ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Last Seen (for other users when offline) */}
      {!isCurrentUser && onlineStatus === "offline" && formattedLastSeen && (
        <div className="mt-2 text-xs text-gray-400">
          Last seen {formattedLastSeen}
        </div>
      )}

      {/* Online now indicator for other users */}
      {!isCurrentUser && onlineStatus === "online" && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Online now</span>
        </div>
      )}

      {/* Settings & Logout for current user */}
      {isCurrentUser && (
        <div className="relative w-full flex flex-col items-center justify-center gap-4 p-5">
          <button
            onClick={onEditClick}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-md transition-all duration-300 border border-white/20 font-semibold flex items-center justify-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-md transition-all duration-300 border border-white/20 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                Logout
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}