import express from 'express';
import JWT from '../middlewares/authMiddleware.js';
import { pool } from '../config/config.js';

const router = express.Router();

router.use(JWT.verifyAndDecodeToken);

router.get('/me', async (req, res) => {
  const userId = req.user.data.id;

  try {
    const client = await pool.connect();
    
    const result = await client.query(
      'SELECT id, email, username, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/block/:username', async (req, res) => {
  const blockerId = req.user.data.id;
  const { username } = req.params;

  try {
    const client = await pool.connect();
    
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'User not found' });
    }

    const blockedUserId = userResult.rows[0].id;

    if (blockerId === blockedUserId) {
      client.release();
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    await client.query(
      `INSERT INTO blocks (blocker_user_id, blocked_user_id)
       VALUES ($1, $2)`,
      [blockerId, blockedUserId]
    );

    client.release();
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/block/:username', async (req, res) => {
  const blockerId = req.user.data.id;
  const { username } = req.params;

  try {
    const client = await pool.connect();
    
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'User not found' });
    }

    const blockedUserId = userResult.rows[0].id;

    await client.query(
      'DELETE FROM blocks WHERE blocker_user_id = $1 AND blocked_user_id = $2',
      [blockerId, blockedUserId]
    );

    client.release();
    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/blocked', async (req, res) => {
  const blockerId = req.user.data.id;

  try {
    const client = await pool.connect();
    
    const result = await client.query(
      `SELECT u.id, u.username, u.first_name, u.last_name, 
              (SELECT photo_url FROM photos WHERE user_id = u.id AND is_profile_picture = true LIMIT 1) as profile_picture
       FROM blocks b
       JOIN users u ON b.blocked_user_id = u.id
       WHERE b.blocker_user_id = $1
       ORDER BY b.created_at DESC`,
      [blockerId]
    );

    client.release();
    res.status(200).json({ blockedUsers: result.rows });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/block/:username/status', async (req, res) => {
  const blockerId = req.user.data.id;
  const { username } = req.params;

  try {
    const client = await pool.connect();
    
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'User not found' });
    }

    const blockedUserId = userResult.rows[0].id;

    const blockResult = await client.query(
      'SELECT id FROM blocks WHERE blocker_user_id = $1 AND blocked_user_id = $2',
      [blockerId, blockedUserId]
    );

    client.release();
    res.status(200).json({ isBlocked: blockResult.rows.length > 0 });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export const userRoutes = router;
