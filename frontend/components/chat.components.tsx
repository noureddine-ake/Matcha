import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Clock, CheckCheck, Volume2, VolumeX, 
  Menu, X, Send, Loader2 
} from 'lucide-react';
import { User, Message } from '@/types/chat.types';

// ==================== User Components ====================

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

interface UserItemProps {
  user: User;
  isSelected: boolean;
  onSelect: () => void;
}

export const UserItem: React.FC<UserItemProps> = memo(({ user, isSelected, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-4 border-b border-white/10 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-purple-500/20 border-purple-400' 
          : 'hover:bg-white/5'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
            {user.profile_photo ? (
              <img 
                src={user.profile_photo} 
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
            user.is_online ? 'bg-green-400' : 'bg-gray-400'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold truncate">{user.username}</h3>
            {!user.is_online && (
              <span className="text-xs text-white/60 flex items-center">
                <Clock className="w-3 h-3 inline mr-1" />
                Offline
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm truncate">{user.email}</p>
        </div>
      </div>
    </motion.div>
  );
});

UserItem.displayName = 'UserItem';

interface UserListProps {
  users: User[];
  selectedUserId: string | null;
  searchTerm: string;
  onSelectUser: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, selectedUserId, searchTerm, onSelectUser }) => {
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredUsers.length === 0) {
    return (
      <div className="p-8 text-center text-white/60">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No users found</p>
      </div>
    );
  }

  return (
    <>
      {filteredUsers.map((user) => (
        <UserItem
          key={user.id}
          user={user}
          isSelected={selectedUserId === user.id}
          onSelect={() => onSelectUser(user.id)}
        />
      ))}
    </>
  );
};

// ==================== Message Components ====================

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message, currentUserId }) => {
  const isSender = message.senderId === currentUserId;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`max-w-[min(85%, 500px)] px-4 py-2 rounded-2xl relative ${
          isSender
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
            : 'bg-white/10 text-white backdrop-blur-lg shadow-lg'
        } ${message.isSending ? 'opacity-70' : ''}`}
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
        }}
      >
        {/* Message bubble tail */}
        {isSender ? (
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rotate-45 rounded-sm"></div>
        ) : (
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white/10 backdrop-blur-lg rotate-45 rounded-sm"></div>
        )}
        
        {/* Message content */}
        <div className="relative z-10">
          <p className="text-sm whitespace-pre-wrap break-words min-w-0">
            {message.content}
          </p>
          
          {/* Timestamp and status */}
          <div className={`flex items-center justify-end gap-1 mt-1 ${
            isSender ? 'text-white/80' : 'text-white/60'
          }`}>
            <span className="text-xs whitespace-nowrap">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
              {message.isSending && ' (sending...)'}
            </span>
            {isSender && !message.isSending && (
              <CheckCheck 
                className={`w-3 h-3 flex-shrink-0 ${message.read ? 'text-blue-300' : 'text-white/60'}`} 
              />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  loadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMore: () => void;
  loadMoreTriggerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  currentUserId,
  loadingMore,
  hasMoreMessages,
  onLoadMore,
  loadMoreTriggerRef,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
      {/* Load More Trigger */}
      {hasMoreMessages && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading older messages...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
          />
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};

// ==================== Input Components ====================

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: (isTyping: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  sending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onTyping,
  onKeyDown,
  disabled,
  sending,
  textareaRef,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto p-4 border-t border-white/20 bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-800/95 backdrop-blur-lg z-30">
      <div className="container mx-auto max-w-7xl">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              onTyping(true);
            }}
            onKeyDown={onKeyDown}
            onBlur={() => onTyping(false)}
            rows={1}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none min-h-[44px] max-h-[120px] backdrop-blur-sm"
            disabled={disabled || sending}
          />
          
          <motion.button
            onClick={onSend}
            disabled={!value.trim() || disabled || sending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg min-h-[44px]"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <div className="text-xs text-white/40 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

// ==================== Header Components ====================

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
  isConnected,
  totalMessages,
  typingUsers,
  isMobile,
  soundEnabled,
  onToggleSound,
  onToggleSidebar,
}) => {
  console.log(`test => `, user);
  
  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-b border-white/20 z-40 p-4">
        <div className="flex items-center justify-between">
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
                  <img 
                    src={user.profile_photo} 
                    alt={user.username}
                    className="w-full h-full object-cover"
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
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.is_online 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {user.is_online ? 'Online' : 'Offline'}
                  </span>
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
          
          <button
            onClick={onToggleSound}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-30 p-4 md:p-6 border-b border-white/20 bg-white/5 backdrop-blur-lg">
      {user && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
              {user.profile_photo ? (
                <img 
                  src={user.profile_photo} 
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-semibold truncate">{user.username}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.is_online 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  {user.is_online ? 'Online' : 'Offline'}
                </span>
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
            <button
              onClick={onToggleSound}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Sidebar Component ====================

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
  soundEnabled,
  isMobile,
  onSelectUser,
  onToggleSound,
  onCloseSidebar,
  onSearchChange,
}) => {
  return (
    <>
      {/* Sidebar Header */}
      <div className="p-4 md:p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-white">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={soundEnabled ? "Mute notifications" : "Enable notifications"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
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
      <div className="flex-1 overflow-y-auto">
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

// ==================== Empty State Component ====================

interface ChatEmptyStateProps {
  isMobile: boolean;
  sidebarOpen: boolean;
  currentUserId: string;
  onOpenSidebar: () => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  isMobile,
  sidebarOpen,
  currentUserId,
  onOpenSidebar,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-white p-6">
      <Users className="w-20 h-20 md:w-24 md:h-24 mb-6 opacity-50" />
      <h3 className="text-xl md:text-2xl font-bold mb-2 text-center">Select a conversation</h3>
      <p className="text-white/60 text-center mb-6 px-4">
        {isMobile ? 'Tap the menu icon to browse users' : 'Choose a user from the sidebar to start chatting'}
      </p>
      {isMobile && !sidebarOpen && (
        <motion.button
          onClick={onOpenSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg flex items-center gap-2"
        >
          <Menu className="w-5 h-5" />
          Browse Users
        </motion.button>
      )}
      <div className="mt-4 text-sm text-white/40 text-center px-4">
        Current User ID: {currentUserId || "Loading..."}
      </div>
    </div>
  );
};

// ==================== Layout Component ====================

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  content: React.ReactNode;
  isMobile: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  sidebar,
  header,
  content,
  isMobile,
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="flex h-screen relative z-10">
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onToggleSidebar}
          />
        )}

        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{ 
            x: isMobile && !sidebarOpen ? '-100%' : 0 
          }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={`w-80 bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col fixed md:relative z-40 h-full ${
            isMobile ? 'shadow-2xl' : ''
          }`}
          style={{ 
            height: isMobile ? '100vh' : '100%',
            top: isMobile ? 0 : 'auto'
          }}
        >
          {sidebar}
        </motion.div>

        {/* Main content */}
        <div className={`flex-1 flex flex-col bg-white/5 backdrop-blur-lg relative w-full ${
          isMobile ? 'pt-16 pb-20' : ''
        }`}>
          {header}
          {content}
        </div>
      </div>
    </div>
  );
};