import { User } from "@/types/chat.types";
import { Menu, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { motion } from 'framer-motion';
import { useUserStatus } from "@/contexts/WebSocketContext"; // Add this import

interface ChatHeaderProps {
  user: User | null;
  isConnected: boolean;
  totalMessages: number;
  typingUsers: Set<string>;
  isMobile: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  totalMessages,
  typingUsers,
  isMobile,
  soundEnabled,
  onToggleSound,
  onToggleSidebar,
}) => {
  // Get real-time online status from WebSocket
  const { isOnline, lastSeen } = useUserStatus(user?.id || '');

  if (isMobile) {
    return (
      <div className="sticky top=[1px] left-0 right-0 border-b border-white/20 z-30 bg-black/90 backdrop-blur-lg">
        <div className="flex items-center justify-between p-2">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {user && (
            <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                {user.profile_photo ? (
                  <Image
                    src={user.profile_photo}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    width={32}
                    height={32}
                    unoptimized
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-white font-semibold text-sm truncate">
                  {user.username}
                </h2>
                <div className="flex items-center gap-1">
                  {/* <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isOnline
                      ? 'bg-green-500 text-white animate-pulse'
                      : 'bg-gray-500 text-white'
                    }`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span> */}
                  {typingUsers.has(user.id) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-purple-300 text-xs truncate"
                    >
                      typing...
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* <button
            onClick={onToggleSound}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button> */}
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-30 p-4 md:p-6 border-b border-white/20 bg-white/5 backdrop-blur-lg">
      {user && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0 relative">
              {user.profile_photo ? (
                <Image
                  src={user.profile_photo}
                  alt={user.username}
                  className="w-full h-full object-cover"
                  width={40}
                  height={40}
                  unoptimized
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
              {/* Small online dot on avatar for desktop */}
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-semibold truncate">{user.username}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {/* <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isOnline
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                  }`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span> */}
                {!isOnline && lastSeen && (
                  <span className="text-xs text-gray-400">
                    Last seen {new Date(lastSeen).toLocaleTimeString()}
                  </span>
                )}
                {typingUsers.has(user.id) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-300 text-sm"
                  >
                    typing...
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          <div className="text-white/60 text-sm flex items-center gap-4">
            {totalMessages > 0 && (
              <span className="hidden md:inline">{`${totalMessages} messages`}</span>
            )}
            {/* <button
              onClick={onToggleSound}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
};