import { pool } from '../config/config.js';
import { searchSuggestions2, getProfileDataforMatches } from '../models/matchModel.js';



// suggestions list
export const getSuggestions = async (req, res) => {
  try {
    const userId = req.user.data.id;
    const { 
      limit = 20, 
      offset = 0,
      sortBy = 'distance',
      maxDistance = 100,
      minAge,
      maxAge,
      minFame,
      maxFame
    } = req.query;

    const currentUserQuery = await getProfileDataforMatches(userId);
    if (!currentUserQuery.rowCount) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const currentUser = currentUserQuery.rows[0];

    // Build gender filter
    let genderFilter = '';
    if (currentUser.sexual_preference === 'male') {
      genderFilter = "AND p.gender = 'male'";
    } else if (currentUser.sexual_preference === 'female') {
      genderFilter = "AND p.gender = 'female'";
    }

    let mutualPreferenceFilter = '';
    if (currentUser.gender) {
      mutualPreferenceFilter = `
        AND (
          p.sexual_preference = '${currentUser.gender}'
          OR p.sexual_preference = 'bisexual'
          OR p.sexual_preference IS NULL
        )
      `;
    }

    // Build sorting
    let orderByClause = '';
    switch(sortBy) {
      case 'fame':
        orderByClause = 'ORDER BY p.fame_rating DESC, distance ASC';
        break;
      case 'age':
        orderByClause = 'ORDER BY age ASC, distance ASC';
        break;
      case 'tags':
        orderByClause = 'ORDER BY common_tags DESC, distance ASC';
        break;
      case 'distance':
      default:
        orderByClause = 'ORDER BY distance ASC, p.fame_rating DESC';
    }

    const result = await searchSuggestions2(userId, {
      genderFilter,
      mutualPreferenceFilter,
      minAge,
      maxAge,
      minFame,
      maxFame,
      orderByClause,
      maxDistance,
      limit,
      offset,
    });

    res.json({
      suggestions: result.rows,
      count: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// like a user
export const likeUser = async (req, res) => {  
  try {
    const likerId = req.user.data.id;
    const likedId = parseInt(req.params.useerId)

    // Validation
    if (likerId === likedId) {
      return res.status(400).json({ error: 'Cannot like yourself' });
    }

    // Check if liker has profile picture (requirement from subject)
    const likerCheck = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM photos WHERE user_id = $1 AND is_profile_picture = TRUE) as has_pic',
      [likerId]
    );

    if (!likerCheck.rows[0].has_pic) {
      return res.status(403).json({ 
        error: 'You must have a profile picture to like other users' 
      });
    }

    // Check if liked user exists and is not blocked
    const likedUserCheck = await pool.query(`
      SELECT u.id, u.username
      FROM users u
      WHERE u.id = $1
        AND NOT EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = $1 AND blocked_user_id = $2)
        AND NOT EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = $2 AND blocked_user_id = $1)
    `, [likedId, likerId]);

    if (likedUserCheck.rowCount === 0) {
      return res.status(404).json({ error: 'User not found or blocked' });
    }

    await pool.query('BEGIN');

    // Check if already liked
    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
      [likerId, likedId]
    );

    if (existingLike.rowCount > 0) {
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

    const isMatch = mutualLike.rowCount > 0;

    // Create notification for the liked user
    await pool.query(
      `INSERT INTO notifications (user_id, type, from_user_id, is_read) 
       VALUES ($1, $2, $3, FALSE)`,
      [likedId, 'like', likerId]
    );

    // If it's a match, create match notification for both users
    if (isMatch) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, from_user_id, is_read) 
         VALUES ($1, 'match', $2, FALSE)`,
        [likerId, likedId]
      );
      
      await pool.query(
        `INSERT INTO notifications (user_id, type, from_user_id, is_read) 
         VALUES ($1, 'match', $2, FALSE)`,
        [likedId, likerId]
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
      message: isMatch ? 'It\'s a match!' : 'Like sent successfully',
      isMatch,
      likedUser: {
        id: likedUserCheck.rows[0].id,
        username: likedUserCheck.rows[0].username
      }
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Like user error:', error);
    res.status(500).json({ error: 'Failed to like user' });
  }
}

// unlike a user 
// export const unlikeUser = async (req, res) => {
//   const client = await db.connect();
  
//   try {
//     const unlikerId = req.user.id;
//     const unlikedId = parseInt(req.params.userId);

//     await client.query('BEGIN');

//     // Check if like exists
//     const likeCheck = await client.query(
//       'SELECT id FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
//       [unlikerId, unlikedId]
//     );

//     if (likeCheck.rows.length === 0) {
//       await client.query('ROLLBACK');
//       return res.status(404).json({ error: 'Like not found' });
//     }

//     // Check if it was a match before unlinking
//     const wasMatch = await client.query(
//       'SELECT id FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
//       [unlikedId, unlikerId]
//     );

//     // Delete the like
//     await client.query(
//       'DELETE FROM likes WHERE liker_user_id = $1 AND liked_user_id = $2',
//       [unlikerId, unlikedId]
//     );

//     // If it was a match, notify the other user
//     if (wasMatch.rows.length > 0) {
//       await client.query(
//         `INSERT INTO notifications (user_id, type, from_user_id, is_read) 
//          VALUES ($1, 'unlike', $2, FALSE)`,
//         [unlikedId, unlikerId]
//       );
//     }

//     // Update fame rating for the unliked user
//     await client.query(
//       `UPDATE profiles 
//        SET fame_rating = (
//          SELECT COUNT(*) * 0.5 + 
//                 (SELECT COUNT(DISTINCT viewer_user_id) FROM profile_views WHERE viewed_user_id = $1) * 0.1
//          FROM likes 
//          WHERE liked_user_id = $1
//        )
//        WHERE user_id = $1`,
//       [unlikedId]
//     );

//     await client.query('COMMIT');

//     res.json({
//       message: 'Successfully unliked',
//       wasMatch: wasMatch.rows.length > 0
//     });

//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('Unlike user error:', error);
//     res.status(500).json({ error: 'Failed to unlike user' });
//   } finally {
//     client.release();
//   }
// }