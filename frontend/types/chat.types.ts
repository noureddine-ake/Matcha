export interface User {
  id: string;
  username: string;
  email: string;
  profile_photo?: string;
  is_online: boolean;
  last_seen?: string;
  first_name?: string;
  last_name?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  databaseId?: string;
  isSending?: boolean;
  isFailed?: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  currentUserId: string;
  realTime: {
    senderOnline: boolean;
    receiverOnline: boolean;
    supportsWebSocket: boolean;
  };
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
    totalMessages: number;
  };
}

export type WebSocketEvent = 
  | 'chat_message'
  | 'typing_start'
  | 'typing_stop'
  | 'user_online'
  | 'user_offline'
  | 'message_read'
  | 'message_delivered';

export interface WebSocketMessage {
  type: WebSocketEvent;
  data: any;
  timestamp: string;
  senderId?: string;
  receiverId?: string;
}

export interface ConversationMeta {
  unreadCount: number;
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  } | null;
}

export interface ChatState {
  users: User[];
  currentUserId: string;
  selectedUserId: string | null;
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreMessages: boolean;
  nextCursor: string | null;
  totalMessages: number;
  newMessage: string;
  sending: boolean;
  searchTerm: string;
  typingUsers: Set<string>;
  soundEnabled: boolean;
  notificationPermission: NotificationPermission;
  sidebarOpen: boolean;
  isMobile: boolean;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  conversationMeta: Record<string, ConversationMeta>; // { [userId]: { unreadCount, lastMessage } }
  totalUnread: number;
}

export interface ConversationCache {
  [userId: string]: {
    messages: Message[];
    timestamp: number;
    totalMessages: number;
  };
}