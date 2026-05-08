import type { Request, Response } from 'express';
import { Profiles } from '../../database/entities/profiles.entity.js';
import { getUserLikes } from '../models/matchModel.js';

interface AuthRequest {
  user?: { data: { id: number; username?: string; email?: string } };
}

export const getLikes = async (req: any, res: any): Promise<void | Response> => {
  try {
    const userId = req.user?.data.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { limit = '20', offset = '0' } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    const existingProfile = await Profiles.select(['*']).where('user_id', userId).run().then(result => result.rowCount > 0);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const ret = await getUserLikes(userId, { limit: parsedLimit, offset: parsedOffset });

    res.status(200).json({
      likes: ret.rows,
      count: ret.rows.length,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (err: unknown) {
    console.error('Error fetching likes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
