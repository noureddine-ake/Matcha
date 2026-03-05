import express from "express";
import JWT from '../middlewares/authMiddleware.js';
import {
  getChatUsers,
  getChat,
  sendMessage,
  markAsRead,
  getOnlineStatus,
  getCurrentUser,
  
} from "../controllers/chatController.js";    

const router = express.Router();

// ✅ ROUTES
router.get("/users", JWT.verifyAndDecodeToken, getChatUsers);
router.get("/:receiverId", JWT.verifyAndDecodeToken, getChat);
router.post("/:receiverId", JWT.verifyAndDecodeToken, sendMessage);
router.post("/:senderId/read", JWT.verifyAndDecodeToken, markAsRead);
router.get("/online-status/:userId", JWT.verifyAndDecodeToken, getOnlineStatus);
router.get("/me/current-user", JWT.verifyAndDecodeToken, getCurrentUser);

export default router;
