// ======================================================
// this file contains all the models about profiles Table 
// ======================================================

import { pool } from '../config/config.js';

// Create a new profile
export const createProfile = async (profile) => {
  const query = `
    INSERT INTO profiles (user_id, gender, sexual_preference, biography, birth_date, fame_rating, latitude, longitude, city, country, is_online, last_seen)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *;
  `;
  const values = [
    profile.user_id,
    profile.gender || null,
    profile.sexual_preference || null,
    profile.biography || null,
    profile.birth_date || null,
    profile.fame_rating || 0,
    profile.latitude || null,
    profile.longitude || null,
    profile.city || null,
    profile.country || null,
    profile.is_online || false,
    profile.last_seen || null
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Check if a profile already exists for a user
export const checkExistedProfiles = async (user_id) => {
  const query = `SELECT * FROM profiles WHERE user_id = $1`;
  const { rows } = await pool.query(query, [user_id]);
  return rows.length > 0;
};

// Get profile by user ID
export const getProfileByUserId = async (user_id) => {
  const query = `SELECT * FROM profiles WHERE user_id = $1`;
  const { rows } = await pool.query(query, [user_id]);

  if (!rows.length) {
    console.log(`⚠️ No profile found for user_id: ${user_id}`);
    return null;
  }

  console.log(`✅ Profile found for user_id ${user_id}:`, rows[0]);
  return rows[0];
};

// Update a profile
export const updateProfile = async (user_id, profile) => {
  const query = `
    UPDATE profiles
    SET gender = $1,
        sexual_preference = $2,
        biography = $3,
        birth_date = $4,
        fame_rating = $5,
        latitude = $6,
        longitude = $7,
        city = $8,
        country = $9,
        is_online = $10,
        last_seen = $11,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $12
    RETURNING *;
  `;
  const values = [
    profile.gender || null,
    profile.sexual_preference || null,
    profile.biography || null,
    profile.birth_date || null,
    profile.fame_rating || 0,
    profile.latitude || null,
    profile.longitude || null,
    profile.city || null,
    profile.country || null,
    profile.is_online || false,
    profile.last_seen || null,
    user_id
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Delete a profile
export const deleteProfile = async (user_id) => {
  const query = `DELETE FROM profiles WHERE user_id = $1 RETURNING *;`;
  const { rows } = await pool.query(query, [user_id]);
  return rows[0];
};

// Set online/offline status
export const setOnlineStatus = async (user_id, is_online) => {
  const query = `
    UPDATE profiles
    SET is_online = $1,
        last_seen = CURRENT_TIMESTAMP
    WHERE user_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [is_online, user_id]);
  return rows[0];
};



