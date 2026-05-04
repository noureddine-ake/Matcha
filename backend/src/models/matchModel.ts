import { UserTags, Photos, Blocks, Likes } from '../../database/entities/index.js';
import { Profiles } from '../../database/entities/profiles.entity.js';
import { User } from '../../database/entities/users.entity.js';
import { Raw } from '../../database/raw.js';

// -- Interfaces for TypeScript type safety============

interface SuggestionFilters {
  maxDistance: number;
  minAge?: number;
  maxAge?: number;
  minFame?: number;
  maxFame?: number;
  sortBy: string;
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

export const searchSuggestions = async (
  userId: number,
  filters: SuggestionFilters
): Promise<{ rows: SuggestionResult[] }> => {
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
    // .where('u.is_verified', true)
    // .where('p.gender', null, 'not null')
    .where('p.latitude', null, 'not null')
    .where('p.longitude', null, 'not null')
    .run();

  let users = usersResult.rows as any[];

  console.log('Users:', userId, users);

  // 1. Filter out blocked/blocking users
  users = users.filter(u => !blockedUserIds.has(u.id));

  console.log('Users after block filtering:', users.length);
  // 2. Filter out already liked users
  users = users.filter(u => !likedUserIds.has(u.id));

  console.log('Users after like filtering:', users.length);
  // 3. Distance filter
  const maxDist = parseInt(filters.maxDistance as any) || 500;
  users = users.filter(u => u.distance <= maxDist);

  console.log('Users after distance filtering:', users.length);
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

  console.log('Users after gender and preference filtering:', users.length);
  // 5. Age and Fame filtering
  if (filters.minAge) users = users.filter(u => parseInt(u.age) >= (filters.minAge || 0));
  if (filters.maxAge) users = users.filter(u => parseInt(u.age) <= (filters.maxAge || 1000));
  console.log('Users after age filtering:', users.length, filters.minAge, filters.maxAge);
  if (filters.minFame) users = users.filter(u => u.fame_rating >= (filters.minFame || 0));
  if (filters.maxFame) users = users.filter(u => u.fame_rating <= (filters.maxFame || 5));

  console.log('Users after fame filtering:', users.length);
  // 6. Batch fetch tags and photos``
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
  // Re-implement sorting in memory based on sortBy logic
  if (filters.sortBy == 'fame') {
    users.sort((a, b) => b.fame_rating - a.fame_rating || a.distance - b.distance);
  } else if (filters.sortBy == 'age') {
    users.sort((a, b) => a.age - b.age || a.distance - b.distance);
  } else if (filters.sortBy == 'tags') {
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

// suggested all matches
export const getAllMatches = async (data: any) => {
  const userId = data.userId;
  const limit = parseInt(data.limit) || 20;
  const offset = parseInt(data.offset) || 0;

  const matchesResult = await Likes.select(['l1.liked_user_id'])
    .from('likes l1')
    .join('INNER', 'likes l2', 'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
    .where('l1.liker_user_id', userId)
    .run();

  const matchIds = matchesResult.rows.map((r: any) => r.liked_user_id);

  if (matchIds.length === 0) {
    return { rows: [] };
  }

  const usersResult = await User.select([
    'u.id',
    'u.username',
    'u.first_name',
    'u.last_name',
    'p.gender',
    'p.sexual_preference',
    'p.biography',
    'p.city',
    'p.country',
    'p.fame_rating',
    'p.last_seen',
    'p.is_online',
    'p.latitude',
    'p.longitude',
    new Raw(`EXTRACT(YEAR FROM AGE(p.birth_date)) as age`),
  ])
    .from('users u')
    .join('INNER', 'profiles p', 'u.id = p.user_id')
    .whereIn('u.id', matchIds)
    .run();

  let users = usersResult.rows as any[];

  users.sort((a, b) => Number(b.fame_rating) - Number(a.fame_rating));

  const paginatedUsers = users.slice(offset, offset + limit);

  if (paginatedUsers.length === 0) {
    return { rows: [] };
  }

  const paginatedIds = paginatedUsers.map(u => u.id);

  const allPhotos = await Photos.select(['id', 'user_id', 'photo_url', 'is_profile_picture'])
    .whereIn('user_id', paginatedIds)
    .run().then(res => res.rows);

  const photosByUserId = allPhotos.reduce((acc: any, photo: any) => {
    if (!acc[photo.user_id]) acc[photo.user_id] = [];
    acc[photo.user_id].push({
      id: photo.id,
      photo_url: photo.photo_url,
      is_profile_picture: photo.is_profile_picture
    });
    return acc;
  }, {} as Record<number, any[]>);

  const allTags = await UserTags.select(['ut.user_id', 't.name', 't.id'])
    .from('user_tags ut')
    .join('INNER', 'tags t', 'ut.tag_id = t.id')
    .whereIn('ut.user_id', paginatedIds)
    .run().then(res => res.rows);

  const tagsByUserId = allTags.reduce((acc: any, tag: any) => {
    if (!acc[tag.user_id]) acc[tag.user_id] = [];
    acc[tag.user_id].push({
      id: tag.id,
      name: tag.name
    });
    return acc;
  }, {} as Record<number, any[]>);

  paginatedUsers.forEach(u => {
    u.photos = photosByUserId[u.id] || [];
    u.tags = tagsByUserId[u.id] || [];
    u.age = Number(u.age);
  });

  return { rows: paginatedUsers };
};

// suggested profiles data for matches
export const getProfileDataforMatches = async (userId: number) => {
  // 1. Fetch profile data with ORM
  const profileResult = await Profiles.select([
    'gender',
    'sexual_preference',
    'latitude',
    'longitude',
    'birth_date'
  ])
    .where('user_id', userId)
    .run();

  if (!profileResult.rows || profileResult.rows.length === 0) {
    return { rows: [] };
  }

  const profile = profileResult.rows[0];

  // 2. Fetch tag IDs for user with ORM
  const userTagsResult = await UserTags.select(['tag_id'])
    .where('user_id', userId)
    .run();

  const tagIds = userTagsResult.rows.map((t: any) => t.tag_id);

  // 3. Combine and return profile data with tag IDs
  return {
    rows: [{
      gender: profile.gender,
      sexual_preference: profile.sexual_preference,
      latitude: profile.latitude,
      longitude: profile.longitude,
      birth_date: profile.birth_date,
      user_tag_ids: tagIds
    }]
  };
};

// get all likes for a user
export const getUserLikes = async (userId: number) => {
  // 1. Fetch all user IDs that liked current user
  const likersResult = await Likes.select(['liker_user_id'])
    .where('liked_user_id', userId)
    .run();
  
  const likerIds = likersResult.rows.map((r: any) => r.liker_user_id);

  if (likerIds.length === 0) {
    return { rows: [] };
  }

  // 2. Identify mutual matches to exclude
  const mutualMatches = await Likes.select(['l1.liked_user_id'])
    .from('likes l1')
    .join('INNER', 'likes l2', 'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
    .where('l1.liker_user_id', userId)
    .run();

  const mutualMatchIds = new Set(mutualMatches.rows.map((r: any) => r.liked_user_id));

  // 3. Filter out mutual likers in TypeScript
  const nonMutualLikerIds = likerIds.filter((id: number) => !mutualMatchIds.has(id));

  if (nonMutualLikerIds.length === 0) {
    return { rows: [] };
  }

  // 4. Fetch non-mutual user profiles with ORM + Raw age extraction
  const usersResult = await User.select([
    'u.id',
    'u.username',
    'u.first_name',
    'u.last_name',
    'p.gender',
    'p.sexual_preference',
    'p.biography',
    'p.city',
    'p.country',
    'p.fame_rating',
    'p.last_seen',
    'p.is_online',
    new Raw(`EXTRACT(YEAR FROM AGE(p.birth_date)) as age`),
    'p.latitude',
    'p.longitude',
  ])
    .from('users u')
    .join('INNER', 'profiles p', 'u.id = p.user_id')
    .whereIn('u.id', nonMutualLikerIds)
    .run();

  let users = usersResult.rows as any[];

  // 5. Sort by fame_rating DESC
  users.sort((a, b) => Number(b.fame_rating) - Number(a.fame_rating));

  // 6. Apply pagination (defaults to no limit/no offset for now as per original raw SQL)
  const paginatedUsers = users;

  const paginatedIds = paginatedUsers.map(u => u.id);

  // 7. Batch fetch photos for paginated users
  const allPhotos = await Photos.select(['id', 'user_id', 'photo_url', 'is_profile_picture'])
    .whereIn('user_id', paginatedIds)
    .run().then(res => res.rows);

  const photosByUserId = allPhotos.reduce((acc: any, photo: any) => {
    if (!acc[photo.user_id]) acc[photo.user_id] = [];
    acc[photo.user_id].push({
      id: photo.id,
      photo_url: photo.photo_url,
      is_profile_picture: photo.is_profile_picture
    });
    return acc;
  }, {} as Record<number, any[]>);

  // 8. Batch fetch tags for paginated users (return {id, name} only)
  const allTags = await UserTags.select(['ut.user_id', 't.name', 't.id'])
    .from('user_tags ut')
    .join('INNER', 'tags t', 'ut.tag_id = t.id')
    .whereIn('ut.user_id', paginatedIds)
    .run().then(res => res.rows);

  const tagsByUserId = allTags.reduce((acc: any, tag: any) => {
    if (!acc[tag.user_id]) acc[tag.user_id] = [];
    acc[tag.user_id].push({
      id: tag.id,
      name: tag.name
    });
    return acc;
  }, {} as Record<number, any[]>);

  // 9. Combine tags/photos with user objects
  paginatedUsers.forEach(u => {
    u.photos = photosByUserId[u.id] || [];
    u.tags = tagsByUserId[u.id] || [];
    u.age = Number(u.age);
  });

  // 10. Return {rows: paginatedUsers}
  return { rows: paginatedUsers };
};

/**
 * Get total number of matches for a user
 * @param {number} userId - ID of the user
 * @returns {Promise<number>} Number of matches
 */
export const getMatchesCount = async (userId: number) => {
  // Count mutual matches via ORM with complex JOIN
  const result = await Likes.select(['COUNT(*) as total_matches'])
    .from('likes l1')
    .join('INNER', 'likes l2', 'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
    .where('l1.liker_user_id', userId)
    .run();

  return parseInt(result.rows[0].total_matches) || 0;
};
