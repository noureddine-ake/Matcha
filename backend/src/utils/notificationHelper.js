import { pool } from '../config/config.js';
import { sendNotificationToUser } from '../config/websocket.js';

/**
 * Create and send notification
 */
export const createAndSendNotification = async (userId, type, fromUserId, additionalData = {}) => {
  try {
    // Insert notification into database
    const query = `
      INSERT INTO notifications (user_id, type, from_user_id, is_read)
      VALUES ($1, $2, $3, FALSE)
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, type, fromUserId]);
    const notification = result.rows[0];

    // Get sender info
    const userQuery = `
      SELECT id, username, first_name, last_name,
             (SELECT photo_url FROM photos WHERE user_id = $1 AND is_profile_picture = TRUE LIMIT 1) as profile_picture
      FROM users
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [fromUserId]);
    const fromUser = userResult.rows[0];

    // Prepare notification payload
    const notificationPayload = {
      id: notification.id,
      socket_type: "notification",
      type: notification.type,
      is_read: notification.is_read,
      created_at: notification.created_at,
      from_user: {
        id: fromUser.id,
        username: fromUser.username,
        first_name: fromUser.first_name,
        last_name: fromUser.last_name,
        profile_picture: fromUser.profile_picture
      },
      ...additionalData
    };

    // Send via WebSocket in real-time
    const sent = sendNotificationToUser(userId, notificationPayload);

    return {
      notification,
      sentRealtime: sent
    };

  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Notification type helpers
 */
export const notificationTypes = {
  LIKE: 'like',
  MATCH: 'match',
  UNLIKE: 'unlike',
  VIEW: 'view',
  MESSAGE: 'message'
};