import api from '@/lib/api';
import { Message, MessagesResponse, User } from '@/types/chat.types';

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
      } catch (error: any) {
        if (error.response?.status === 404) {
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
    } catch (error: any) {
      if (error.response?.status === 404) {
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
      
      if ('Notification' in window) {
        this.permission = Notification.permission;
        if (this.permission === 'default') {
          // Request permission on user interaction
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

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionId: string | null = null;
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  
  connect(url: string, onMessage?: (data: any) => void, onOpen?: () => void, onClose?: () => void) {
    // Prevent duplicate connections
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    // Clean up existing connection
    this.disconnect();
    
    this.isConnecting = true;
    this.reconnectAttempts = 0;
    
    if (onMessage) {
      this.addMessageHandler('chat_message', onMessage);
    }
    
    try {
      this.ws = new WebSocket(url);
      this.connectionId = `conn_${Date.now()}`;
      
      this.ws.onopen = () => {
        console.log(`✅ WebSocket connected (${this.connectionId})`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Start heartbeat
        this.startHeartbeat();
        
        onOpen?.();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const handlers = this.messageHandlers.get(data.type);
          
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(data);
              } catch (handlerError) {
                console.error('Error in WebSocket handler:', handlerError);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected (${this.connectionId})`, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        this.isConnecting = false;
        this.stopHeartbeat();
        
        onClose?.();
        
        // Attempt reconnection if not closed intentionally
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          this.reconnectAttempts++;
          
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          this.reconnectTimeout = setTimeout(() => {
            this.connect(url, onMessage, onOpen, onClose);
          }, delay);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }
  
  private addMessageHandler(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }
  
  removeMessageHandler(type: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, this.HEARTBEAT_INTERVAL);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }
  
  disconnect() {
    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Clear all handlers
    this.messageHandlers.clear();
    
    // Close connection
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.connectionId = null;
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  getConnectionState(): 'disconnected' | 'connecting' | 'connected' {
    if (!this.ws) return 'disconnected';
    if (this.isConnecting) return 'connecting';
    return this.ws.readyState === WebSocket.OPEN ? 'connected' : 'disconnected';
  }
}

// Export singleton instances
export const chatService = ChatService.getInstance();
export const notificationService = NotificationService.getInstance();
export const webSocketService = WebSocketService.getInstance();