import { pool } from '../config/config.js';

export const Report = {
  // Create a new report
  async create(reporterId, reportedId, reason) {
    const result = await pool.query(
      `INSERT INTO reports 
       (reporter_user_id, reported_user_id, reason) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [reporterId, reportedId, reason]
    );
    return result.rows[0];
  },

  // Check if user already reported
  async exists(reporterId, reportedId) {
    const result = await pool.query(
      `SELECT 1 FROM reports 
       WHERE reporter_user_id = $1 
       AND reported_user_id = $2`,
      [reporterId, reportedId]
    );
    return result.rows.length > 0;
  },

  // Get all reports for a user
  async getByReportedUser(userId) {
    const result = await pool.query(
      `SELECT * FROM reports 
       WHERE reported_user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Increment report count in profiles
  async incrementReportCount(userId) {
    await pool.query(
      `UPDATE profiles 
       SET report_count = report_count + 1 
       WHERE user_id = $1`,
      [userId]
    );
  },
   // Get current report count for a user
  async getReportCount(userId) {
    const result = await pool.query(
      `SELECT report_count FROM profiles WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0]?.report_count || 0;
  },

  // Delete user account (soft delete or hard delete)
  async deleteUserAccount(userId) {
  try {
    // Delete ALL user data cascading (due to ON DELETE CASCADE)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log(`✅ User ${userId} PERMANENTLY deleted`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
};