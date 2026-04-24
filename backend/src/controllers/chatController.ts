import { User } from "../../database/entities/users.entity.js";
import { isUserOnline, sendRealTimeMessage } from "../config/websocket.js";
import {
  getAllUsersExcept,
  userExists,
  saveMessage,
  markMessagesAsRead,
  createNotification,
  getMessagesPaginated
} from "../models/chatModel.js";
import {getProfilePictureByUserId} from "../models/photosModal.js";

// ✅ Get current user info
async function getCurrentUser(req, res) {
  try {
    const currentUserId = extractUserIdFromJWT(req.user);

    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        error: "No user ID found in token" 
      });
    }

    const ret = await User.select(['id', 'username', 'email', 'created_at']).where('id', currentUserId).run();
    const user = ret.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found" 
      });
    }

    res.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_online: isUserOnline(user.id)
      }
    });
    
  } catch (error) {
    console.error("❌ Error in getCurrentUser:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch current user: " + error.message 
    });
  }
}

// ✅ Get all users that current user can chat with
// ✅ Get all users that current user can chat with
async function getChatUsers(req, res) {
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
      users.map(async (user) => {
        try {
          // Get profile picture for this user
          const profilePicResult = await getProfilePictureByUserId(user.id);
          
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
            is_online: isUserOnline(user.id),
            last_message: null,
            unread_count: 0,
            is_connected: false
          };
          
        } catch (photoError) {
          console.error(`Error fetching profile picture for user ${user.id}:`, photoError);
          // Return user without profile photo on error
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            profile_photo: null,
            last_seen: null,
            is_online: isUserOnline(user.id),
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
    
  } catch (error) {
    console.error("❌ Error in getChatUsers:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch users: " + error.message 
    });
  }
}

// ✅ Get chat messages between current user and receiver
// ✅ Get chat messages between current user and receiver with pagination
async function getChat(req, res) {
  try {
    const { receiverId } = req.params;
    const { cursor, limit = 20 } = req.query;
    const currentUserId = extractUserIdFromJWT(req.user);

    console.log("🟡 getChat - currentUserId:", currentUserId, "receiverId:", receiverId, "cursor:", cursor);

    const numReceiverId = parseInt(receiverId);
    const numCurrentUserId = parseInt(currentUserId);

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
      cursor, 
      parseInt(limit)
    );
    
    console.log("🟡 Messages found:", messages.length, "Has more:", hasMore);
    
    const response = {
      messages,
      currentUserId: actualSenderId.toString(),
      realTime: {
        senderOnline: isUserOnline(actualSenderId),
        receiverOnline: isUserOnline(actualReceiverId),
        supportsWebSocket: true
      },
      pagination: {
        hasMore,
        nextCursor: hasMore ? nextCursor : null,
        totalMessages
      }
    };
    
    res.status(200).json(response);
  } catch (err) {
    console.error("❌ Error getting chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Send a message from current user to receiver
async function sendMessage(req, res) {
  try {
    const { receiverId } = req.params;
    const { content } = req.body;
    const currentUserId = extractUserIdFromJWT(req.user);

    console.log("🟡 sendMessage - currentUserId:", currentUserId, "receiverId:", receiverId);

    const numReceiverId = parseInt(receiverId);
    const numCurrentUserId = parseInt(currentUserId);

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
    
    const sentRealtime = sendRealTimeMessage(actualReceiverId, realTimeMessage);
    console.log("🟡 Real-time delivery:", sentRealtime ? "SUCCESS" : "FAILED - user offline");

    res.status(201).json({
      ...message,
      deliveredRealtime: sentRealtime
    });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Mark messages as read from a specific sender
async function markAsRead(req, res) {
  try {
    const { senderId } = req.params;
    const currentUserId = extractUserIdFromJWT(req.user);

    console.log("🟡 markAsRead - currentUserId:", currentUserId, "senderId:", senderId);

    const numSenderId = parseInt(senderId);
    const numCurrentUserId = parseInt(currentUserId);

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
      notifiedRealtime: isUserOnline(actualSenderId)
    });
  } catch (err) {
    console.error("❌ Error marking messages as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Get online status of a user
async function getOnlineStatus(req, res) {
  try {
    const { userId } = req.params;
    
    const online = isUserOnline(userId);
    
    res.json({ 
      success: true,
      userId,
      online 
    });
    
  } catch (error) {
    console.error("❌ Error getting online status:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to get online status" 
    });
  }
}

// ✅ HELPER FUNCTIONS

function extractUserIdFromJWT(userData) {
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