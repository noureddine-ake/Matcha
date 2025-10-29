import express from 'express';
import JWT from '../middlewares/authMiddleware.js';
import { getNotifications, readNotification } from '../controllers/notificationController.js';

export const NotificationsRouts = express.Router();


NotificationsRouts.post('/', JWT.verifyAndDecodeToken, getNotifications);
NotificationsRouts.post('/:id/read', JWT.verifyAndDecodeToken,readNotification);