import { getUserLikes } from '../models/matchModel.js';
import { getProfileByUserId } from '../models/profileModel.js'

export const getLikes = async (req, res) => {
  try {
    const userId = req.user.data.id;

    const existingProfile = await getProfileByUserId(userId);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const ret = await getUserLikes(userId);

    res.status(200).json(ret.rows);
  } catch (err) {
    console.error('Error fetching likes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
