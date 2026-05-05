import { Photos } from "../../database/entities/photos.entity.js";
import { User } from "../../database/entities/users.entity.js";
import { isUserOnline, sendRealTimeMessage } from "../config/websocket.js";
import type { Request, Response } from 'express';
import {
  getAllUsersExcept,
  userExists,
  saveMessage,
  markMessagesAsRead,
  createNotification,
  getMessagesPaginated
} from "../models/chatModel.js";

interface AuthRequest {
  user?: { data: { id: number; username?: string; email?: string } };
  params: any;
  query: any;
  body: any;
  protocol: any;
  get: any;
}

// ✅ Get current user info
async function getCurrentUser(req: any, res: any): Promise<void> {
  try {
    const currentUserId = extractUserIdFromJWT(req.user);

    if (!currentUserId) {
      res.status(400).json({
        success: false,
        error: "No user ID found in token" 
      });
      return;
    }

    const ret = await User.select(['id', 'username', 'email', 'created_at']).where('id', currentUserId).run();
    const user = ret.rows[0];

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found" 
      });
      return;
    }

    res.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_online: isUserOnline(user.id.toString())
      }
    });
    
  } catch (error: unknown) {
    console.error("❌ Error in getCurrentUser:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch current user: " + errorMsg 
    });
  }
}

// ✅ Get all users that current user can chat with
async function getChatUsers(req: any, res: any): Promise<void | Response> {
  try {
    const currentUserId = extractUserIdFromJWT(req.user);
    
    if (!currentUserId) {
      return res.status(400).json({ 
        success: false,
        error: "No user ID found in token" 
      });
    }

    const users = await getAllUsersExcept(currentUserId);
    
    // Get profile pictures for all users in parallel
    const usersWithPhotos = await Promise.all(
      users.map(async (user: any) => {
        try {
          // Get profile picture for this user
          // SELECT photo_url FROM photos WHERE user_id = $1 AND is_profile_picture = true
          const profilePicResult = await Photos.select(['photo_url'])
            .where('user_id', user.id)
            .where('is_profile_picture', true)
            .run();
          
          let profile_photo = null;
          
          // Check if user has a profile picture
          if (profilePicResult && profilePicResult.rows && profilePicResult.rows.length > 0) {
            const photoUrl = profilePicResult.rows[0].photo_url;
            
            // Convert to absolute URL if needed
            if (photoUrl) {
              // If it's already an absolute URL, use as-is
              if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
                profile_photo = photoUrl;
              } 
              // If it's a relative path starting with /
              else if (photoUrl.startsWith('/')) {
                // Get base URL from environment or request
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
                profile_photo = `${baseUrl}${photoUrl}`;
              }
              // If it's just a filename
              else {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
                profile_photo = `${baseUrl}/uploads/${photoUrl}`;
              }
            }
          }
          
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            profile_photo: profile_photo, // Now with actual photo URL or null
            last_seen: null, // You might want to get this from profiles table
            is_online: isUserOnline(user.id.toString()),
            last_message: null,
            unread_count: 0,
            is_connected: false
          };
          
        } catch (photoError: unknown) {
          console.error(`Error fetching profile picture for user ${user.id}:`, photoError);
          // Return user without profile photo on error
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            profile_photo: null,
            last_seen: null,
            is_online: isUserOnline(user.id.toString()),
            last_message: null,
            unread_count: 0,
            is_connected: false
          };
        }
      })
    );
    
    res.json({ 
      success: true,
      users: usersWithPhotos,
      currentUserId
    });
    
  } catch (error: unknown) {
    console.error("❌ Error in getChatUsers:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch users: " + errorMsg 
    });
  }
}

