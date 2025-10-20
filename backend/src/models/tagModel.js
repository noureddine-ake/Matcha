// ===============================================================
// Models for tags & user_tags tables (CRUD complete)
// ===============================================================

import { pool } from '../config/config.js';

// ----------------------
// Tags Table CRUD
// ----------------------

// Create a new tag
export const createTag = async (tag) => {
  const query = `
    INSERT INTO tags (name, created_at)
    VALUES ($1, $2)
    RETURNING *
  `;
  const values = [tag.name, tag.create_at];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Get tag by name
export const getTagByName = async (tagname) => {
  const query = `SELECT * FROM tags WHERE name = $1`;
  const { rows } = await pool.query(query, [tagname]);
  return rows[0];
};

// Get tag by id
export const getTagById = async (tagId) => {
  const query = `SELECT * FROM tags WHERE id = $1`;
  const { rows } = await pool.query(query, [tagId]);
  return rows[0];
};

// Get all tags
export const getAllTags = async () => {
  const query = `SELECT * FROM tags ORDER BY name`;
  const { rows } = await pool.query(query);
  return rows;
};

// Update tag
export const updateTag = async (tagId, newName) => {
  const query = `
    UPDATE tags
    SET name = $1
    WHERE id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(query, [newName, tagId]);
  return rows[0];
};

// Delete tag
export const deleteTag = async (tagId) => {
  const query = `DELETE FROM tags WHERE id = $1 RETURNING *`;
  const { rows } = await pool.query(query, [tagId]);
  return rows[0];
};

// ----------------------
// User_Tags Table CRUD
// ----------------------

// Create a user_tag
export const createUserTag = async (user_tags) => {
  const query = `
    INSERT INTO user_tags (user_id, tag_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  const values = [user_tags.user_id, user_tags.tag_id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Check if user_tag exists
export const isUserTagExisted = async (user_tags) => {
  const query = `
    SELECT * FROM user_tags
    WHERE user_id = $1 AND tag_id = $2
  `;
  const { rows } = await pool.query(query, [user_tags.user_id, user_tags.tag_id]);
  return rows[0];
};

// Get all tags for a user
export const getUserTags = async (user_id) => {
  const query = `
    SELECT t.id, t.name
    FROM user_tags ut
    JOIN tags t ON ut.tag_id = t.id
    WHERE ut.user_id = $1
  `;
  const { rows } = await pool.query(query, [user_id]);
  return rows;
};

// Delete a user_tag
export const deleteUserTag = async (user_tags) => {
  const query = `
    DELETE FROM user_tags
    WHERE user_id = $1 AND tag_id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(query, [user_tags.user_id, user_tags.tag_id]);
  return rows[0];
};

// Delete all tags for a user
export const deleteAllUserTags = async (user_id) => {
  const query = `
    DELETE FROM user_tags
    WHERE user_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [user_id]);
  return rows;
};
