import { WebSocketServer, WebSocket, RawData } from 'ws';
import jwtHelper from '../middlewares/authMiddleware.js';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';

declare module 'ws' {
  interface WebSocket {
    userId?: string | number;
  }
}

interface OnlineUser {
  userId: string | number;
  status: 'online' | 'offline';
  username?: string;
  lastSeen?: Date;
}

interface ChatMessage {
  type: string;
  payload?: any;
}

interface MessageHandler {
  (messageType: string, handler: (ws: WebSocket, data: any) => Promise<void>): void;
}

interface NotificationHandler {
  (userId: string | number, notification: any): Promise<void>;
}

// Store connected clients: userId -> WebSocket connection
const clients = new Map();

// Store user status with timestamps: userId -> { status: 'online'|'offline', lastSeen: Date }
const userStatus = new Map();

// Chat-specific handlers
const chatHandlers = new Map();

export const setupWebSocket = (server: Server<typeof IncomingMessage, typeof ServerResponse>) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('🔌 New WebSocket connection attempt');
    
    const token = jwtHelper.getTokeFromCookies(req as any);

    if (!token) {
      console.log('❌ No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Decode token
      const decoded = jwtHelper.decodeToken(token);
      
      if (!decoded) {
        console.log('❌ Invalid token');
        ws.close(1008, 'Invalid authentication token');
        return;
      }

      // Extract user ID from token (try different paths)
      let userId = null;
      if (decoded.data && decoded.data.id) {
        userId = decoded.data.id;
      } else if (decoded.id) {
        userId = decoded.id;
      } else if (decoded.userId) {
        userId = decoded.userId;
      } else if (decoded.sub) {
        userId = decoded.sub;
      }

      if (!userId) {
        console.log('❌ Could not extract userId from token');
        ws.close(1008, 'Invalid token structure');
        return;
      }

      // Convert to string for consistent comparison
      userId = userId.toString();

      // Get username from token
      const username = decoded.data?.username || decoded.username || `User ${userId}`;

      // Store connection
      clients.set(userId, ws);
      
      // Update user status to online
      userStatus.set(userId, { 
        status: 'online', 
        lastSeen: new Date(),
        username
      });
      
      console.log(`✅ User ${userId} (${username}) connected`);
      console.log(`📊 Total connected: ${clients.size}`);

      // Broadcast status change to all connected clients
      broadcastUserStatus(userId, 'online', username);

      // Send connection success message with current online users
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to notification service',
        userId,
        onlineUsers: getOnlineUsersList()
      }));

      // Send initial online users list
      ws.send(JSON.stringify({
        type: 'users_online',
        users: getOnlineUsersList()
      }));

      // Handle client messages
      ws.on('message', (message: RawData) => {
        try {
          const data: ChatMessage = JSON.parse(message.toString());

          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            
            // Update last seen on ping
            const status = userStatus.get(userId);
            if (status) {
              status.lastSeen = new Date();
              userStatus.set(userId, status);
            }
          }
          else if (data.type === 'chat_message' || 
                   data.type === 'typing_start' || 
                   data.type === 'typing_stop' ||
                   data.type === 'mark_read') {
            handleChatMessage(userId, data);
          }
          else if (data.type === 'get_user_status') {
            handleStatusRequest(ws, data);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        clients.delete(userId);
        
        const status = userStatus.get(userId);
        if (status) {
          status.status = 'offline';
          status.lastSeen = new Date();
          userStatus.set(userId, status);
        }
        
        console.log(`🔌 User ${userId} disconnected`);
        console.log(`📊 Remaining connected: ${clients.size}`);
        
        broadcastUserStatus(userId, 'offline');
      });

      // Handle errors
      ws.on('error', (error: unknown) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`WebSocket error for user ${userId}:`, errorMsg);
        clients.delete(userId);
        
        const status = userStatus.get(userId);
        if (status) {
          status.status = 'offline';
          status.lastSeen = new Date();
          userStatus.set(userId, status);
        }
        
        broadcastUserStatus(userId, 'offline');
      });

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log('❌ Error:', errorMsg);
      ws.close(1008, 'Invalid authentication token');
    }
  });

  console.log('🚀 WebSocket server initialized');
  return wss;
};

// Handle status request
function handleStatusRequest(ws: WebSocket, data: any): void {
  const { userIds } = data;
  
  if (Array.isArray(userIds)) {
    const statuses: Record<string, any> = {};
    userIds.forEach((id: any) => {
      const idStr = id.toString();
      const status = userStatus.get(idStr) || { 
        status: 'offline', 
        lastSeen: null,
        username: null 
      };
      statuses[idStr] = {
        status: status.status,
        lastSeen: status.lastSeen,
        username: status.username
      };
    });
    
    ws.send(JSON.stringify({
      type: 'user_statuses',
      data: statuses
    }));
  }
}

// Broadcast user status change to all connected clients
function broadcastUserStatus(userId: string | number, status: string, username?: string | null): void {
  const statusData = {
    userId,
    status,
    lastSeen: new Date(),
    username,
    timestamp: new Date().toISOString()
  };

  clients.forEach((client: WebSocket) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'user_status_change',
        data: statusData
      }));
    }
  });
  
  console.log(`📢 User ${userId} is now ${status}`);
}

// Handle chat messages
async function handleChatMessage(senderId: string | number, data: any): Promise<void> {
  const handler = chatHandlers.get(data.type);
  
  if (handler) {
    console.log(`[WS] 🔄 Routing ${data.type} message from user ${senderId}`);
    await handler(senderId, data);
  } else {
    console.warn(`[WS] ⚠️ No handler found for message type: ${data.type}`);
  }
}

// Send real-time message
export const sendRealTimeMessage = (receiverId: string, messageData: any) => {
  const receiverIdStr = receiverId;
  const client = clients.get(receiverIdStr);
  
  if (client && client.readyState === 1) {
    client.send(JSON.stringify({
      type: 'chat_message',
      data: messageData
    }));
    return true;
  }
  
  console.log(`⚠️ User ${receiverIdStr} not connected`);
  return false;
};

// Register chat handler
export const registerChatHandler = (messageType: string, handler: (senderId: string | number, data: any) => Promise<void>): void => {
  chatHandlers.set(messageType, handler);
};

// Send notification
export const sendNotificationToUser = (userId: string | number, notification: any): boolean => {
  const userIdStr = userId.toString();
  const client = clients.get(userIdStr);

  if (client && client.readyState === 1) {
    client.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
    return true;
  }
  
  return false;
};

// Get online users list with details
export const getOnlineUsersList = (): OnlineUser[] => {
  const onlineUsers: OnlineUser[] = [];
  clients.forEach((client: WebSocket, userId: string | number) => {
    if (client.readyState === 1) {
      const status = userStatus.get(userId) || { 
        status: 'online', 
        lastSeen: new Date(),
        username: `User ${userId}`
      };
      onlineUsers.push({
        userId,
        status: status.status,
        username: status.username,
        lastSeen: status.lastSeen
      });
    }
  });
  return onlineUsers;
};

// Check if user is online
export const isUserOnline = (userId: string) => {
  const userIdStr = userId;
  const client = clients.get(userIdStr);
  return client && client.readyState === 1;
};

// Debug function
export const debugConnections = () => {
  return {
    connectedUsers: Array.from(clients.keys()),
    userStatuses: Array.from(userStatus.entries())
  };
};