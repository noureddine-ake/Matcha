// ======================================================
// this file contains all the models about photos Table
// ======================================================

import { pool } from '../config/config.js';

export const createPhoto = async (photo) => {
  const query = `INSERT INTO photos (user_id, photo_url, is_profile_picture)
    VALUES ($1, $2, $3)
    RETURNING *;`;
  const values = [
    photo.user_id,
    photo.photo_url,
    photo.is_profile_picture,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const isPhotoExisted = async (url) => {
    const query = `SELECT * FROM photos WHERE photo_url = $1`;
    const {rows} = await pool.query(query, [url]);
    return rows.length;
};

export const getPhotosByUserId = async (user_id) => {
  const query = `SELECT * FROM photos WHERE user_id = $1`;
  const { rows } = await pool.query(query, [user_id]);
  return rows;
}

export const deletePhotoById = async (photo_id) => {
  const query = `DELETE FROM photos WHERE id = $1 RETURNING *;`;
  const { rows } = await pool.query(query, [photo_id]);
  return rows[0];
}

// Get current profile picture of a user
export const getProfilePictureByUserId = async (user_id) => {
  const query = `SELECT photo_url FROM photos WHERE user_id = $1 AND is_profile_picture = true`;
  const result = await pool.query(query, [user_id]);
  return result; // returns full { rows, rowCount } so .rows.length works
};

// Delete current profile picture of a user
export const deleteProfilePictureByUserId = async (user_id) => {
  // Get the current profile picture first
  const selectQuery = `SELECT * FROM photos WHERE user_id = $1 AND is_profile_picture = true`;
  const { rows } = await pool.query(selectQuery, [user_id]);

  if (rows.length === 0) return null; // no profile picture exists

  const oldPhoto = rows[0];

  // Delete it from DB
  await pool.query(
    `DELETE FROM photos WHERE user_id = $1 AND is_profile_picture = true`,
    [user_id]
  );

  return oldPhoto; // return info of deleted photo (id, photo_url, etc.)
};

// Get a specific gallery photo by its ID for a user
export async function getGalleryPhotoById(photoId, userId) {
  const result = await pool.query(
    'SELECT photo_url FROM photos WHERE id = $1 AND user_id = $2 AND is_profile_picture = false',
    [photoId, userId]
  );

  if (result.rows.length === 0) {
    return null; // Not found
  }

  return result.rows[0]; // return the photo object
}

