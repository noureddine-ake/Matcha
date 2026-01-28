"use client";

import { motion } from "framer-motion";
import { Heart, MessageCircle, Flag, ThumbsDown } from "lucide-react";
import api from "@/lib/api";

interface ProfileActionsProps {
    isCurrentUser: boolean;
    username?: string;
}

export default function ProfileActions({ isCurrentUser, username }: ProfileActionsProps) {
    // const handleLogout = () => {
    //     try {
    //         api.post("/profile/logout").then(() => {
    //             window.location.href = "/";
    //         });
    //     } catch (err) {
    //         console.error("Error during logout:", err);
    //     }
    // };

    const handleLike = async () => {
        try {
            await api.post(`/like/${username}`);
            // TODO: Update UI state or show notification
        } catch (err) {
            console.error("Error liking user:", err);
        }
    };

    const handleChat = () => {
        // TODO: Navigate to chat or open chat modal
        console.log("Open chat with:", username);
    };

    const handleReport = async () => {
        // TODO: Open report modal
        console.log("Report user:", username);
    };

    const handleBlock = async () => {
        try {
            await api.post(`/users/block/${username}`);
            // TODO: Update UI state or redirect
        } catch (err) {
            console.error("Error blocking user:", err);
        }
    };

    if (isCurrentUser) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-3 p-4 ">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl shadow-lg transition-all duration-300 font-semibold"
            >
                <Heart className="w-5 h-5" />
                Like
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleChat}
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl shadow-lg transition-all duration-300 font-semibold"
            >
                <MessageCircle className="w-5 h-5" />
                Chat
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReport}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl shadow-lg transition-all duration-300"
            >
                <Flag className="w-5 h-5" />
                Report
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBlock}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl shadow-lg transition-all duration-300"
            >
                <ThumbsDown className="w-5 h-5" />
                Block
            </motion.button>
        </div>
    );
}
