import { pool } from "../config/config.js";

// ✅ MODEL — Chat-related DB functions
const ChatModel = {
  async userExists(userId) {
    const { rows } = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);
    return rows.length > 0;
  },

  async areConnected(senderId, receiverId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM likes l1
       JOIN likes l2 ON l1.liker_user_id = l2.liked_user_id 
                    AND l1.liked_user_id = l2.liker_user_id
       WHERE l1.liker_user_id = $1 AND l1.liked_user_id = $2`,
      [senderId, receiverId]
    );
    return rows.length > 0;
  },

  async getMessages(senderId, receiverId) {
    const query = `
      SELECT 
        m.id, m.content, m.sender_user_id, m.receiver_user_id,
        m.is_read, m.sent_at, u.username AS sender_username
      FROM messages m
      JOIN users u ON u.id = m.sender_user_id
      WHERE 
        (m.sender_user_id = $1 AND m.receiver_user_id = $2)
        OR (m.sender_user_id = $2 AND m.receiver_user_id = $1)
      ORDER BY m.sent_at ASC;
    `;
    const { rows } = await pool.query(query, [senderId, receiverId]);
    return rows;
  },

  async sendMessage(senderId, receiverId, content) {
    const query = `
      INSERT INTO messages (sender_user_id, receiver_user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, sender_user_id, receiver_user_id, content, sent_at;
    `;
    const { rows } = await pool.query(query, [senderId, receiverId, content]);
    return rows[0];
  },

  async markAsRead(senderId, receiverId) {
    await pool.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE sender_user_id = $1 AND receiver_user_id = $2`,
      [senderId, receiverId]
    );
  },

  async createNotification(userId, fromUserId) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, from_user_id)
       VALUES ($1, 'message', $2)`,
      [userId, fromUserId]
    );
  },
};

export default ChatModel;
