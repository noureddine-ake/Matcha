// ===============================================================
// this file contains all the models about tags & user_tags Tables 
// ===============================================================

import { pool } from '../config/config.js';

export const createTag = async (tag) => {
    const query = `INSERT INTO tags (name, created_at)
    VALUES ($1, $2)
    RETURNING *`;
    const values = [tag.name, tag.create_at]
    const {rows} = await pool.query(query, values);
    return rows[0];
}

export const getTagByName = async (tagname) => {
    const query = `SELECT * FROM tags WHERE name = $1`;
    const {rows} = await pool.query(query, [tagname]);
    return rows[0];
}

export const createUserTag = async (user_tags) => {
    const query = `INSERT INTO user_tags (user_id, tag_id)
    VALUES ($1, $2)
    RETURNING *`;
    const values = [user_tags.user_id, user_tags.tag_id]
    const {rows} = await pool.query(query, values);
    return rows[0];
}

export const isUserTagExisted = async (user_tags) => {
    const query = `SELECT * FROM user_tags WHERE user_id = $1 AND tag_id = $2`;
    const {rows} = await pool.query(query, [user_tags.user_id, user_tags.tag_id]);
    return rows[0];
}
