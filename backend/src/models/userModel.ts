// ====================================================
// this file contains all the models about users Tables
// ====================================================

import { pool } from '../config/config.js';

// DELETE
export async function deleteUser(id: number) {
  await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
  return true;
}

// LIST ALL USERS
export async function getAllUsers() {
  const { rows } = await pool.query(`SELECT * FROM users ORDER BY id ASC`);
  return rows;
}

// GET A USER BY EMAIL
export async function getUserAttr(attr: string, value: unknown  ) {
  const allowedFields = ["email", "id", "username"];
  if (!allowedFields.includes(attr)) {
    throw new Error("Sorry, Invalid attribute to get user");
  }
  const rows = await pool.query(
    `SELECT * FROM users WHERE ${attr} = $1`,
    [value]
  );
  return rows;
}

// PENDING EMAIL FUNCTIONS
export async function updatePendingEmail(userId: number, pendingEmail: string, token: string) {
  const { rows } = await pool.query(
    `UPDATE users SET pending_email = $1, pending_email_token = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [pendingEmail, token, userId]
  );
  return rows[0];
}

export async function getUserByPendingEmailToken(token: string) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE pending_email_token = $1`,
    [token]
  );
  return rows[0];
}

export async function confirmPendingEmail(userId: number) {
  const { rows } = await pool.query(
    `UPDATE users SET 
      email = pending_email, 
      pending_email = NULL, 
      pending_email_token = NULL, 
      is_verified = FALSE,
      verification_token = NULL,
      updated_at = NOW() 
    WHERE id = $1 
    RETURNING *`,
    [userId]
  );
  return rows[0];
}

export async function clearPendingEmail(userId: number) {
  const { rows } = await pool.query(
    `UPDATE users SET pending_email = NULL, pending_email_token = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId]
  );
  return rows[0];
}

