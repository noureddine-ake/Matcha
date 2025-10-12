// ======================================================
// this file contains all the models about profiles Table 
// ======================================================

import { pool } from '../config/config.js';

export const createProfile = async (profile) => {
  const query = `INSERT INTO profiles (user_id, gender, sexual_preference, biography)
    VALUES ($1, $2, $3, $4)
    RETURNING *;`;
  const values = [
    profile.id,
    profile.gender,
    profile.sexual_preference,
    profile.biography,
  ];
  const {rows} = await pool.query(query, values);
  return rows[0];
};

export const checkExistedProfiles = async (id) => {
  const query = `SELECT * FROM profiles WHERE user_id = $1`;
  const {rows} = await pool.query(query, [id]);
  console.log(rows.lenght);
  return rows.length;
};
