"use client"

import { Loader2 } from 'lucide-react';
import { useChatState } from '@/hooks/useChat.hooks';
import { webSocketService } from '@/services/chat.services';
import { ChatLayout } from '@/components/chat.components';
import { ChatHeader, ChatEmptyState, ChatMessages, ChatSidebar, ChatInput } from '@/components/chat/exports';

export default function ChatPage() {
  const {
    state,
    setState,
    actions,
    refs,
  } = useChatState();

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
          onSelectUser={actions.selectUser}
          onToggleSound={() => setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
          onCloseSidebar={() => setState(prev => ({ ...prev, sidebarOpen: false }))}
          onSearchChange={(term) => setState(prev => ({ ...prev, searchTerm: term }))}
        />
      }
      content={
        selectedUser ? (
          <>
            <ChatHeader
              user={selectedUser || null}
              isConnected={webSocketService.isConnected()}
              totalMessages={state.totalMessages}
              typingUsers={state.typingUsers}
              isMobile={state.isMobile}
              soundEnabled={state.soundEnabled}
              onToggleSound={() => setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              onToggleSidebar={() => setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))}
            />
            <ChatMessages
              messages={state.messages}
              currentUserId={state.currentUserId}
              loadingMore={state.loadingMore}
              hasMoreMessages={state.hasMoreMessages}
              onLoadMore={actions.loadMoreMessages}
              loadMoreTriggerRef={refs.loadMoreTriggerRef}
              messagesEndRef={refs.messagesEndRef}
            />
            <ChatInput
              value={state.newMessage}
              onChange={(value) => setState(prev => ({ ...prev, newMessage: value }))}
              onSend={actions.sendMessage}
              onTyping={actions.handleTyping}
              onKeyDown={actions.handleKeyDown}
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
            onOpenSidebar={() => setState(prev => ({ ...prev, sidebarOpen: true }))}
          />
        )
      }
      isMobile={state.isMobile}
      sidebarOpen={state.sidebarOpen}
      onToggleSidebar={() => setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))}
    />
  );
}
