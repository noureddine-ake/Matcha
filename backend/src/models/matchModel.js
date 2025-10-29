import { pool } from '../config/config.js';

// suggested profiles 2
export const searchSuggestions2 = async (userId, filters) => {
  const query = `
  WITH user_location AS (
    SELECT latitude, longitude FROM profiles WHERE user_id = $1
  ),
  current_user_tags AS (
    SELECT tag_id FROM user_tags WHERE user_id = $1
  )
  SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    p.gender,
    p.biography,
    p.fame_rating,
    p.city,
    p.country,
    p.is_online,
    p.last_seen,
    EXTRACT(YEAR FROM AGE(p.birth_date)) as age,
    -- Calculate distance in km using Haversine formula
    ROUND(
      6371 * acos(
        cos(radians((SELECT latitude FROM user_location))) * 
        cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians((SELECT longitude FROM user_location))) + 
        sin(radians((SELECT latitude FROM user_location))) * 
        sin(radians(p.latitude))
      )
    ) as distance,
    -- Count common tags
    (SELECT COUNT(*) 
     FROM user_tags ut_current 
     WHERE ut_current.user_id = u.id 
     AND ut_current.tag_id IN (SELECT tag_id FROM current_user_tags)
    ) as common_tags,
    -- Get user's tags (using subquery instead of JOIN)
    (SELECT array_agg(DISTINCT t.name)
     FROM user_tags ut_tags
     INNER JOIN tags t ON ut_tags.tag_id = t.id
     WHERE ut_tags.user_id = u.id
    ) as tags,
    -- Get pictures
    (
      SELECT json_agg(
        json_build_object(
          'id', p.id,
          'photo_url', p.photo_url,
          'is_profile_picture', p.is_profile_picture
        )
      )
      FROM photos p
      WHERE p.user_id = u.id
    ) AS photos,
    -- Check if already liked
    EXISTS(SELECT 1 FROM likes WHERE liker_user_id = $1 AND liked_user_id = u.id) as already_liked,
    -- Check if they liked us
    EXISTS(SELECT 1 FROM likes WHERE liker_user_id = u.id AND liked_user_id = $1) as they_liked_us
  FROM users u
  INNER JOIN profiles p ON u.id = p.user_id
  WHERE u.id != $1
    AND u.is_verified = TRUE
    AND p.gender IS NOT NULL
    AND p.sexual_preference IS NOT NULL
    AND p.biography IS NOT NULL
    AND EXISTS(SELECT 1 FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE)
    -- Not blocked by current user or blocking current user
    AND NOT EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = $1 AND blocked_user_id = u.id)
    AND NOT EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = u.id AND blocked_user_id = $1)
    -- Not blocked by current user or blocking current user
    AND NOT EXISTS(SELECT 1 FROM likes WHERE liker_user_id = $1 AND liked_user_id = u.id)
    -- Apply gender filter
    ${filters.genderFilter}
    -- Apply mutual preference filter
    ${filters.mutualPreferenceFilter}
  GROUP BY u.id, u.username, u.first_name, u.last_name, p.gender, p.biography, 
           p.fame_rating, p.city, p.country, p.latitude, p.longitude, p.birth_date,
           p.is_online, p.last_seen
  HAVING 
    -- Distance filter
    ROUND(6371 * acos(
      cos(radians((SELECT latitude FROM user_location))) * 
      cos(radians(p.latitude)) * 
      cos(radians(p.longitude) - radians((SELECT longitude FROM user_location))) + 
      sin(radians((SELECT latitude FROM user_location))) * 
      sin(radians(p.latitude))
    )) <= $2
    -- Age filters
    ${
      filters.minAge
        ? `AND EXTRACT(YEAR FROM AGE(p.birth_date)) >= ${parseInt(
            filters.minAge
          )}`
        : ''
    }
    ${
      filters.maxAge
        ? `AND EXTRACT(YEAR FROM AGE(p.birth_date)) <= ${parseInt(
            filters.maxAge
          )}`
        : ''
    }
    -- Fame filters
    ${
      filters.minFame
        ? `AND p.fame_rating >= ${parseFloat(filters.minFame)}`
        : ''
    }
    ${
      filters.maxFame
        ? `AND p.fame_rating <= ${parseFloat(filters.maxFame)}`
        : ''
    }
  ${filters.orderByClause}
  LIMIT $3 OFFSET $4
`;

  const values = [
    userId,
    filters.maxDistance,
    parseInt(filters.limit),
    parseInt(filters.offset),
  ];
  const ret = await pool.query(query, values);
  return ret;
};

