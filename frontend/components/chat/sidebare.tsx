
import React from 'react';
import {
  Search, X
} from 'lucide-react';
import { User } from '@/types/chat.types';
import { UserList } from './user-list';



interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
      />
    </div>
  );
};

interface ChatSidebarProps {
  currentUserId: string;
  users: User[];
  selectedUserId: string | null;
  searchTerm: string;
  soundEnabled: boolean;
  isMobile: boolean;
  onSelectUser: (userId: string) => void;
  onToggleSound: () => void;
  onCloseSidebar?: () => void;
  onSearchChange: (term: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentUserId,
  users,
  selectedUserId,
  searchTerm,
  isMobile,
  onSelectUser,
  onCloseSidebar,
  onSearchChange,
}) => {
  return (
    <>
      {/* Sidebar Header */}
      <div className="p-4 md:p-6 border-b border-white/20 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-white">Messages</h1>
          <div className="flex items-center gap-2">
            {/* <button
              onClick={onToggleSound}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={soundEnabled ? "Mute notifications" : "Enable notifications"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
            </button> */}
            {isMobile && onCloseSidebar && (
              <button
                onClick={onCloseSidebar}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-white/60 mb-2 truncate">
          User ID: {currentUserId || "Loading..."}
        </div>

        <UserSearch
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <UserList
          users={users}
          selectedUserId={selectedUserId}
          searchTerm={searchTerm}
          onSelectUser={onSelectUser}
        />
      </div>
    </>
  );
};
