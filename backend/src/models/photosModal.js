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
    console.log(rows.lenght);
    return rows.length;
  };
  