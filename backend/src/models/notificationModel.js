import { pool } from '../config/config.js';

export const getAllNotifications = async (userId) => {
  const query = `
      SELECT 
        n.id,
        n.type,
        n.is_read,
        n.created_at,
        u.id AS from_user_id,
        u.username AS from_username
        -- u.profile_picture AS from_profile_picture
      FROM notifications n
      JOIN users u ON u.id = n.from_user_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
    `;
  const values = [userId];
  const current = await pool.query(query, values);
  return current;
};

export const setNotificationReaded = async (data) => {
  const query = `
      UPDATE
      notifications 
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
  const values = [data.id, data.userId];
  const current = await pool.query(query, values);
  return current;
};
