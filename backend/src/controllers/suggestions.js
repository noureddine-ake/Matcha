import { pool } from '../config/config.js';
import { searchSuggestions } from '../models/suggestionsModal.js';

export const getSuggestions = async (req, res) => {
  try {
    const userId = req.user.data.id;

    const meResult = await pool.query(
        `SELECT gender, sexual_preference FROM profiles WHERE user_id = $1`,
        [userId]
    );
    const me = meResult.rows[0];
    if (!me) return res.status(404).json({ error: 'profile note found' });
    
    const suggestionsResult = await searchSuggestions({
        userId: userId,
        sexual_preference: me.sexual_preference,
    });
    res.status(200).json({ suggestionsResult });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
