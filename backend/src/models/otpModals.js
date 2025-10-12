// =================================================================
// this file contains all the models about email_verification Tables 
// =================================================================

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
