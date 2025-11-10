// import e from "express";
import ChatModel from "../models/chatModel.js";

// ✅ CONTROLLER — Handles requests and responses
const ChatController = {
    async getChat(req, res) {
      try {
        const { senderId, receiverId } = req.params;
  
        // 🔒 Validate both users exist
        const senderExists = await ChatModel.userExists(senderId);
        const receiverExists = await ChatModel.userExists(receiverId);
        if (!senderExists || !receiverExists) {
          return res.status(404).json({ error: "One or both users do not exist" });
        }
  
        // 🔒 Check connection
        const connected = await ChatModel.areConnected(senderId, receiverId);
        if (!connected) {
          return res.status(403).json({ error: "You are not connected." });
        }
  
        const messages = await ChatModel.getMessages(senderId, receiverId);
        res.status(200).json(messages);
      } catch (err) {
        console.error("❌ Error getting chat:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  
    async sendMessage(req, res) {
      try {
        const { senderId, receiverId } = req.params;
        const { content } = req.body;
  
        if (!content || !content.trim()) {
          return res.status(400).json({ error: "Message cannot be empty" });
        }
  
        // 🔒 Validate both users exist
        const senderExists = await ChatModel.userExists(senderId);
        const receiverExists = await ChatModel.userExists(receiverId);
        if (!senderExists || !receiverExists) {
          return res.status(404).json({ error: "One or both users do not exist" });
        }
  
        // 🔒 Check connection
        const connected = await ChatModel.areConnected(senderId, receiverId);
        if (!connected) {
          return res.status(403).json({ error: "You are not connected." });
        }
  
        // ⚙️ Save message
        const message = await ChatModel.sendMessage(senderId, receiverId, content);
  
        // 🔔 Create notification
        await ChatModel.createNotification(receiverId, senderId);
  
        res.status(201).json(message);
      } catch (err) {
        console.error("❌ Error sending message:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  
    async markAsRead(req, res) {
      try {
        const { senderId, receiverId } = req.params;
  
        // 🔒 Validate both users exist
        const senderExists = await ChatModel.userExists(senderId);
        const receiverExists = await ChatModel.userExists(receiverId);
        if (!senderExists || !receiverExists) {
          return res.status(404).json({ error: "One or both users do not exist" });
        }
  
        await ChatModel.markAsRead(senderId, receiverId);
        res.status(200).json({ success: true });
      } catch (err) {
        console.error("❌ Error marking messages as read:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  };
  
export default ChatController;