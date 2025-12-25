import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatState, Message, User, ConversationCache } from '@/types/chat.types';
import { chatService, notificationService, webSocketService } from '@/services/chat.services';

export const useChatState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [state, setState] = useState<ChatState>({
    users: [],
    currentUserId: '',
    selectedUserId: null,
    messages: [],
    loading: true,
    loadingMore: false,
    hasMoreMessages: false,
    nextCursor: null,
    totalMessages: 0,
    newMessage: '',
    sending: false,
    searchTerm: '',
    typingUsers: new Set(),
    soundEnabled: true,
    notificationPermission: 'default',
    sidebarOpen: false,
    isMobile: false,
    error: null,
    connectionStatus: 'disconnected',
  });
  
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // State references for WebSocket callbacks
  const currentStateRef = useRef<{
    currentUserId: string;
    selectedUserId: string | null;
    messages: Message[];
    users: User[];
    soundEnabled: boolean;
  }>({
    currentUserId: '',
    selectedUserId: null,
    messages: [],
    users: [],
    soundEnabled: true,
  });
  
  // Conversation cache for instant switching
  const conversationCache = useRef<ConversationCache>({});
  const initializationRef = useRef({ initialized: false });
  const messageQueueRef = useRef<Message[]>([]);
  const processingQueueRef = useRef(false);
  
  // Update state ref when state changes
  useEffect(() => {
    currentStateRef.current = {
      currentUserId: state.currentUserId,
      selectedUserId: state.selectedUserId,
      messages: state.messages,
      users: state.users,
      soundEnabled: state.soundEnabled,
    };
  }, [
    state.currentUserId,
    state.selectedUserId,
    state.messages,
    state.users,
    state.soundEnabled,
  ]);
  
  // Initialize services
  useEffect(() => {
    notificationService.initialize();
    
    if ('Notification' in window) {
      setState(prev => ({
        ...prev,
        notificationPermission: Notification.permission,
      }));
    }
    
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768;
      setState(prev => ({ 
        ...prev, 
        isMobile,
        sidebarOpen: isMobile ? false : prev.sidebarOpen,
      }));
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Initialize from URL
  useEffect(() => {
    const initializeFromURL = async () => {
      const urlUser = searchParams.get('user');
      if (urlUser) {
        try {
          const usersResponse = await chatService.getUsers();
          const userExists = usersResponse.users.some((user: User) => user.id === urlUser);
          
          if (userExists) {
            await selectUser(urlUser);
          } else {
            // Invalid user, remove from URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('user');
            router.replace(`?${params.toString()}`, { scroll: false });
            setState(prev => ({ ...prev, error: 'Selected user not found' }));
          }
        } catch (error) {
          console.error('Failed to validate user from URL:', error);
          setState(prev => ({ ...prev, error: 'Failed to load user data' }));
        }
      }
    };
    
    initializeFromURL();
  }, [searchParams]);
  
  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await chatService.getCurrentUser();
      const user = response.user;
      setState(prev => ({ 
        ...prev, 
        currentUserId: user.id.toString(),
        error: null,
      }));
      
      return user.id.toString();
    } catch (error) {
      console.error('Failed to get current user:', error);
      
      // Fallback to users endpoint
      try {
        const usersResponse = await chatService.getUsers();
        if (usersResponse.currentUserId) {
          setState(prev => ({ 
            ...prev, 
            currentUserId: usersResponse.currentUserId.toString(),
            error: null,
          }));
          return usersResponse.currentUserId.toString();
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to authenticate. Please refresh the page.',
        }));
      }
      
      throw error;
    }
  }, []);
  
  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await chatService.getUsers();
      setState(prev => ({ ...prev, users: response.users, error: null }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load users. Please try again.',
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);
  
  // Process message queue to prevent duplicates
  const processMessageQueue = useCallback(() => {
    if (processingQueueRef.current || messageQueueRef.current.length === 0) return;
    
    processingQueueRef.current = true;
    const messagesToProcess = [...messageQueueRef.current];
    messageQueueRef.current = [];
    
    setState(prev => {
      const existingIds = new Set(prev.messages.map(m => m.databaseId || m.id));
      const newMessages: Message[] = [];
      
      for (const message of messagesToProcess) {
        // Strong duplicate detection
        const isDuplicate = existingIds.has(message.databaseId || message.id) ||
          prev.messages.some(m => 
            m.content === message.content && 
            m.senderId === message.senderId &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000
          );
        
        if (!isDuplicate) {
          newMessages.push(message);
          existingIds.add(message.databaseId || message.id);
        }
      }
      
      if (newMessages.length === 0) {
        processingQueueRef.current = false;
        return prev;
      }
      
      processingQueueRef.current = false;
      return {
        ...prev,
        messages: [...prev.messages, ...newMessages],
      };
    });
  }, []);
  
  // Fetch messages for a user
  const fetchMessages = useCallback(async (userId: string, cursor: string | null = null, isLoadMore = false) => {
    if (!userId || !state.currentUserId) return;
    
    try {
      if (isLoadMore) {
        setState(prev => ({ ...prev, loadingMore: true, error: null }));
      } else {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }
      
      const data = await chatService.getMessages(userId, cursor, 20);
      
      const normalized = (data.messages || []).map(m => ({
        ...m,
        id: String(m.id),
        senderId: String(m.senderId),
        receiverId: String(m.receiverId),
      }));
      
      normalized.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setState(prev => {
        const newMessages = isLoadMore ? [...normalized, ...prev.messages] : normalized;
        
        // Cache the conversation
        conversationCache.current[userId] = {
          messages: newMessages,
          timestamp: Date.now(),
          totalMessages: data.pagination?.totalMessages || 0,
        };
        
        return {
          ...prev,
          messages: newMessages,
          loading: false,
          loadingMore: false,
          hasMoreMessages: data.pagination?.hasMore || false,
          nextCursor: data.pagination?.nextCursor || null,
          totalMessages: data.pagination?.totalMessages || 0,
          error: null,
        };
      });
      
      // Mark as read if we have messages
      if (!isLoadMore && normalized.length > 0) {
        await chatService.markAsRead(userId);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: error.message || 'Failed to load messages',
      }));
    }
  }, [state.currentUserId]);
  
  // Select user with instant cache support
  const selectUser = useCallback(async (userId: string) => {
    if (userId === state.selectedUserId) return;
    
    // Update state immediately with cached messages if available
    const cached = conversationCache.current[userId];
    const cachedMessages = cached?.messages || [];
    
    setState(prev => ({ 
      ...prev, 
      selectedUserId: userId,
      messages: cachedMessages, // Show cached messages instantly
      loading: true, // Still show loading for fresh data
      hasMoreMessages: false,
      nextCursor: null,
      totalMessages: cached?.totalMessages || 0,
      newMessage: '', // Clear input when switching users
      error: null,
    }));
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('user', userId);
    router.replace(`?${params.toString()}`, { scroll: false });
    
    // Close sidebar on mobile
    if (state.isMobile) {
      setState(prev => ({ ...prev, sidebarOpen: false }));
    }
    
    // Fetch fresh messages
    await fetchMessages(userId);
  }, [state.selectedUserId, state.isMobile, router, searchParams, fetchMessages]);
  
  // Send message
  const sendMessage = useCallback(async () => {
    const messageContent = state.newMessage.trim();
    if (!messageContent || !state.selectedUserId || state.sending || !state.currentUserId) {
      return;
    }
    
    const tempId = `temp_${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderId: state.currentUserId,
      receiverId: state.selectedUserId,
      content: messageContent,
      timestamp: new Date().toISOString(),
      read: false,
      isSending: true,
    };
    
    // Add temp message immediately
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, tempMessage],
      newMessage: '',
      sending: true,
      error: null,
    }));
    
    // Send typing stop
    if (webSocketService.isConnected() && state.selectedUserId) {
      webSocketService.send({
        type: 'typing_stop',
        receiverId: state.selectedUserId,
      });
    }
    
    // Reset textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    
    try {
      await chatService.sendMessage(state.selectedUserId, messageContent);
      
      // Update temp message to remove sending state
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === tempId ? { ...msg, isSending: false } : msg
        ),
        sending: false,
      }));
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Mark message as failed
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === tempId ? { ...msg, isSending: false, isFailed: true } : msg
        ),
        sending: false,
        error: error.message || 'Failed to send message',
      }));
      
      // Restore the unsent message to input
      setTimeout(() => {
        setState(prev => ({ ...prev, newMessage: messageContent }));
      }, 100);
    }
  }, [state.newMessage, state.selectedUserId, state.sending, state.currentUserId]);
  
  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (state.nextCursor && !state.loadingMore && state.hasMoreMessages && state.selectedUserId) {
      await fetchMessages(state.selectedUserId, state.nextCursor, true);
    }
  }, [state.nextCursor, state.loadingMore, state.hasMoreMessages, state.selectedUserId, fetchMessages]);
  
  // Typing handler
  const handleTyping = useCallback((isTyping: boolean) => {
    if (!webSocketService.isConnected() || !state.selectedUserId) return;
    
    webSocketService.send({
      type: isTyping ? 'typing_start' : 'typing_stop',
      receiverId: state.selectedUserId,
      timestamp: Date.now(),
    });
    
    setState(prev => {
      const newTypingUsers = new Set(prev.typingUsers);
      if (isTyping && state.selectedUserId) {
        newTypingUsers.add(state.selectedUserId);
      } else if (state.selectedUserId) {
        newTypingUsers.delete(state.selectedUserId);
      }
      return { ...prev, typingUsers: newTypingUsers };
    });
  }, [state.selectedUserId]);
  
  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'chat_message') {
      const messageData = data.data?.data || data.data || data;
      
      if (!messageData.senderId || !messageData.content) return;
      
      const { currentUserId, selectedUserId } = currentStateRef.current;
      const senderId = messageData.senderId.toString();
      
      // Check if message is relevant to current conversation
      const isRelevant = selectedUserId && 
        (Number(senderId) === Number(selectedUserId) || 
         Number(messageData.receiverId) === Number(selectedUserId));
      
      if (isRelevant) {
        const newMessage: Message = {
          id: messageData.messageId || `msg_${Date.now()}`,
          senderId: senderId,
          receiverId: (messageData.receiverId || '').toString(),
          content: messageData.content,
          timestamp: messageData.timestamp || new Date().toISOString(),
          read: messageData.read || false,
          databaseId: messageData.databaseId,
        };
        
        // Add to queue for processing
        messageQueueRef.current.push(newMessage);
        processMessageQueue();
        
        // Play sound and show notification if from other user
        if (senderId !== currentUserId) {
          const { soundEnabled, users } = currentStateRef.current;
          notificationService.playSound(soundEnabled);
          
          const sender = users.find(u => u.id === senderId);
          notificationService.showBrowserNotification(
            'New Message',
            `${sender?.username || 'Someone'}: ${messageData.content}`
          );
        }
      }
    } else if (data.type === 'typing_start') {
      const { senderId } = data;
      if (senderId && senderId !== currentStateRef.current.currentUserId) {
        setState(prev => {
          const newTypingUsers = new Set(prev.typingUsers);
          newTypingUsers.add(senderId);
          return { ...prev, typingUsers: newTypingUsers };
        });
      }
    } else if (data.type === 'typing_stop') {
      const { senderId } = data;
      if (senderId) {
        setState(prev => {
          const newTypingUsers = new Set(prev.typingUsers);
          newTypingUsers.delete(senderId);
          return { ...prev, typingUsers: newTypingUsers };
        });
      }
    }
  }, [processMessageQueue]);
  
  // Initialize app with proper cleanup
  useEffect(() => {
    if (initializationRef.current.initialized) return;
    
    let mounted = true;
    initializationRef.current.initialized = true;
    
    const initializeApp = async () => {
      try {
        await fetchCurrentUser();
        await fetchUsers();
        
        // Connect WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = process.env.NEXT_PUBLIC_WS_PORT || '5000';
        const wsUrl = `${protocol}//${host}:${port}/ws`;
        
        webSocketService.connect(
          wsUrl,
          handleWebSocketMessage,
          () => {
            if (mounted) {
              setState(prev => ({ ...prev, connectionStatus: 'connected' }));
            }
          },
          () => {
            if (mounted) {
              setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
            }
          }
        );
        
        setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to initialize. Please refresh the page.',
            loading: false,
          }));
        }
      }
    };
    
    initializeApp();
    
    return () => {
      mounted = false;
      initializationRef.current.initialized = false;
      webSocketService.disconnect();
      notificationService.cleanup();
      chatService.clearCache();
    };
  }, [fetchCurrentUser, fetchUsers, handleWebSocketMessage]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [state.newMessage]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (state.messages.length > 0 && !state.loadingMore && !state.loading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [state.messages.length, state.loadingMore, state.loading]);
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !state.hasMoreMessages) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !state.loadingMore && state.hasMoreMessages) {
          loadMoreMessages();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );
    
    observerRef.current.observe(loadMoreTriggerRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [state.hasMoreMessages, state.loadingMore, loadMoreMessages]);
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);
  
  // Retry failed message
  const retryFailedMessage = useCallback((messageId: string) => {
    const failedMessage = state.messages.find(msg => msg.id === messageId && msg.isFailed);
    if (failedMessage && state.selectedUserId) {
      setState(prev => ({
        ...prev,
        newMessage: failedMessage.content,
        messages: prev.messages.filter(msg => msg.id !== messageId),
      }));
      
      // Focus textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [state.messages, state.selectedUserId]);
  
  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  return {
    state,
    setState,
    actions: {
      selectUser,
      sendMessage,
      loadMoreMessages,
      handleTyping,
      handleKeyDown,
      retryFailedMessage,
      clearError,
      toggleSound: () => setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled })),
      toggleSidebar: () => setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen })),
      setSearchTerm: (term: string) => setState(prev => ({ ...prev, searchTerm: term })),
    },
    refs: {
      messagesContainerRef,
      messagesEndRef,
      textareaRef,
      loadMoreTriggerRef,
    },
  };
};