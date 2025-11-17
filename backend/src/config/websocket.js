import { WebSocketServer } from 'ws';
import jwtHelper from '../middlewares/authMiddleware.js';

// Store connected clients: userId -> WebSocket connection
const clients = new Map();

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('🔌 New WebSocket connection attempt');
    
    
    
    const token = jwtHelper.getTokeFromCookies(req);

    if (!token) {
      console.log('❌ No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Use your existing decodeToken function
      const decoded = jwtHelper.decodeToken(token);
      
      if (!decoded) {
        console.log('❌ Invalid token');
        ws.close(1008, 'Invalid authentication token');
        return;
      }

      const userId = decoded.data.id;

      // Store connection
      clients.set(userId, ws);
      console.log(`✅ User ${userId} connected via WebSocket`);

      // Send connection success message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to notification service',
        userId
      }));

      // Handle client messages (optional - for ping/pong)
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          // Handle ping
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        clients.delete(userId);
        console.log(`🔌 User ${userId} disconnected`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        clients.delete(userId);
      });

    } catch (error) {
      console.log('❌ Invalid token:', error.message);
      ws.close(1008, 'Invalid authentication token');
    }
  });

  console.log('🚀 WebSocket server initialized');

  return wss;
};

// Send notification to specific user
export const sendNotificationToUser = (userId, notification) => {
  const client = clients.get(userId);

  if (client && client.readyState === 1) {
    client.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
    console.log(`📤 Sent notification to user ${userId}`);
    return true;
  }
  
  console.log(`⚠️  User ${userId} not connected`);
  return false;
};

// Send message to specific user (for real-time chat)
export const sendMessageToUser = (userId, message) => {
  const client = clients.get(userId);
  
  if (client && client.readyState === 1) {
    client.send(JSON.stringify({
      type: 'message',
      data: message
    }));
    console.log(`💬 Sent message to user ${userId}`);
    return true;
  }
  
  return false;
};

// Broadcast to all connected clients (optional)
export const broadcastToAll = (data) => {
  let sentCount = 0;

  clients.forEach((client, userId) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
      sentCount++;
    }
  });

  console.log(`📢 Broadcast sent to ${sentCount} users`);
};

// Get online users
export const getOnlineUsers = () => {
  return Array.from(clients.keys());
};

// Check if user is online
export const isUserOnline = (userId) => {
  const client = clients.get(userId);
  return client && client.readyState === 1;
};
