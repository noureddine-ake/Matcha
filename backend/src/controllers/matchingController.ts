import { Request, Response } from 'express';
import { pool } from '../config/config.js';
import {
  searchSuggestions,
  getProfileDataforMatches,
  getAllMatches,
} from '../models/matchModel.js';
import { createAndSendNotification } from '../utils/notificationHelper.js';

export const notificationTypes = {
  LIKE: 'like',
  MATCH: 'match',
  UNLIKE: 'unlike',
  VIEW: 'view',
  MESSAGE: 'message',
};

// suggestions list
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const userId = req.user.data.id as number;
    const {
      limit = '20',
      offset = '0',
      sortBy = 'distance',
      maxDistance = '100',
      minAge,
      maxAge,
      minFame,
      maxFame,
    } = req.query;

    const currentUserQuery = await getProfileDataforMatches(userId);
    if (!currentUserQuery.rows || currentUserQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const result = await searchSuggestions(userId, {
      minAge: minAge ? parseInt(minAge as string) : undefined,
      maxAge: maxAge ? parseInt(maxAge as string) : undefined,
      minFame: minFame ? parseInt(minFame as string) : undefined,
      maxFame: maxFame ? parseInt(maxFame as string) : undefined,
      sortBy: sortBy as string,
      maxDistance: parseInt(maxDistance as string),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      suggestions: result.rows,
      count: result.rows.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (err: any) {
    if (err.message === 'User location not found') {
      return res.status(200).json({
        suggestions: [],
        count: 0,
        limit: parseInt(req.query.limit as string || '20'),
        offset: parseInt(req.query.offset as string || '0'),
        message: 'Location required to get suggestions.'
      });
    }
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ================================================================================================================================================================================================================================================================================================================================================

export const likeUser = async (req: Request, res: Response) => {
  try {
    const likerId = req.user.data.id as number;
    const username = req.params.userId;

    // Look up user ID by username
    const userLookup = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userLookup.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const likedId = userLookup.rows[0].id;

    // Validation
    if (likerId === likedId) {
      return res.status(400).json({ error: 'Cannot like yourself' });
    }

    // Check if liker has profile picture
    const likerCheck = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM photos WHERE user_id = $1 AND is_profile_picture = TRUE) as has_pic',
      [likerId]
    );

    if (!likerCheck.rows[0].has_pic) {
      return res.status(403).json({
        error: 'You must have a profile picture to like other users',
      });
    }

    // Check if liked user exists and is not blocked
    const likedUserCheck = await pool.query(
      `
      SELECT u.id, u.username
      FROM users u
      WHERE u.id = $1
        AND NOT EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = $1 AND blocked_user_id = $2)
        AND NOT EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = $2 AND blocked_user_id = $1)
    `,
      [likedId, likerId]
    );

    if (likedUserCheck.rowCount === 0) {
      return res.status(404).json({ error: 'User not found or blocked' });
    }

    await pool.query('BEGIN');

    // Check if already liked
    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
      [likerId, likedId]
    );

    if (existingLike.rowCount && existingLike.rowCount > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'You already liked this user' });
    }

    // Insert the like
    await pool.query(
      'INSERT INTO likes (liker_user_id, liked_user_id) VALUES ($1, $2)',
      [likerId, likedId]
    );

    // Check if it's a mutual like (match)
    const mutualLike = await pool.query(
      'SELECT id FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
      [likedId, likerId]
    );

    const isMatch = mutualLike.rowCount && mutualLike.rowCount > 0;

    // Create notification for the liked user
    await createAndSendNotification(likedId, notificationTypes.LIKE, likerId);

    // If it's a match, create match notifications for both users
    if (isMatch) {
      await createAndSendNotification(
        likerId,
        notificationTypes.MATCH,
        likedId
      );

      await createAndSendNotification(
        likedId,
        notificationTypes.MATCH,
        likerId
      );
    }

    // Update fame rating for the liked user
    await pool.query(
      `UPDATE profiles 
       SET fame_rating = (
         SELECT COUNT(*) * 0.5 + 
                (SELECT COUNT(DISTINCT viewer_user_id) FROM profile_views WHERE viewed_user_id = $1) * 0.1
         FROM likes 
         WHERE liked_user_id = $1
       )
       WHERE user_id = $1`,
      [likedId]
    );

    await pool.query('COMMIT');

    res.status(201).json({
      message: isMatch ? "It's a match!" : 'Like sent successfully',
      isMatch,
      likedUser: {
        id: likedUserCheck.rows[0].id,
        username: likedUserCheck.rows[0].username,
      },
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Like user error:', error);
    res.status(500).json({ error: 'Failed to like user' });
  }
};

export const unlikeUser = async (req: Request, res: Response) => {
  try {
    const unlikerId = req.user.data.id as number;
    const username = req.params.userId;

    const userLookup = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userLookup.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const unlikedId = userLookup.rows[0].id;

    if (unlikerId === unlikedId) {
      return res.status(400).json({ error: 'Cannot unlike yourself' });
    }

    await pool.query('BEGIN');

    const likeCheck = await pool.query(
      'SELECT id FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
      [unlikerId, unlikedId]
    );

    if (likeCheck.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Like not found' });
    }

    const wasMatch = await pool.query(
      'SELECT id FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
      [unlikedId, unlikerId]
    );

    await pool.query(
      'DELETE FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
      [unlikerId, unlikedId]
    );

    if (wasMatch.rowCount && wasMatch.rowCount > 0) {
      await createAndSendNotification(unlikedId, notificationTypes.UNLIKE, unlikerId);
    }

    await pool.query(
      `UPDATE profiles
       SET fame_rating = (
         SELECT COUNT(*) * 0.5 +
                (SELECT COUNT(DISTINCT viewer_user_id) FROM profile_views WHERE viewed_user_id = $1) * 0.1
         FROM likes
         WHERE liked_user_id = $1
       )
       WHERE user_id = $1`,
      [unlikedId]
    );

    await pool.query('COMMIT');

    res.json({
      message: 'Successfully unliked',
      wasMatch: wasMatch.rowCount && wasMatch.rowCount > 0,
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Unlike user error:', error);
    res.status(500).json({ error: 'Failed to unlike user' });
  }
};

export const getLikeStatus = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user.data.id as number;
    const username = req.params.userId;

    const userLookup = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userLookup.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetId = userLookup.rows[0].id;

    const result = await pool.query(
      `SELECT
        EXISTS(SELECT 1 FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2) AS "iLiked",
        EXISTS(SELECT 1 FROM likes WHERE liker_user_id = $2 AND liked_user_id = $1) AS "theyLiked"`,
      [currentUserId, targetId]
    );

    const { iLiked, theyLiked } = result.rows[0];

    res.json({
      iLiked,
      theyLiked,
      isMatch: iLiked && theyLiked,
    });
  } catch (error) {
    console.error('Get like status error:', error);
    res.status(500).json({ error: 'Failed to get like status' });
  }
};

export const getMatches = async (req: Request, res: Response) => {
  try {
    const userId = req.user.data.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await getAllMatches({ userId, limit, offset });

    res.json({
      matches: result.rows,
      count: result.rows.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
};
