import { Request, Response } from 'express';
import { Notifications } from '../../database/entities/notifications.entity.js';

declare global {
  namespace Express {
    interface Request {
      user: {
        data: {
          id: string | number;
        };
      };
    }
  }
}

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user.data.id;
    const { rows } = await Notifications.select([
      'n.id',
      'n.type',
      'n.is_read',
      'n.created_at',
      'u.id AS from_user_id',
      'u.username AS from_username'
    ]).from('notifications n')
      .join('', 'users u', 'u.id = n.from_user_id')
      .where('n.user_id', userId)
      .orderBy('n.created_at', 'DESC')
      .run();

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const readNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.data.id;

    const update = await Notifications.update({ is_read: true })
      .where('id', id)
      .where('user_id', userId)
      .returning(['*'])
      .run();

    if (update.rowCount === 0)
      return res.status(404).json({ message: 'Notification not found' });

    res.status(200).json(update.rows[0]);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};
