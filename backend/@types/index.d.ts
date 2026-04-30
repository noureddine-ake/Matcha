import { Request } from 'express';

// ============ Express Request Extensions ============

export interface AuthRequest extends Request {
  user?: {
    data: {
      id: number;
      email: string;
      username: string;
      first_name?: string;
      last_name?: string;
    };
  };
  cookies?: {
    refreshToken?: string;
  };
}

export interface ErrorRequest extends Request {
  error?: unknown;
}

// ============ WebSocket Types ============

export interface WebSocketMessage {
  type: string;
  payload: unknown;
}

export interface OnlineUser {
  userId: number;
  status: 'online' | 'offline';
}

// ============ Database/Chat Types ============

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: Date;
  is_read: boolean;
}

export interface UserProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  biography?: string;
  birth_date?: Date;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_online?: boolean;
  last_seen?: Date;
  fame_rating?: number;
  sexual_preference?: string;
  completed_profile?: boolean;
}

export interface Photo {
  id: number;
  user_id: number;
  photo_url: string;
  is_profile_picture: boolean;
  created_at: Date;
}

export interface Like {
  id: number;
  liker_id: number;
  liked_id: number;
  created_at: Date;
}

export interface Block {
  id: number;
  blocker_id: number;
  blocked_id: number;
  created_at: Date;
}

export interface UserTag {
  id: number;
  user_id: number;
  tag_id: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  from_user_id?: number;
  is_read: boolean;
  created_at: Date;
}

// ============ API Response Types ============

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  error?: string | { message: string; details?: unknown };
  message?: string;
}

export interface PaginatedResponse<T> {
  rows: T[];
  total: number;
  hasMore: boolean;
}

// ============ Helper Types ============

export type WebSocketHandler = (ws: WebSocket, data: unknown) => Promise<void>;
export type MessageHandler = (messageType: string, handler: WebSocketHandler) => void;
export type NotificationSender = (userId: number, notification: Notification) => Promise<void>;
