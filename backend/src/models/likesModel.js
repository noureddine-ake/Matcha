import { pool } from '../config/config.js';

/**
 * Get total number of likes received by a user
 * @param {number} userId - ID of the user
 * @returns {Promise<number>} Total likes
 */
export const getUserLikesCount = async (userId) => {
  const query = `
    SELECT COUNT(*)::int AS total_likes
    FROM likes
    WHERE liked_user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0].total_likes;
};
