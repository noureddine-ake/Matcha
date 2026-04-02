import { pool } from '../config/config.js';

// suggested profiles
export const searchSuggestions = async (profile) => {
  console.log("id:", profile.userId, "sp:", profile.sexual_preference);
  const query = `
  SELECT u.id, u.first_name, u.last_name, u.username, p.gender, p.sexual_preference, p.biography, p.city, p.country, p.fame_rating,
    COALESCE(json_agg(DISTINCT jsonb_build_object('photo_url', ph.photo_url, 'is_profile_picture', ph.is_profile_picture)) 
        FILTER (WHERE ph.id IS NOT NULL), '[]') AS photos,
    COALESCE(json_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
    FROM users u
    JOIN profiles p ON p.user_id = u.id
    LEFT JOIN photos ph ON ph.user_id = u.id
    LEFT JOIN user_tags ut ON ut.user_id = u.id
    LEFT JOIN tags t ON t.id = ut.tag_id
    WHERE u.id != $1
    AND u.id NOT IN (
        SELECT liked_user_id FROM likes WHERE liker_user_id = $1
    )
    AND u.id NOT IN (
        SELECT blocked_user_id FROM blocks WHERE blocker_user_id = $1
        UNION
        SELECT blocker_user_id FROM blocks WHERE blocked_user_id = $1
    )
    AND p.gender = $2
    GROUP BY u.id, p.gender, p.sexual_preference, p.biography, p.city, p.country, p.fame_rating
    LIMIT 20;
  `;
  const values = [
    profile.userId,
    profile.sexual_preference,
  ]
  const { rows } = await pool.query(query, values);
  return rows;
};
