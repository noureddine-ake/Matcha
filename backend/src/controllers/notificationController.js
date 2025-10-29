import { getAllNotifications, setNotificationReaded } from '../models/notificationModel.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.data.id;

    const { rows } = await getAllNotifications(userId);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.data.id;

    const update = await setNotificationReaded({id, userId})

    if (update.rowCount === 0)
      return res.status(404).json({ message: 'Notification not found' });

    res.status(200).json(update.rows[0]);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};
