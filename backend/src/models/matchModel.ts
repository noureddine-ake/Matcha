import { UserTags, Photos, Blocks, Likes, Tags } from '../../database/entities/index.js';
import { Profiles } from '../../database/entities/profiles.entity.js';
import { User } from '../../database/entities/users.entity.js';
import { Raw } from '../../database/raw.js';
import { pool } from '../config/config.js';

// -- Interfaces for TypeScript type safety============

interface SuggestionFilters {
  maxDistance: number;
  minAge?: number;
  maxAge?: number;
  minFame?: number;
  maxFame?: number;
  genderFilter: string;
  mutualPreferenceFilter: string;
  orderByClause: string;
  limit?: number;
  offset?: number;
}

interface SuggestionResult {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  gender: string;
  biography: string;
  fame_rating: number;
  city: string;
  country: string;
  is_online: boolean;
  last_seen: Date;
  latitude: number;
  longitude: number;
  age: number;
  distance: number;
  common_tags: number;
  tags: string[] | null;
  photos: Array<{ id: number; photo_url: string; is_profile_picture: boolean }> | null;
  already_liked: boolean;
  they_liked_us: boolean;
  sexual_preference: string;
}

// -- Interfaces for TypeScript type safety============

// suggested profiles 2

export const searchSuggestions2 = async (
  userId: number,
  filters: SuggestionFilters
): Promise<any> => {
  const { latitude: userLat, longitude: userLon } = await Profiles
    .select(['latitude', 'longitude']).where('user_id', userId).run()
    .then(result => result.rows[0]) || { latitude: null, longitude: null };

  if (userLat === null || userLon === null) {
    throw new Error('User location not found');
  }

  const currentUser = await User.select(['u.id', 'p.sexual_preference',
    'u.username', 'u.first_name', 'u.last_name', 'p.gender',
    'p.biography', 'p.fame_rating', 'p.city', 'p.country',
    'p.is_online', 'p.last_seen', 'p.latitude', 'p.longitude', 'p.birth_date'
  ]).from('users u')
    .join('INNER', 'profiles p', 'u.id = p.user_id')
    .where('u.id', userId)
    .run().then(result => {
      return result.rows[0] ?? null;
    })

  if (!currentUser) {
    throw new Error('Current user not found');
  }

  // Fetch blocked users and users who blocked current user
  const blocks = await Blocks.select(['*'])
    .where('blocker_user_id', userId)
    .run().then(res => res.rows);
  const blocks2 = await Blocks.select(['*'])
    .where('blocked_user_id', userId)
    .run().then(res => res.rows);
  const blockedUserIds = new Set([...blocks, ...blocks2].flatMap((b: any) => [b.blocker_user_id, b.blocked_user_id]));

  // Fetch users already liked by current user
  const userLikes = await Likes.select(['liked_user_id'])
    .where('liker_user_id', userId)
    .run().then(res => res.rows);
  const likedUserIds = new Set(userLikes.map((l: any) => l.liked_user_id));

  // Fetch users who liked current user
  const theyLikedUs = await Likes.select(['liker_user_id'])
    .where('liked_user_id', userId)
    .run().then(res => res.rows);
  const theyLikedUsIds = new Set(theyLikedUs.map((l: any) => l.liker_user_id));

  // Fetch current user tags
  const currentUserTags = await UserTags.select(['tag_id'])
    .where('user_id', userId)
    .run().then(res => res.rows);
  const currentUserTagIds = new Set(currentUserTags.map((t: any) => t.tag_id));

  const usersResult = await User.select(['u.id',
    'u.username', 'u.first_name', 'u.last_name', 'p.gender', 'p.sexual_preference',
    'p.biography', 'p.fame_rating', 'p.city', 'p.country',
    'p.is_online', 'p.last_seen', 'p.latitude', 'p.longitude',
    new Raw(` ROUND( 6371 * acos(
      cos(radians(${userLat})) * cos(radians(p.latitude)) * 
      cos(radians(p.longitude) - radians(${userLon})) + 
      sin(radians(${userLat})) * sin(radians(p.latitude)))
    ) as distance`),
    new Raw(`EXTRACT(YEAR FROM AGE(p.birth_date)) as age`),
  ])
    .from('users u')
    .join('INNER', 'profiles p', 'u.id = p.user_id')
    .where('u.id', userId, '!=')
    .where('u.is_verified', true)
    .where('p.gender', null, 'not null')
    .where('p.latitude', null, 'not null')
    .where('p.longitude', null, 'not null')
    .run();

  let users = usersResult.rows as any[];

  // 1. Filter out blocked/blocking users
  users = users.filter(u => !blockedUserIds.has(u.id));

  // 2. Filter out already liked users
  users = users.filter(u => !likedUserIds.has(u.id));

  // 3. Distance filter
  const maxDist = parseInt(filters.maxDistance as any) || 500;
  users = users.filter(u => u.distance <= maxDist);

  // 4. Gender and preference filtering
  users = users.filter(u => {
    // Current user preference check
    if (currentUser.sexual_preference === 'male' && u.gender !== 'male') return false;
    if (currentUser.sexual_preference === 'female' && u.gender !== 'female') return false;

    // Mutual preference check
    if (u.sexual_preference === 'male' && currentUser.gender !== 'male') return false;
    if (u.sexual_preference === 'female' && currentUser.gender !== 'female') return false;

    return true;
  });

  // 5. Age and Fame filtering
  if (filters.minAge) users = users.filter(u => u.age >= filters.minAge!);
  if (filters.maxAge) users = users.filter(u => u.age <= filters.maxAge!);
  if (filters.minFame) users = users.filter(u => u.fame_rating >= filters.minFame!);
  if (filters.maxFame) users = users.filter(u => u.fame_rating <= filters.maxFame!);

  // 6. Batch fetch tags and photos
  const candidateIds = users.map(u => u.id);
  if (candidateIds.length > 0) {
    const allTags = await UserTags.select(['ut.user_id', 't.name', 't.id'])
      .from('user_tags ut')
      .join('INNER', 'tags t', 'ut.tag_id = t.id')
      .whereIn('ut.user_id', candidateIds)
      .run().then(res => res.rows);

    const allPhotos = await Photos.select(['id', 'user_id', 'photo_url', 'is_profile_picture'])
      .whereIn('user_id', candidateIds)
      .run().then(res => res.rows);

    const tagsByUserId = allTags.reduce((acc: any, tag: any) => {
      if (!acc[tag.user_id]) acc[tag.user_id] = [];
      acc[tag.user_id].push(tag);
      return acc;
    }, {} as Record<number, any[]>);

    const photosByUserId = allPhotos.reduce((acc: any, photo: any) => {
      if (!acc[photo.user_id]) acc[photo.user_id] = [];
      acc[photo.user_id].push(photo);
      return acc;
    }, {} as Record<number, any[]>);

    users.forEach(u => {
      u.tags = tagsByUserId[u.id] || [];
      u.photos = photosByUserId[u.id] || [];
      u.common_tags = u.tags.filter((t: any) => currentUserTagIds.has(t.id)).length;
      u.already_liked = false;
      u.they_liked_us = theyLikedUsIds.has(u.id);
    });

    // 7. Filter out users without profile picture
    users = users.filter(u => u.photos.some((p: any) => p.is_profile_picture));
  }

  // 8. Sorting
  // We already have some sorting logic passed from controller, but since we are in TS, let's just use it if possible or implement here.
  // The controller sends an orderByClause which is for SQL. Since we have all users in memory, we can sort here.
  // But wait, the controller expects result.rows.
  
  // Re-implement sorting in memory based on orderByClause logic
  if (filters.orderByClause.includes('fame')) {
    users.sort((a, b) => b.fame_rating - a.fame_rating || a.distance - b.distance);
  } else if (filters.orderByClause.includes('age')) {
    users.sort((a, b) => a.age - b.age || a.distance - b.distance);
  } else if (filters.orderByClause.includes('common_tags')) {
    users.sort((a, b) => b.common_tags - a.common_tags || a.distance - b.distance);
  } else {
    users.sort((a, b) => a.distance - b.distance || b.fame_rating - a.fame_rating);
  }

  // 9. Pagination
  const limit = parseInt(filters.limit as any) || 20;
  const offset = parseInt(filters.offset as any) || 0;
  const paginatedUsers = users.slice(offset, offset + limit);

  return { rows: paginatedUsers };
}

