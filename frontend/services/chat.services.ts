import api from '@/lib/api';
import { MessagesResponse, User } from '@/types/chat.types';
import { AxiosError } from 'axios';

export class ChatService {
  private static instance: ChatService;
  private requestCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
  }

  private async cachedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const cached = this.requestCache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const data = await requestFn();
      this.requestCache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // On error, return cached data if available (stale-while-revalidate)
      if (cached) {
        console.warn('Using cached data due to error:', error);
        return cached.data;
      }
      throw error;
    }
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const key = this.getCacheKey('current-user');
    return this.cachedRequest(key, async () => {
      const response = await api.get('/chat/me/current-user');
      return response.data;
    });
  }

  async getUsers(): Promise<{ users: User[]; currentUserId: string }> {
    const key = this.getCacheKey('users');
    return this.cachedRequest(key, async () => {
      const response = await api.get('/chat/users');
      return response.data;
    });
  }

  async getMessages(userId: string, cursor?: string, limit = 20): Promise<MessagesResponse> {
    const params = cursor ? { cursor, limit } : { limit };
    const key = this.getCacheKey(`messages:${userId}`, params);

    return this.cachedRequest(key, async () => {
      try {
        const response = await api.get(`/chat/${userId}`, { params });
        return response.data;
      } catch (error: unknown) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          // User not found or conversation doesn't exist
          return {
            messages: [],
            currentUserId: '',
            realTime: {
              senderOnline: false,
              receiverOnline: false,
              supportsWebSocket: false
            },
            pagination: {
              hasMore: false,
              totalMessages: 0
            }
          };
        }
        throw error;
      }
    });
  }

  async sendMessage(userId: string, content: string): Promise<any> {
    try {
      const response = await api.post(`/chat/${userId}`, { content });

      // Invalidate cache for this conversation
      const cacheKeys = Array.from(this.requestCache.keys())
        .filter(key => key.startsWith(`messages:${userId}`));
      cacheKeys.forEach(key => this.requestCache.delete(key));

      return response.data;
    } catch (error: unknown) {
      if (error instanceof  AxiosError && error.response?.status === 404) {
        throw new Error('User not found or conversation does not exist');
      }
      throw error;
    }
  }

  async markAsRead(userId: string): Promise<void> {
    try {
      await api.post(`/chat/${userId}/read`);
    } catch (error) {
      console.warn('Failed to mark messages as read:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  clearCache(): void {
    this.requestCache.clear();
  }

  clearConversationCache(userId: string): void {
    const cacheKeys = Array.from(this.requestCache.keys())
      .filter(key => key.startsWith(`messages:${userId}`));
    cacheKeys.forEach(key => this.requestCache.delete(key));
  }
}

export class NotificationService {
  private static instance: NotificationService;
  private audio: HTMLAudioElement | null = null;
  private permission: NotificationPermission = 'default';
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      this.audio = new Audio('/sounds/message-notification.mp3');
      this.audio.volume = 0.3;
      this.audio.addEventListener('error', () => {
        console.warn('Notification sound file not found, continuing without audio');
        this.audio = null;
      });

      if ('Notification' in window) {
        this.permission = Notification.permission;
        if (this.permission === 'default') {
          document.addEventListener('click', this.requestPermission.bind(this), { once: true });
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  private async requestPermission() {
    if (!('Notification' in window) || this.permission !== 'default') return;

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  }

  playSound(soundEnabled: boolean) {
    if (!soundEnabled || !this.audio || this.permission === 'denied') return;

    try {
      this.audio.currentTime = 0;
      this.audio.play().catch((error) => {
        console.warn('Could not play notification sound:', error);
        this.playFallbackSound(soundEnabled);
      });
    } catch (error) {
      this.playFallbackSound(soundEnabled);
    }
  }

  private playFallbackSound(soundEnabled: boolean) {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Silent fail
    }
  }

  showBrowserNotification(title: string, body: string) {
    if (this.permission !== 'granted' || document.hasFocus()) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.warn('Failed to show browser notification:', error);
    }
  }

  cleanup() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instances
// Note: WebSocketService is now centralized in /lib/websocket.service.ts and /contexts/WebSocketContext.tsx
export const chatService = ChatService.getInstance();
export const notificationService = NotificationService.getInstance();