import { recordProfileView, getProfileViewCount } from '../models/profileViewModel.js';
import { User } from '../../database/entities/users.entity.js';

export const viewUserProfile = async (req, res) => {
  try {
    const viewerId = req.user.data.id;; // assuming user is authenticated
    const viewedId = parseInt(req.params.id, 10);

    if (!viewedId || isNaN(viewedId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const ret = await User.select(['id', 'username', 'email', 'created_at']).where('id', viewedId).run();
    const user = ret.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Record the view (but don’t record if viewing your own profile)
    if (viewerId && viewerId !== viewedId) {
      await recordProfileView(viewerId, viewedId);
    }

    const totalViews = await getProfileViewCount(viewedId);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        total_views: totalViews,
      },
    });
  } catch (error) {
    console.error('Error viewing profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