// export const searchSuggestions2 = async (userId, filters) => {
//   const query = `
//   WITH current_user_location AS (
//     SELECT latitude, longitude FROM profiles WHERE user_id = $1
//   ),
//   current_user_tags AS (
//     SELECT tag_id FROM user_tags WHERE user_id = $1
//   )
//   SELECT 
//     u.id,
//     u.username,
//     u.first_name,
//     u.last_name,
//     p.gender,
//     p.biography,
//     p.fame_rating,
//     p.city,
//     p.country,
//     p.is_online,
//     p.last_seen,
//     p.latitude,
//     p.longitude,
//     EXTRACT(YEAR FROM AGE(p.birth_date)) as age,
//     -- Calculate distance in km using Haversine formula
//     ROUND(
//       6371 * acos(
//         cos(radians(curr.latitude)) * cos(radians(p.latitude)) * 
//         cos(radians(p.longitude) - radians(curr.longitude)) + 
//         sin(radians(curr.latitude)) * sin(radians(p.latitude))
//       )
//     ) as distance,
//     -- Count common tags
//     (SELECT COUNT(*) 
//      FROM user_tags ut_current 
//      WHERE ut_current.user_id = u.id 
//      AND ut_current.tag_id IN (SELECT tag_id FROM current_user_tags)
//     ) as common_tags,
//     -- Get user's tags
//     (SELECT array_agg(DISTINCT t.name)
//      FROM user_tags ut_tags
//      INNER JOIN tags t ON ut_tags.tag_id = t.id
//      WHERE ut_tags.user_id = u.id
//     ) as tags,
//     -- Get pictures
//     (
//       SELECT json_agg(
//         json_build_object(
//           'id', ph.id,
//           'photo_url', ph.photo_url,
//           'is_profile_picture', ph.is_profile_picture
//         )
//       )
//       FROM photos ph
//       WHERE ph.user_id = u.id
//     ) AS photos,
//     -- Check if already liked
//     EXISTS(SELECT 1 FROM likes WHERE liker_user_id = $1 AND liked_user_id = u.id) as already_liked,
//     -- Check if they liked us
//     EXISTS(SELECT 1 FROM likes WHERE liker_user_id = u.id AND liked_user_id = $1) as they_liked_us
//   FROM users u
//   INNER JOIN profiles p ON u.id = p.user_id
//   CROSS JOIN current_user_location curr
//   WHERE u.id != $1
//     AND u.is_verified = TRUE
//     AND p.gender IS NOT NULL
//     AND p.sexual_preference IS NOT NULL
//     AND p.latitude IS NOT NULL
//     AND p.longitude IS NOT NULL
//     AND curr.latitude IS NOT NULL
//     AND curr.longitude IS NOT NULL
//     AND EXISTS(SELECT 1 FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE)
//     -- Not blocked by current user or blocking current user
//     AND NOT EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = $1 AND blocked_user_id = u.id)
//     AND NOT EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = u.id AND blocked_user_id = $1)
//     -- Not already liked
//     AND NOT EXISTS(SELECT 1 FROM likes WHERE liker_user_id = $1 AND liked_user_id = u.id)
//     -- Distance filter in WHERE
//     AND (
//       6371 * acos(
//         cos(radians(curr.latitude)) * cos(radians(p.latitude)) * 
//         cos(radians(p.longitude) - radians(curr.longitude)) + 
//         sin(radians(curr.latitude)) * sin(radians(p.latitude))
//       )
//     ) <= $2
//     -- Apply gender filter
//     ${filters.genderFilter}
//     -- Apply mutual preference filter
//     ${filters.mutualPreferenceFilter}
//     -- Age filters
//     ${
//       filters.minAge
//         ? `AND EXTRACT(YEAR FROM AGE(p.birth_date)) >= ${parseInt(filters.minAge)}`
//         : ''
//     }
//     ${
//       filters.maxAge
//         ? `AND EXTRACT(YEAR FROM AGE(p.birth_date)) <= ${parseInt(filters.maxAge)}`
//         : ''
//     }
//     -- Fame filters
//     ${
//       filters.minFame
//         ? `AND p.fame_rating >= ${parseFloat(filters.minFame)}`
//         : ''
//     }
//     ${
//       filters.maxFame
//         ? `AND p.fame_rating <= ${parseFloat(filters.maxFame)}`
//         : ''
//     }
//   GROUP BY u.id, u.username, u.first_name, u.last_name, p.gender, p.biography, 
//            p.fame_rating, p.city, p.country, p.latitude, p.longitude, p.birth_date,
//            p.is_online, p.last_seen, curr.latitude, curr.longitude
//   ${filters.orderByClause}
//   LIMIT $3 OFFSET $4
// `;

//   const values = [
//     userId,
//     parseInt(filters.maxDistance) || 500,
//     parseInt(filters.limit) || 20,
//     parseInt(filters.offset) || 0,
//   ];

//   const ret = await pool.query(query, values);

//   return ret;
// };

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
    WHERE l1.liker_user_id = $1
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

/**
 * Get total number of matches for a user
 * @param {number} userId - ID of the user
 * @returns {Promise<number>} Number of matches
 */
export const getMatchesCount = async (userId) => {
  const query = `
    SELECT COUNT(*)::int AS total_matches
    FROM likes l1
    JOIN likes l2 
      ON l1.liker_user_id = l2.liked_user_id
      AND l1.liked_user_id = l2.liker_user_id
    WHERE l1.liker_user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0].total_matches;
};
