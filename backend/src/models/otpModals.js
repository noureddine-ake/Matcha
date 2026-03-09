import { pool } from '../config/config.js';

export async function createOTP(otp) {
  const query = `
      INSERT INTO email_verifications (user_id, verification_code, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
  const values = [otp.user_id, otp.verification_code, otp.expires_at];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getUserOTP(userid) {
  const query = `
      SELECT * FROM email_verifications WHERE user_id = ($1)
    `;
  const { rows } = await pool.query(query, [userid]);
  return rows;
}

export async function saveVerificationToken(userId, token) {
  const query = `
      UPDATE users SET verification_token = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
  const { rows } = await pool.query(query, [token, userId]);
  return rows[0];
}

export async function getUserByVerificationToken(token) {
  const query = `
      SELECT * FROM users WHERE verification_token = $1
    `;
  const { rows } = await pool.query(query, [token]);
  return rows;
}

export async function clearVerificationToken(userId) {
  const query = `
      UPDATE users SET verification_token = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}