// suggested all matches
export const getAllMatches = async (data) => {
  const query = `
      SELECT 
      u.id,
      u.username,
      u.first_name,
      u.last_name,
      p.gender,
      p.sexual_preference,
      p.biography,
      p.city,
      p.country,
      p.fame_rating,
      p.last_seen,
      p.is_online,
      EXTRACT(YEAR FROM AGE(p.birth_date)) AS age,
      p.latitude,
      p.longitude,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', ph.id,
            'photo_url', ph.photo_url,
            'is_profile_picture', ph.is_profile_picture
          )
        ) FILTER (WHERE ph.id IS NOT NULL),
        '[]'
      ) AS photos,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', t.id,
            'name', t.name
          )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) AS tags
    FROM likes l1
    JOIN likes l2 
      ON l1.liker_user_id = l2.liked_user_id
      AND l1.liked_user_id = l2.liker_user_id
    JOIN users u ON u.id = l1.liked_user_id
    JOIN profiles p ON p.user_id = u.id
    LEFT JOIN photos ph ON ph.user_id = u.id
    LEFT JOIN user_tags ut ON ut.user_id = u.id
    LEFT JOIN tags t ON t.id = ut.tag_id
    WHERE l1.liker_user_id = $1  -- current user ID
    GROUP BY 
      u.id, u.username, u.first_name, u.last_name,
      p.gender, p.sexual_preference, p.biography, p.city, p.country,
      p.fame_rating, p.last_seen, p.is_online, p.birth_date, p.latitude, p.longitude
    ORDER BY p.fame_rating DESC
    LIMIT $2 OFFSET $3;
  `;
  const values = [data.userId, parseInt(data.limit), parseInt(data.offset)];
  const current = await pool.query(query, values);
  return current;
};

// suggested profiles data for matches
export const getProfileDataforMatches = async (userId) => {
  const query = `
    SELECT 
      p.gender,
      p.sexual_preference,
      p.latitude,
      p.longitude,
      p.birth_date,
      array_agg(DISTINCT t.id) as user_tag_ids
    FROM profiles p
    LEFT JOIN user_tags ut ON p.user_id = ut.user_id
    LEFT JOIN tags t ON ut.tag_id = t.id
    WHERE p.user_id = $1
    GROUP BY p.user_id, p.gender, p.sexual_preference, p.latitude, p.longitude, p.birth_date
  ;`;
  const values = [userId];
  const current = await pool.query(query, values);
  return current;
};

// get all likes for a user
export const getUserLikes = async (userId) => {
  const query = `
      SELECT 
      u.id,
      u.username,
      u.first_name,
      u.last_name,
      p.gender,
      p.sexual_preference,
      p.biography,
      p.city,
      p.country,
      p.fame_rating,
      p.last_seen,
      p.is_online,
      EXTRACT(YEAR FROM AGE(p.birth_date)) AS age,
      p.latitude,
      p.longitude,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', ph.id,
            'photo_url', ph.photo_url,
            'is_profile_picture', ph.is_profile_picture
          )
        ) FILTER (WHERE ph.id IS NOT NULL),
        '[]'
      ) AS photos,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', t.id,
            'name', t.name
          )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) AS tags
    FROM likes l
    JOIN users u ON u.id = l.liker_user_id
    JOIN profiles p ON p.user_id = u.id
    LEFT JOIN photos ph ON ph.user_id = u.id
    LEFT JOIN user_tags ut ON ut.user_id = u.id
    LEFT JOIN tags t ON t.id = ut.tag_id
    WHERE l.liked_user_id = $1
      AND NOT EXISTS (
        SELECT 1 
        FROM likes l2
        WHERE l2.liker_user_id = $1 
          AND l2.liked_user_id = l.liker_user_id
      )
    GROUP BY 
      u.id, u.username, u.first_name, u.last_name,
      p.gender, p.sexual_preference, p.biography, p.city, p.country,
      p.fame_rating, p.last_seen, p.is_online, p.birth_date, p.latitude, p.longitude;
  ;`;
  const values = [userId];
  const current = await pool.query(query, values);
  return current;
};
