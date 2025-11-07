import { pool } from '../config/config.js';

// Record a profile view (viewer_id → viewed_id)
export const recordProfileView = async (viewerId, viewedId) => {
  const query = `
    INSERT INTO profile_views (viewer_user_id, viewed_user_id, viewed_at)
    VALUES ($1, $2, NOW())
  `;
  await pool.query(query, [viewerId, viewedId]);
};

// Optional: count how many times a profile was viewed
export const getProfileViewCount = async (userId) => {
  const query = `
    SELECT COUNT(*) AS views
    FROM profile_views
    WHERE viewed_user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].views, 10);
};



// Fetch all unique viewers (latest view per viewer)
// Fetch all unique viewers (latest view per viewer) + profile picture
// import { pool } from '../config/config.js';

// Fetch all unique viewers (latest view per viewer) + profile picture
export const getAllUniqueProfileViewers = async (userId) => {
  const query = `
    SELECT DISTINCT ON (pv.viewer_user_id)
           u.id,
           u.username,
           u.first_name,
           u.last_name,
           u.completed_profile,
           p.photo_url AS profile_picture,
           pv.viewed_at
    FROM profile_views pv
    JOIN users u ON pv.viewer_user_id = u.id
    LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_picture = TRUE
    WHERE pv.viewed_user_id = $1
    ORDER BY pv.viewer_user_id, pv.viewed_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
};
