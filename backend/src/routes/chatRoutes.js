import express from "express";
import JWT from '../middlewares/authMiddleware.js';
import {
  getChatUsers,
  getChat,
  sendMessage,
  markAsRead,
  getOnlineStatus,
  getCurrentUser,
  
} from "../controllers/chatController.js";    
// import { pool } from "../config/config.js";

// import { isUserOnline, sendRealTimeMessage } from "../config/websocket.js";

const router = express.Router();

// ✅ ROUTES
router.get("/users", JWT.verifyAndDecodeToken, getChatUsers);
router.get("/:receiverId", JWT.verifyAndDecodeToken, getChat);
router.post("/:receiverId", JWT.verifyAndDecodeToken, sendMessage);
router.post("/:senderId/read", JWT.verifyAndDecodeToken, markAsRead);
router.get("/online-status/:userId", JWT.verifyAndDecodeToken, getOnlineStatus);
router.get("/me/current-user", JWT.verifyAndDecodeToken, getCurrentUser);

export default router;

// // ✅ Get current user info
// async function getCurrentUser(req, res) {
//   try {
//     const currentUserId = extractUserIdFromJWT(req.user);
    
//     if (!currentUserId) {
//       return res.status(400).json({ 
//         success: false,
//         error: "No user ID found in token" 
//       });
//     }

//     const query = `
//       SELECT id, username, email, created_at
//       FROM users 
//       WHERE id = $1
//     `;
    
//     const result = await pool.query(query, [currentUserId]);
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         error: "User not found" 
//       });
//     }

//     const user = result.rows[0];
    
//     res.json({ 
//       success: true,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         is_online: isUserOnline(user.id)
//       }
//     });
    
//   } catch (error) {
//     console.error("❌ Error in getCurrentUser:", error);
//     res.status(500).json({ 
//       success: false,
//       error: "Failed to fetch current user: " + error.message 
//     });
//   }
// }

// // ✅ Get all users that current user can chat with
// async function getChatUsers(req, res) {
//   try {
//     const currentUserId = extractUserIdFromJWT(req.user);
    
//     if (!currentUserId) {
//       return res.status(400).json({ 
//         success: false,
//         error: "No user ID found in token" 
//       });
//     }

//     const query = `
//       SELECT 
//         id, 
//         username, 
//         email,
//         created_at
//       FROM users 
//       WHERE id != $1 
//       ORDER BY username ASC
//     `;
    
//     const result = await pool.query(query, [currentUserId]);
    
//     const users = result.rows.map(user => ({
//       id: user.id,
//       username: user.username,
//       email: user.email,
//       profile_photo: null,
//       last_seen: null,
//       is_online: isUserOnline(user.id),
//       last_message: null,
//       unread_count: 0,
//       is_connected: false
//     }));
    
//     res.json({ 
//       success: true,
//       users,
//       currentUserId // ✅ FIXED: Send current user ID with users response
//     });
    
//   } catch (error) {
//     console.error("❌ Error in getChatUsers:", error);
//     res.status(500).json({ 
//       success: false,
//       error: "Failed to fetch users: " + error.message 
//     });
//   }
// }

// // ✅ Get chat messages between current user and receiver
// async function getChat(req, res) {
//   try {
//     const { receiverId } = req.params;
//     const currentUserId = extractUserIdFromJWT(req.user);

//     console.log("🟡 getChat - currentUserId:", currentUserId, "receiverId:", receiverId);

//     const numReceiverId = parseInt(receiverId);
//     const numCurrentUserId = parseInt(currentUserId);

//     const actualSenderId = numCurrentUserId;
//     const actualReceiverId = numReceiverId;

//     const senderExists = await userExists(actualSenderId);
//     const receiverExists = await userExists(actualReceiverId);
    
//     if (!senderExists || !receiverExists) {
//       return res.status(404).json({ error: "One or both users do not exist" });
//     }

//     const messages = await getMessages(actualSenderId, actualReceiverId);
//     console.log("🟡 Messages found:", messages.length);
    
//     const response = {
//       messages,
//       currentUserId: actualSenderId.toString(), // ✅ FIXED: Ensure string format
//       realTime: {
//         senderOnline: isUserOnline(actualSenderId),
//         receiverOnline: isUserOnline(actualReceiverId),
//         supportsWebSocket: true
//       }
//     };
    
//     res.status(200).json(response);
//   } catch (err) {
//     console.error("❌ Error getting chat:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// // ✅ Send a message from current user to receiver
// async function sendMessage(req, res) {
//   try {
//     const { receiverId } = req.params;
//     const { content } = req.body;
//     const currentUserId = extractUserIdFromJWT(req.user);

//     console.log("🟡 sendMessage - currentUserId:", currentUserId, "receiverId:", receiverId);

//     const numReceiverId = parseInt(receiverId);
//     const numCurrentUserId = parseInt(currentUserId);

//     const actualSenderId = numCurrentUserId;
//     const actualReceiverId = numReceiverId;

//     if (!content || !content.trim()) {
//       return res.status(400).json({ error: "Message cannot be empty" });
//     }

//     const senderExists = await userExists(actualSenderId);
//     const receiverExists = await userExists(actualReceiverId);
    
//     if (!senderExists || !receiverExists) {
//       return res.status(404).json({ error: "One or both users do not exist" });
//     }

//     const message = await saveMessage(actualSenderId, actualReceiverId, content);
//     console.log("🟡 Message saved:", message);

