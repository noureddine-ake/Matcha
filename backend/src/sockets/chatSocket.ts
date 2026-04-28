import { sendRealTimeMessage } from '../config/websocket.js';
import { markMessagesAsRead } from '../models/chatModel.js';

/**
 * Register all chat-related WebSocket handlers
 * Called once when server starts (from server.ts)
 */
export const registerChatHandlers = (registerHandler: Function) => {
  // Handle incoming chat messages
  registerHandler('chat_message', handleChatMessageEvent);
  
  // Handle typing indicators
  registerHandler('typing_start', handleTypingStart);
  registerHandler('typing_stop', handleTypingStop);
  
  // Handle message read status
  registerHandler('mark_read', handleMarkMessagesAsRead);
};

/**
 * Handle incoming chat message
 * Broadcasts to receiver and sends delivery confirmation
 */
async function handleChatMessageEvent(
  senderId: string,
  data: {
    type: string;
    receiverId: string;
    content: string;
    timestamp?: string;
    messageId?: string | number;
  }
) {
  try {
    const { receiverId, content, timestamp, messageId } = data;

    if (!receiverId || !content) {
      console.log('[WS] ⚠️ Invalid chat message: missing receiverId or content');
      return;
    }

    console.log(`[WS] 📨 Chat message from ${senderId} to ${receiverId}: "${content.substring(0, 50)}..."`);

    // Prepare message for broadcasting
    const messageToSend = {
      id: messageId,
      senderId: senderId.toString(),
      receiverId: receiverId.toString(),
      content,
      timestamp: timestamp || new Date().toISOString(),
      read: false,
      databaseId: messageId,
    };

    // 1️⃣ Send message to receiver
    const sentToReceiver = sendRealTimeMessage(
      receiverId.toString(),
      messageToSend
    );

    console.log(
      `[WS] 📤 Message broadcast to receiver ${receiverId}: ${sentToReceiver ? '✅ SUCCESS' : '⚠️ OFFLINE'}`
    );

    // 2️⃣ Send delivery confirmation back to sender
    const confirmationMessage = {
      ...messageToSend,
      deliveryStatus: sentToReceiver ? 'delivered' : 'offline',
      type: 'message_delivery_status',
    };

    // Echo back to sender (if connected)
    sendRealTimeMessage(
      senderId.toString(),
      {
        type: 'message_delivery_status',
        data: confirmationMessage,
      }
    );

    console.log(`[WS] ✅ Delivery confirmation sent to sender ${senderId}`);
  } catch (error) {
    console.error('[WS] ❌ Error handling chat message:', error);
  }
}

/**
 * Handle typing start indicator
 * Broadcast to conversation partner
 */
function handleTypingStart(
  senderId: string,
  data: {
    receiverId: string;
  }
) {
  try {
    const { receiverId } = data;

    if (!receiverId) {
      console.log('[WS] ⚠️ Invalid typing_start: missing receiverId');
      return;
    }

    console.log(`[WS] ✍️  User ${senderId} is typing...`);

    // Send typing indicator to receiver
    sendRealTimeMessage(
      receiverId.toString(),
      {
        type: 'typing_start',
        data: {
          senderId: senderId.toString(),
          receiverId: receiverId.toString(),
          timestamp: new Date().toISOString(),
        },
      }
    );

    console.log(`[WS] ✍️  Typing indicator sent to ${receiverId}`);
  } catch (error) {
    console.error('[WS] ❌ Error handling typing start:', error);
  }
}

/**
 * Handle typing stop indicator
 * Broadcast to conversation partner
 */
function handleTypingStop(
  senderId: string,
  data: {
    receiverId: string;
  }
) {
  try {
    const { receiverId } = data;

    if (!receiverId) {
      console.log('[WS] ⚠️ Invalid typing_stop: missing receiverId');
      return;
    }

    console.log(`[WS] ✋ User ${senderId} stopped typing`);

    // Send typing stop to receiver
    sendRealTimeMessage(
      receiverId.toString(),
      {
        type: 'typing_stop',
        data: {
          senderId: senderId.toString(),
          receiverId: receiverId.toString(),
          timestamp: new Date().toISOString(),
        },
      }
    );

    console.log(`[WS] ✋ Typing stop sent to ${receiverId}`);
  } catch (error) {
    console.error('[WS] ❌ Error handling typing stop:', error);
  }
}

/**
 * Handle message read status update
 * Marks messages as read and notifies sender
 */
async function handleMarkMessagesAsRead(
  senderId: string,
  data: {
    receiverId: string;
    conversationUserId?: string;
  }
) {
  try {
    const { receiverId, conversationUserId } = data;

    if (!receiverId) {
      console.log('[WS] ⚠️ Invalid mark_read: missing receiverId');
      return;
    }

    console.log(`[WS] 👀 User ${senderId} marked messages from ${receiverId} as read`);

    // Mark messages as read in database
    await markMessagesAsRead(senderId.toString(), receiverId.toString());

    // Notify the other user that their messages were read
    sendRealTimeMessage(
      receiverId.toString(),
      {
        type: 'messages_read',
        data: {
          userId: senderId.toString(),
          conversationUserId: conversationUserId || senderId.toString(),
          timestamp: new Date().toISOString(),
        },
      }
    );

    console.log(`[WS] 👀 Read status notification sent to ${receiverId}`);
  } catch (error) {
    console.error('[WS] ❌ Error handling mark read:', error);
  }
}

export default { registerChatHandlers };
