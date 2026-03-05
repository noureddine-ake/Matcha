// ==== Connection Types ====

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// ==== Base Message Types ====

export interface BaseWebSocketMessage {
    timestamp?: number;
}

// ==== Chat Message Types ====

export interface ChatMessage extends BaseWebSocketMessage {
    type: 'chat_message';
    id?: string;
    senderId: string;
    receiverId: string;
    content: string;
    read?: boolean;
}

export interface TypingStartMessage extends BaseWebSocketMessage {
    type: 'typing_start';
    senderId: string;
    receiverId: string;
}

export interface TypingStopMessage extends BaseWebSocketMessage {
    type: 'typing_stop';
    senderId: string;
    receiverId: string;
}

export interface MessageReadMessage extends BaseWebSocketMessage {
    type: 'message_read';
    messageId: string;
    readerId: string;
    senderId: string;
}

// ==== Notification Message Types ====

export interface LikeNotification extends BaseWebSocketMessage {
    type: 'like';
    from_user_id: number;
    from_username: string;
    message?: string;
}

export interface MatchNotification extends BaseWebSocketMessage {
    type: 'match';
    from_user_id: number;
    from_username: string;
    message?: string;
}

export interface UnlikeNotification extends BaseWebSocketMessage {
    type: 'unlike';
    from_user_id: number;
    from_username: string;
    message?: string;
}

export interface ViewNotification extends BaseWebSocketMessage {
    type: 'view';
    from_user_id: number;
    from_username: string;
    message?: string;
}

export interface MessageNotification extends BaseWebSocketMessage {
    type: 'message_notif';
    from_user_id: number;
    from_username: string;
    message?: string;
}

// ==== Wrapper type for notification messages from server ====

export interface NotificationWrapper extends BaseWebSocketMessage {
    type: 'notification';
    data: {
        id: number;
        type: string;
        is_read: boolean;
        from_user: {
            id: number;
            username: string;
        };
    };
}

// ==== System Message Types ====

export interface PongMessage extends BaseWebSocketMessage {
    type: 'pong';
}

export interface ErrorMessage extends BaseWebSocketMessage {
    type: 'error';
    message: string;
    code?: string;
}

// ==== Union Types ====

export type ChatWebSocketMessage =
    | ChatMessage
    | TypingStartMessage
    | TypingStopMessage
    | MessageReadMessage;

export type NotificationWebSocketMessage =
    | LikeNotification
    | MatchNotification
    | UnlikeNotification
    | ViewNotification
    | MessageNotification
    | NotificationWrapper;

export type SystemWebSocketMessage =
    | PongMessage
    | ErrorMessage;

export type WebSocketMessage =
    | ChatWebSocketMessage
    | NotificationWebSocketMessage
    | SystemWebSocketMessage;

// ==== Message Type Constants ====

export const CHAT_MESSAGE_TYPES = [
    'chat_message',
    'typing_start',
    'typing_stop',
    'message_read',
] as const;

export const NOTIFICATION_MESSAGE_TYPES = [
    'like',
    'match',
    'unlike',
    'view',
    'message_notif',
    'notification',
] as const;

export const SYSTEM_MESSAGE_TYPES = [
    'pong',
    'error',
] as const;

export type ChatMessageType = typeof CHAT_MESSAGE_TYPES[number];
export type NotificationMessageType = typeof NOTIFICATION_MESSAGE_TYPES[number];
export type SystemMessageType = typeof SYSTEM_MESSAGE_TYPES[number];
export type MessageType = ChatMessageType | NotificationMessageType | SystemMessageType | "users_online" | "user_status_change" | "user_statuses" | string; // add user status types

// ==== Handler Types ====

export type MessageHandler<T = WebSocketMessage> = (message: T) => void;

export type HandlerMap = {
    [K in MessageType]?: MessageHandler<Extract<WebSocketMessage, { type: K }>>;
};

// ==== Outgoing Message Types ====

export interface OutgoingChatMessage {
    type: 'chat_message';
    receiverId: string;
    content: string;
    timestamp?: number;
}

export interface OutgoingTypingStart {
    type: 'typing_start';
    receiverId: string;
    timestamp?: number;
}

export interface OutgoingTypingStop {
    type: 'typing_stop';
    receiverId: string;
    timestamp?: number;
}

export interface OutgoingMarkRead {
    type: 'mark_read';
    messageId: string;
    senderId: string;
    timestamp?: number;
}

export interface OutgoingPing {
    type: 'ping';
    timestamp?: number;
}

export type OutgoingWebSocketMessage =
    | OutgoingChatMessage
    | OutgoingTypingStart
    | OutgoingTypingStop
    | OutgoingMarkRead
    | OutgoingPing;

// ==== Helper Type Guards ====

export function isChatMessage(message: WebSocketMessage): message is ChatWebSocketMessage {
    return CHAT_MESSAGE_TYPES.includes(message.type as ChatMessageType);
}

export function isNotificationMessage(message: WebSocketMessage): message is NotificationWebSocketMessage {
    return NOTIFICATION_MESSAGE_TYPES.includes(message.type as NotificationMessageType);
}

export function isSystemMessage(message: WebSocketMessage): message is SystemWebSocketMessage {
    return SYSTEM_MESSAGE_TYPES.includes(message.type as SystemMessageType);
}