//     await createNotification(actualReceiverId, actualSenderId);

//     // ✅ FIXED: Send WebSocket message in correct format
//     const realTimeMessage = {
//       type: 'chat_message',
//       data: { // ✅ FIXED: Wrap in data property to match frontend expectation
//         messageId: `msg_${message.id}`,
//         senderId: actualSenderId.toString(),
//         receiverId: actualReceiverId.toString(),
//         content: message.content,
//         timestamp: message.timestamp,
//         databaseId: message.id,
//         read: false,
//         type: 'chat_message'
//       }
//     };

//     console.log("🟡 Sending real-time message:", realTimeMessage);
    
//     const sentRealtime = sendRealTimeMessage(actualReceiverId, realTimeMessage);
//     console.log("🟡 Real-time delivery:", sentRealtime ? "SUCCESS" : "FAILED - user offline");

//     res.status(201).json({
//       ...message,
//       deliveredRealtime: sentRealtime
//     });
//   } catch (err) {
//     console.error("❌ Error sending message:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// // ✅ Mark messages as read from a specific sender
// async function markAsRead(req, res) {
//   try {
//     const { senderId } = req.params;
//     const currentUserId = extractUserIdFromJWT(req.user);

//     console.log("🟡 markAsRead - currentUserId:", currentUserId, "senderId:", senderId);

//     const numSenderId = parseInt(senderId);
//     const numCurrentUserId = parseInt(currentUserId);

//     const actualSenderId = numSenderId;
//     const actualReceiverId = numCurrentUserId;

//     const senderExists = await userExists(actualSenderId);
//     const receiverExists = await userExists(actualReceiverId);
    
//     if (!senderExists || !receiverExists) {
//       return res.status(404).json({ error: "One or both users do not exist" });
//     }

//     await markMessagesAsRead(actualSenderId, actualReceiverId);

//     res.status(200).json({ 
//       success: true,
//       notifiedRealtime: isUserOnline(actualSenderId)
//     });
//   } catch (err) {
//     console.error("❌ Error marking messages as read:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// // ✅ Get online status of a user
// async function getOnlineStatus(req, res) {
//   try {
//     const { userId } = req.params;
    
//     const online = isUserOnline(userId);
    
//     res.json({ 
//       success: true,
//       userId,
//       online 
//     });
    
//   } catch (error) {
//     console.error("❌ Error getting online status:", error);
//     res.status(500).json({ 
//       success: false,
//       error: "Failed to get online status" 
//     });
//   }
// }

// // ✅ HELPER FUNCTIONS

// function extractUserIdFromJWT(userData) {
//   if (userData?.data?.id) {
//     return userData.data.id;
//   }
//   if (userData?.id) {
//     return userData.id;
//   }
//   if (userData?.user?.id) {
//     return userData.user.id;
//   }
//   if (userData?.userId) {
//     return userData.userId;
//   }
  
//   console.log("❌ Could not extract user ID from JWT:", userData);
//   return null;
// }

// async function userExists(userId) {
//   try {
//     if (!userId || isNaN(userId)) {
//       console.log("❌ Invalid user ID:", userId);
//       return false;
//     }

//     const result = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
//     const exists = result.rows.length > 0;
//     return exists;
//   } catch (error) {
//     console.error("❌ Error checking user existence for ID", userId, ":", error);
//     return false;
//   }
// }

// async function getMessages(senderId, receiverId) {
//   try {
//     const query = `
//       SELECT 
//         id,
//         sender_user_id as "senderId",
//         receiver_user_id as "receiverId", 
//         content,
//         sent_at as timestamp,
//         is_read as read
//       FROM messages 
//       WHERE (sender_user_id = $1 AND receiver_user_id = $2) 
//          OR (sender_user_id = $2 AND receiver_user_id = $1)
//       ORDER BY sent_at ASC
//     `;
//     const result = await pool.query(query, [senderId, receiverId]);
//     return result.rows;
//   } catch (error) {
//     console.error("❌ Error fetching messages:", error);
//     return [];
//   }
// }

// async function saveMessage(senderId, receiverId, content) {
//   try {
//     const query = `
//       INSERT INTO messages (sender_user_id, receiver_user_id, content, sent_at, is_read)
//       VALUES ($1, $2, $3, NOW(), false)
//       RETURNING 
//         id,
//         sender_user_id as "senderId",
//         receiver_user_id as "receiverId",
//         content,
//         sent_at as timestamp,
//         is_read as read
//     `;
//     const result = await pool.query(query, [senderId, receiverId, content]);
//     return result.rows[0];
//   } catch (error) {
//     console.error("❌ Error saving message:", error);
//     throw error;
//   }
// }

// async function markMessagesAsRead(senderId, receiverId) {
//   try {
//     const query = `
//       UPDATE messages 
//       SET is_read = true 
//       WHERE sender_user_id = $1 AND receiver_user_id = $2 AND is_read = false
//     `;
//     await pool.query(query, [senderId, receiverId]);
//   } catch (error) {
//     console.error("❌ Error marking messages as read:", error);
//     throw error;
//   }
// }

// async function createNotification(userId, fromUserId) {
//   try {
//     const query = `
//       INSERT INTO notifications (user_id, from_user_id, type, is_read, created_at)
//       VALUES ($1, $2, 'message', false, NOW())
//     `;
//     await pool.query(query, [userId, fromUserId]);
//   } catch (error) {
//     console.error("❌ Error creating notification:", error);
//   }
// }