// ✅ Get chat messages between current user and receiver
// ✅ Get chat messages between current user and receiver with pagination
async function getChat(req: any, res: any): Promise<void | Response> {
  try {
    const { receiverId } = req.params;
    const { cursor, limit = 20 } = req.query;
    const currentUserId = extractUserIdFromJWT(req.user);

    console.log("🟡 getChat - currentUserId:", currentUserId, "receiverId:", receiverId, "cursor:", cursor);

    if (!currentUserId) {
        return res.status(400).json({ error: "No user ID found in token" });
    }

    const numReceiverId = parseInt(receiverId);
    const numCurrentUserId = parseInt(currentUserId.toString());

    const actualSenderId = numCurrentUserId;
    const actualReceiverId = numReceiverId;

    const senderExists = await userExists(actualSenderId);
    const receiverExists = await userExists(actualReceiverId);
    
    if (!senderExists || !receiverExists) {
      return res.status(404).json({ error: "One or both users do not exist" });
    }

    const { messages, hasMore, nextCursor, totalMessages } = await getMessagesPaginated(
      actualSenderId, 
      actualReceiverId, 
      cursor as any, 
      parseInt(limit as string)
    );
    
    console.log("🟡 Messages found:", messages.length, "Has more:", hasMore);
    
    const response = {
      messages,
      currentUserId: actualSenderId.toString(),
      realTime: {
        senderOnline: isUserOnline(actualSenderId.toString()),
        receiverOnline: isUserOnline(actualReceiverId.toString()),
        supportsWebSocket: true
      },
      pagination: {
        hasMore,
        nextCursor: hasMore ? nextCursor : null,
        totalMessages
      }
    };
    
    res.status(200).json(response);
  } catch (err: unknown) {
    console.error("❌ Error getting chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Send a message from current user to receiver
async function sendMessage(req: any, res: any): Promise<void | Response> {
  try {
    const { receiverId } = req.params;
    const { content } = req.body;
    const currentUserId = extractUserIdFromJWT(req.user);

    console.log("🟡 sendMessage - currentUserId:", currentUserId, "receiverId:", receiverId);

    if (!currentUserId) {
        return res.status(400).json({ error: "No user ID found in token" });
    }

    const numReceiverId = parseInt(receiverId);
    const numCurrentUserId = parseInt(currentUserId.toString());

    const actualSenderId = numCurrentUserId;
    const actualReceiverId = numReceiverId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const senderExists = await userExists(actualSenderId);
    const receiverExists = await userExists(actualReceiverId);
    
    if (!senderExists || !receiverExists) {
      return res.status(404).json({ error: "One or both users do not exist" });
    }

    const message = await saveMessage(actualSenderId, actualReceiverId, content);
    console.log("🟡 Message saved:", message);

    await createNotification(actualReceiverId, actualSenderId);

    // ✅ FIXED: Send WebSocket message in correct format
    const realTimeMessage = {
      type: 'chat_message',
      data: { // ✅ FIXED: Wrap in data property to match frontend expectation
        messageId: `msg_${message.id}`,
        senderId: actualSenderId.toString(),
        receiverId: actualReceiverId.toString(),
        content: message.content,
        timestamp: message.timestamp,
        databaseId: message.id,
        read: false,
        type: 'chat_message'
      }
    };

    console.log("🟡 Sending real-time message:", realTimeMessage);
    
    const sentRealtime = sendRealTimeMessage(actualReceiverId.toString(), realTimeMessage);
    console.log("🟡 Real-time delivery:", sentRealtime ? "SUCCESS" : "FAILED - user offline");

    res.status(201).json({
      ...message,
      deliveredRealtime: sentRealtime
    });
  } catch (err: unknown) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Mark messages as read from a specific sender
async function markAsRead(req: any, res: any): Promise<void | Response> {
  try {
    const { senderId } = req.params;
    const currentUserId = extractUserIdFromJWT(req.user);

    console.log("🟡 markAsRead - currentUserId:", currentUserId, "senderId:", senderId);

    if (!currentUserId) {
        return res.status(400).json({ error: "No user ID found in token" });
    }

    const numSenderId = parseInt(senderId);
    const numCurrentUserId = parseInt(currentUserId.toString());

    const actualSenderId = numSenderId;
    const actualReceiverId = numCurrentUserId;

    const senderExists = await userExists(actualSenderId);
    const receiverExists = await userExists(actualReceiverId);
    
    if (!senderExists || !receiverExists) {
      return res.status(404).json({ error: "One or both users do not exist" });
    }

    await markMessagesAsRead(actualSenderId, actualReceiverId);

    res.status(200).json({ 
      success: true,
      notifiedRealtime: isUserOnline(actualSenderId.toString())
    });
  } catch (err: unknown) {
    console.error("❌ Error marking messages as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Get online status of a user
async function getOnlineStatus(req: any, res: any): Promise<void> {
  try {
    const { userId } = req.params;
    
    const online = isUserOnline(userId as string);
    
    res.json({ 
      success: true,
      userId: userId as string,
      online 
    });
    
  } catch (error: unknown) {
    console.error("❌ Error getting online status:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to get online status" 
    });
  }
}

// ✅ HELPER FUNCTIONS

function extractUserIdFromJWT(userData: any): number | string | null {
  if (userData?.data?.id) {
    return userData.data.id;
  }
  if (userData?.id) {
    return userData.id;
  }
  if (userData?.user?.id) {
    return userData.user.id;
  }
  if (userData?.userId) {
    return userData.userId;
  }
  
  console.log("❌ Could not extract user ID from JWT:", userData);
  return null;
}

export {
  getCurrentUser,
  getChatUsers,
  getChat,
  sendMessage,
  markAsRead,
  getOnlineStatus
};
