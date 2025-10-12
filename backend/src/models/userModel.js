// ====================================================
// this file contains all the models about users Tables
// ====================================================


import { pool } from '../config/config.js';

// CREATE
export async function createUser(user) {
  const query = `
    INSERT INTO users (email, username, first_name, last_name, password_hash)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [user.email, user.username, user.first_name, user.last_name, user.password_hash];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// READ
export async function getUserById(id) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id=$1`, [id]);
  return rows[0];
}

export async function getUserByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
  return rows[0];
}

// UPDATE
export async function updateUser(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  const setString = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');

  const { rows } = await pool.query(
    `UPDATE users SET ${setString}, updated_at=NOW() WHERE id=$${keys.length + 1} RETURNING *`,
    [...values, id]
  );

  return rows[0];
}

// DELETE
export async function deleteUser(id) {
  await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
  return true;
}

// LIST ALL USERS
export async function getAllUsers() {
  const { rows } = await pool.query(`SELECT * FROM users ORDER BY id ASC`);
  return rows;
}

// GET A USER BY EMAIL
export async function getUserAttr(attr, value) {
  const allowedFields = ["email", "id", "username"]
  if (! allowedFields.includes(attr)) {
    throw new Error("Sorry, Invalid attrebute to get user");
  }
  const { rows, rowCount } = await pool.query(`SELECT * FROM users WHERE ${attr} = $1`, value);
  return { rows, rowCount };
}
