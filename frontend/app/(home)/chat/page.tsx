"use client"

import { Loader2 } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { ChatLayout } from '@/components/chat.components';
import { ChatHeader, ChatEmptyState, ChatMessages, ChatSidebar, ChatInput } from '@/components/chat/exports';

export default function ChatPage() {
  const {
    state,
    selectUser,
    sendMessage,
    loadMoreMessages,
    handleTyping,
    toggleSound,
    toggleSidebar,
    setSearchTerm,
    setNewMessage,
    refs,
  } = useChat();

  const { isConnected } = useWebSocket();

  const selectedUser = state.users.find(user => user.id === state.selectedUserId);

  if (state.loading) {
    return (
      <div className="h-ahto flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <div className="text-white text-xl">Loading chat...</div>
        </div>
      </div>
    );
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ChatLayout
      sidebar={
        <ChatSidebar
          currentUserId={state.currentUserId}
          users={state.users}
          selectedUserId={state.selectedUserId}
          searchTerm={state.searchTerm}
          soundEnabled={state.soundEnabled}
          isMobile={state.isMobile}
          onSelectUser={selectUser}
          onToggleSound={toggleSound}
          onCloseSidebar={toggleSidebar}
          onSearchChange={setSearchTerm}
        />
      }
      content={
        selectedUser ? (
          <>
            <ChatHeader
              user={selectedUser || null}
              isConnected={isConnected}
              totalMessages={state.totalMessages}
              typingUsers={state.typingUsers}
              isMobile={state.isMobile}
              soundEnabled={state.soundEnabled}
              onToggleSound={toggleSound}
              onToggleSidebar={toggleSidebar}
            />
            <ChatMessages
              messages={state.messages}
              currentUserId={state.currentUserId}
              loadingMore={state.loadingMore}
              hasMoreMessages={state.hasMoreMessages}
              onLoadMore={loadMoreMessages}
              loadMoreTriggerRef={refs.loadMoreTriggerRef}
              messagesEndRef={refs.messagesEndRef}
            />
            <ChatInput
              value={state.newMessage}
              onChange={setNewMessage}
              onSend={sendMessage}
              onTyping={handleTyping}
              onKeyDown={handleKeyDown}
              disabled={!selectedUser || state.sending}
              sending={state.sending}
              textareaRef={refs.textareaRef}
            />
          </>
        ) : (
          <ChatEmptyState
            isMobile={state.isMobile}
            sidebarOpen={state.sidebarOpen}
            currentUserId={state.currentUserId}
            onOpenSidebar={toggleSidebar}
          />
        )
      }
      isMobile={state.isMobile}
      sidebarOpen={state.sidebarOpen}
      onToggleSidebar={toggleSidebar}
    />
  );
}
