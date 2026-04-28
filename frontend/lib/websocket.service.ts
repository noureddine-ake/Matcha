import {
    ConnectionStatus,
    MessageHandler,
    MessageType,
    OutgoingWebSocketMessage,
    WebSocketMessage,
} from '@/types/websocket.types';

// ==== Configuration ====

const getWebSocketUrl = (): string => {
    if (typeof window === 'undefined') {
        return 'ws://localhost:5000/ws';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NEXT_PUBLIC_WS_PORT || '5000';

    return `${protocol}//${host}:${port}/ws`;
};

const RECONNECT_INITIAL_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const RECONNECT_MAX_ATTEMPTS = 10;
const PING_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 10000;

// ==== Types ====

type StatusChangeCallback = (status: ConnectionStatus) => void;

interface WebSocketServiceConfig {
    url?: string;
    reconnect?: boolean;
    pingInterval?: number;
}

// ==== WebSocket Service Class ====

class WebSocketService {
    private socket: WebSocket | null = null;
    private handlers: Map<MessageType, Set<MessageHandler<WebSocketMessage>>> = new Map();
    private statusListeners: Set<StatusChangeCallback> = new Set();
    private connectionStatus: ConnectionStatus = 'disconnected';

    // Reconnection state
    private reconnectAttempts = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private shouldReconnect = true;

    // Ping/Pong state
    private pingInterval: NodeJS.Timeout | null = null;
    private connectionTimeout: NodeJS.Timeout | null = null;

    // Configuration
    private config: Required<WebSocketServiceConfig> = {
        url: '',
        reconnect: true,
        pingInterval: PING_INTERVAL,
    };

    // ==== Public Methods ====

    /**
     * Connect to WebSocket server
     */
    connect(config?: WebSocketServiceConfig): void {
        // Set default URL if not configured
        if (!this.config.url) {
            this.config.url = getWebSocketUrl();
        }

        if (config) {
            this.config = { ...this.config, ...config };
        }

        if (this.socket?.readyState === WebSocket.OPEN) {
            console.log('[WS] Already connected');
            return;
        }

        if (this.socket?.readyState === WebSocket.CONNECTING) {
            console.log('[WS] Connection in progress');
            return;
        }

        this.shouldReconnect = this.config.reconnect;
        this.createConnection();
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        this.shouldReconnect = false;
        this.cleanup();

        if (this.socket) {
            this.socket.close(1000, 'Client disconnecting');
            this.socket = null;
        }

        this.setStatus('disconnected');
    }

    /**
     * Send a message through WebSocket
     */
    send(message: OutgoingWebSocketMessage): boolean {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('[WS] Cannot send message: not connected');
            return false;
        }

        try {
            const payload = {
                ...message,
                timestamp: message.timestamp || Date.now(),
            };

            this.socket.send(JSON.stringify(payload));
            return true;
        } catch (error) {
            console.error('[WS] Error sending message:', error);
            return false;
        }
    }

    /**
     * Register a handler for a specific message type
     */
    registerHandler<T extends WebSocketMessage>(
        type: MessageType,
        handler: MessageHandler<T>
    ): () => void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }

        this.handlers.get(type)!.add(handler as MessageHandler<WebSocketMessage>);
        console.log(`[WS] Handler registered for: ${type}`);

        // Return unsubscribe function
        return () => {
            this.unregisterHandler(type, handler);
        };
    }

    /**
     * Un a handler for a specific message type
     */
    unregisterHandler<T extends WebSocketMessage>(
        type: MessageType,
        handler: MessageHandler<T>
    ): void {
        const handlers = this.handlers.get(type);
        if (handlers) {
            handlers.delete(handler as MessageHandler<WebSocketMessage>);
            console.log(`[WS] Handler unregistered for: ${type}`);

            if (handlers.size === 0) {
                this.handlers.delete(type);
            }
        }
    }

    /**
     * Subscribe to connection status changes
     */
    onStatusChange(callback: StatusChangeCallback): () => void {
        this.statusListeners.add(callback);

        // Immediately call with current status
        callback(this.connectionStatus);

        // Return unsubscribe function
        return () => {
            this.statusListeners.delete(callback);
        };
    }

    /**
     * Get current connection status
     */
    getStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connectionStatus === 'connected' &&
            this.socket?.readyState === WebSocket.OPEN;
    }

    // ==== Private Methods ====

    private createConnection(): void {
        this.setStatus('connecting');

        try {
            this.socket = new WebSocket(this.config.url);
            this.setupEventListeners();
            this.startConnectionTimeout();
        } catch (error) {
            console.error('[WS] Error creating connection:', error);
            this.handleConnectionFailure();
        }
    }

    private setupEventListeners(): void {
        if (!this.socket) return;

        this.socket.onopen = this.handleOpen.bind(this);
        this.socket.onclose = this.handleClose.bind(this);
        this.socket.onerror = this.handleError.bind(this);
        this.socket.onmessage = this.handleMessage.bind(this);
    }

    private handleOpen(): void {
        console.log('[WS] ✅ Connected');
        this.clearConnectionTimeout();
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.startPingInterval();
    }

    private handleClose(event: CloseEvent): void {
        console.log(`[WS] ❌ Disconnected: code=${event.code}, reason=${event.reason}`);
        this.cleanup();

        if (this.shouldReconnect && event.code !== 1000) {
            this.scheduleReconnect();
        } else {
            this.setStatus('disconnected');
        }
    }

    private handleError(event: Event): void {
        console.error('[WS] ⚠️ Error:', event);
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message = JSON.parse(event.data);

            // Handle pong internally
            if (message.type === 'pong') {
                return;
            }

            // Route to registered handlers
            this.routeMessage(message);
        } catch (error) {
            console.error('[WS] Error parsing message:', error);
        }
    }

    private routeMessage(message: WebSocketMessage): void {
        const handlers = this.handlers.get(message.type as MessageType);

        if (handlers && handlers.size > 0) {
            handlers.forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error(`[WS] Error in handler for ${message.type}:`, error);
                }
            });
        } else {
            console.log(`[WS] No handler for message type: ${message.type}`);
        }
    }

    private setStatus(status: ConnectionStatus): void {
        if (this.connectionStatus !== status) {
            this.connectionStatus = status;
            this.statusListeners.forEach(listener => {
                try {
                    listener(status);
                } catch (error) {
                    console.error('[WS] Error in status listener:', error);
                }
            });
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
            console.log('[WS] Max reconnection attempts reached');
            this.setStatus('disconnected');
            return;
        }

        this.setStatus('reconnecting');

        const delay = Math.min(
            RECONNECT_INITIAL_DELAY * Math.pow(2, this.reconnectAttempts),
            RECONNECT_MAX_DELAY
        );

        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.createConnection();
        }, delay);
    }

    private handleConnectionFailure(): void {
        this.cleanup();

        if (this.shouldReconnect) {
            this.scheduleReconnect();
        } else {
            this.setStatus('disconnected');
        }
    }

    private startPingInterval(): void {
        this.stopPingInterval();

        this.pingInterval = setInterval(() => {
            if (this.isConnected()) {
                this.send({ type: 'ping' });
            }
        }, this.config.pingInterval);
    }

    private stopPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private startConnectionTimeout(): void {
        this.clearConnectionTimeout();

        this.connectionTimeout = setTimeout(() => {
            if (this.socket?.readyState === WebSocket.CONNECTING) {
                console.log('[WS] Connection timeout');
                this.socket.close();
                this.handleConnectionFailure();
            }
        }, CONNECTION_TIMEOUT);
    }

    private clearConnectionTimeout(): void {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
    }

    private cleanup(): void {
        this.stopPingInterval();
        this.clearConnectionTimeout();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}

// ==== Singleton Export ====

export const webSocketService = new WebSocketService();

// ==== Convenience Exports ====

export const connectWebSocket = (config?: WebSocketServiceConfig) =>
    webSocketService.connect(config);

export const disconnectWebSocket = () =>
    webSocketService.disconnect();

export const sendWebSocketMessage = (message: OutgoingWebSocketMessage) =>
    webSocketService.send(message);

export const registerWebSocketHandler = <T extends WebSocketMessage>(
    type: MessageType,
    handler: MessageHandler<T>
) => webSocketService.registerHandler(type, handler);

export const getWebSocketStatus = () =>
    webSocketService.getStatus();

export const isWebSocketConnected = () =>
    webSocketService.isConnected();
