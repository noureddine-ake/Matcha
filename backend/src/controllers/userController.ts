import { User } from '../../database/entities/users.entity.js';
import { Request, Response } from 'express';
import { ProfileViews } from '../../database/entities/profile_views.entity.js';
import { Raw } from '../../database/raw.js';

export const viewUserProfile = async (req: Request, res: Response) => {
  try {
    const viewerId = req.user.data.id;; // assuming user is authenticated
    const viewedId = parseInt(req.params.id as string, 10);

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

      const lastviewscount = await ProfileViews.select(['viewed_at'])
        .where('viewer_user_id', viewerId).where('viewed_user_id', viewedId)
        .where('viewed_at', new Raw(`NOW() - INTERVAL '24 hours'`), '>')
        .run().then(result => result.rowCount);
      if (lastviewscount <= 0) {
        await ProfileViews.insert({
          viewer_user_id: viewerId,
          viewed_user_id: viewedId,
          viewed_at: new Raw('NOW()'),
        }).run();
      }
    }

    const totalViews = await ProfileViews.select(['COUNT(*)::int AS total_views'])
      .where('viewed_user_id', viewedId)
      .run().then((result) => result.rows[0].total_views);

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
