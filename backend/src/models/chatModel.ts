import { User } from "../../database/entities/users.entity.js";
import { pool } from "../config/config.js";

// ✅ User-related queries
export async function getUserById(userId) {
  try {
    // const query = `
    //   SELECT id, username, email, created_at
    //   FROM users 
    //   WHERE id = $1
    // `;
    // const result = await pool.query(query, [userId]);

    console.log('=======dkhel');
    const tt = User.select(['id', 'username', 'email', 'created_at']).where('id', userId).build();
    console.log('============================', tt);

    return {};
  } catch (error) {
    console.error("❌ Error in getUserById:", error);
    throw error;
  }
}

// ✅ Get messages with pagination
export async function getMessagesPaginated(senderId, receiverId, cursor = null, limit = 20) {
  try {
    // Get total count for pagination info
    const countQuery = `
      SELECT COUNT(*) 
      FROM messages 
      WHERE (sender_user_id = $1 AND receiver_user_id = $2) 
         OR (sender_user_id = $2 AND receiver_user_id = $1)
    `;
    const countResult = await pool.query(countQuery, [senderId, receiverId]);
    const totalMessages = parseInt(countResult.rows[0].count);

    let query, params;
    
    if (cursor) {
      // Load older messages (before cursor)
      query = `
        SELECT 
          id,
          sender_user_id as "senderId",
          receiver_user_id as "receiverId", 
          content,
          sent_at as timestamp,
          is_read as read
        FROM messages 
        WHERE ((sender_user_id = $1 AND receiver_user_id = $2) 
           OR (sender_user_id = $2 AND receiver_user_id = $1))
          AND sent_at < (SELECT sent_at FROM messages WHERE id = $3)
        ORDER BY sent_at DESC
        LIMIT $4
      `;
      params = [senderId, receiverId, cursor, limit];
    } else {
      // Load latest messages
      query = `
        SELECT 
          id,
          sender_user_id as "senderId",
          receiver_user_id as "receiverId", 
          content,
          sent_at as timestamp,
          is_read as read
        FROM messages 
        WHERE (sender_user_id = $1 AND receiver_user_id = $2) 
           OR (sender_user_id = $2 AND receiver_user_id = $1)
        ORDER BY sent_at DESC
        LIMIT $3
      `;
      params = [senderId, receiverId, limit];
    }

    const result = await pool.query(query, params);
    const messages = result.rows.reverse(); // Reverse to get chronological order
    
    const hasMore = cursor 
      ? messages.length === limit // If loading older messages and we got a full page
      : totalMessages > limit; // If initial load and there are more messages
    
    const nextCursor = messages.length > 0 ? messages[0].id : null;

    return {
      messages,
      hasMore,
      nextCursor,
      totalMessages
    };
  } catch (error) {
    console.error("❌ Error fetching paginated messages:", error);
    throw error;
  }
}

export async function getAllUsersExcept(currentUserId) {
  try {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at
      FROM users u
      JOIN likes l1 
        ON l1.liker_user_id = $1 AND l1.liked_user_id = u.id
      JOIN likes l2 
        ON l2.liker_user_id = u.id AND l2.liked_user_id = $1
      ORDER BY u.username ASC
    `;

    const result = await pool.query(query, [currentUserId]);
    return result.rows;
  } catch (error) {
    console.error("❌ Error in getMatchedUsers:", error);
    throw error;
  }
}

export async function userExists(userId) {
  try {
    if (!userId || isNaN(userId)) {
      console.log("❌ Invalid user ID:", userId);
      return false;
    }
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error("❌ Error checking user existence for ID", userId, ":", error);
    return false;
  }
}

// ✅ Message-related queries
export async function getMessages(senderId, receiverId) {
  try {
    const query = `
      SELECT 
        id,
        sender_user_id as "senderId",
        receiver_user_id as "receiverId", 
        content,
        sent_at as timestamp,
        is_read as read
      FROM messages 
      WHERE (sender_user_id = $1 AND receiver_user_id = $2) 
         OR (sender_user_id = $2 AND receiver_user_id = $1)
      ORDER BY sent_at ASC
    `;
    const result = await pool.query(query, [senderId, receiverId]);
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    throw error;
  }
}

export async function saveMessage(senderId, receiverId, content) {
  try {
    const query = `
      INSERT INTO messages (sender_user_id, receiver_user_id, content, sent_at, is_read)
      VALUES ($1, $2, $3, NOW(), false)
      RETURNING 
        id,
        sender_user_id as "senderId",
        receiver_user_id as "receiverId",
        content,
        sent_at as timestamp,
        is_read as read
    `;
    const result = await pool.query(query, [senderId, receiverId, content]);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error saving message:", error);
    throw error;
  }
}

export async function markMessagesAsRead(senderId, receiverId) {
  try {
    const query = `
      UPDATE messages 
      SET is_read = true 
      WHERE sender_user_id = $1 AND receiver_user_id = $2 AND is_read = false
    `;
    await pool.query(query, [senderId, receiverId]);
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    throw error;
  }
}

// ✅ Notification-related queries
export async function createNotification(userId, fromUserId) {
  try {
    const query = `
      INSERT INTO notifications (user_id, from_user_id, type, is_read, created_at)
      VALUES ($1, $2, 'message', false, NOW())
    `;
    await pool.query(query, [userId, fromUserId]);
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
}