// chat.js
import express from "express";
import ChatController from "../controllers/chatController.js";
import JWT from '../middlewares/authMiddleware.js';

const router = express.Router();

// ✅ ROUTES
router.get("/:senderId/:receiverId",JWT.verifyAndDecodeToken, ChatController.getChat);
router.post("/:senderId/:receiverId",JWT.verifyAndDecodeToken, ChatController.sendMessage);
router.post("/:senderId/:receiverId/read",JWT.verifyAndDecodeToken, ChatController.markAsRead);

export default router;

/**
 * @swagger
 * /chat/{senderId}/{receiverId}:
 *   get:
 *     summary: Get conversation between two users
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   sender_user_id:
 *                     type: integer
 *                   receiver_user_id:
 *                     type: integer
 *                   content:
 *                     type: string
 *                   sent_at:
 *                     type: string
 *                     format: date-time
 *                   is_read:
 *                     type: boolean
 */

/**
 * @swagger
 * /chat/{senderId}/{receiverId}:
 *   post:
 *     summary: Send a message
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Message cannot be empty
 *       403:
 *         description: Users are not connected
 */

/**
 * @swagger
 * /chat/{senderId}/{receiverId}/read:
 *   put:
 *     summary: Mark all messages as read
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages marked as read
 */

