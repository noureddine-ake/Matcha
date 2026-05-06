"use client";

import { motion } from "framer-motion";
import { Heart, HeartCrack, MessageCircle, Flag, ThumbsDown, ThumbsUp, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// import { useChat } from "@/contexts/ChatContext";

interface ProfileActionsProps {
    isCurrentUser: boolean;
    username?: string;
    userId?: string;
}

interface LikeStatus {
    iLiked: boolean;
    theyLiked: boolean;
    isMatch: boolean;
}

export default function ProfileActions({ isCurrentUser, username, userId }: ProfileActionsProps) {
    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState("fake_account");
    const [showReportModal, setShowReportModal] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isLoadingBlockStatus, setIsLoadingBlockStatus] = useState(true);
    const [likeStatus, setLikeStatus] = useState<LikeStatus>({ iLiked: false, theyLiked: false, isMatch: false });
    const [isLoadingLikeStatus, setIsLoadingLikeStatus] = useState(true);
    const [isLikeActionPending, setIsLikeActionPending] = useState(false);
    const router = useRouter();
    // const { removeUserFromChatList } = useChat();

    useEffect(() => {
        if (!username || isCurrentUser) {
            setIsLoadingBlockStatus(false);
            setIsLoadingLikeStatus(false);
            return;
        }

        const checkStatuses = async () => {
            try {
                const [blockRes, likeRes] = await Promise.all([
                    api.get(`/users/block/${username}/status`),
                    api.get(`/like/${username}/status`),
                ]);
                setIsBlocked(blockRes.data.isBlocked);
                setLikeStatus(likeRes.data);
            } catch (err) {
                console.error("Error checking statuses:", err);
            } finally {
                setIsLoadingBlockStatus(false);
                setIsLoadingLikeStatus(false);
            }
        };

        checkStatuses();
    }, [username, isCurrentUser]);

    const handleLike = async () => {
        setIsLikeActionPending(true);
        try {
            const res = await api.post(`/like/${username}`);
            const isMatch = res.data.isMatch;
            setLikeStatus({ iLiked: true, theyLiked: likeStatus.theyLiked, isMatch });
            if (isMatch) {
                toast.success(`You matched with ${username}! 🎉`);
            } else {
                toast.success(`You liked ${username}`);
            }
        } catch (err) {
            console.error("Error liking user:", err);
            toast.error("Failed to like user");
        } finally {
            setIsLikeActionPending(false);
        }
    };

    const handleUnlike = async () => {
        setIsLikeActionPending(true);
        try {
            await api.delete(`/like/${username}`);
            setLikeStatus({ iLiked: false, theyLiked: likeStatus.theyLiked, isMatch: false });
            toast.success(`Unliked ${username}`);
        } catch (err) {
            console.error("Error unliking user:", err);
            toast.error("Failed to unlike user");
        } finally {
            setIsLikeActionPending(false);
        }
    };

    const handleChat = () => {
        router.push(`/chat?username=${username}`);
    };

    const handleReport = () => {
        setShowReportModal(true);
    };

    const handleBlock = async () => {
        try {
            await api.post(`/users/block/${username}`);
            toast.success("User blocked");
            // if (userId) {
            //     removeUserFromChatList(userId.toString());
            // }
            router.push('/discover');
        } catch (err) {
            console.error("Error blocking user:", err);
            toast.error("Failed to block user");
        }
    };

    const handleUnblock = async () => {
        try {
            await api.delete(`/users/block/${username}`);
            setIsBlocked(false);
            toast.success("User unblocked");
        } catch (err) {
            console.error("Error unblocking user:", err);
            toast.error("Failed to unblock user");
        }
    };

    const submitReport = async () => {
        if (!userId) {
            toast.error("User ID not found");
            return;
        }

        setIsReporting(true);
        try {
            const response = await api.post(`/reports/${userId}`, {
                reason: reportReason
            });

            if (response.status === 201 || response.status === 200) {
                toast.success("User reported successfully!");
                setShowReportModal(false);
            } else {
                const errorMsg = response.data?.message || "Failed to report user";
                toast.error(errorMsg);
            }
        } catch (err: unknown) {
            console.error("Error reporting user:", err);

            const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
            if (axiosErr.response?.status === 400) {
                toast.error(axiosErr.response.data?.message || "Cannot report this user");
            } else if (axiosErr.response?.status === 409) {
                toast.error("You already reported this user");
            } else if (axiosErr.response?.status === 401) {
                toast.error("Please login to report users");
            } else {
                toast.error("Error reporting user. Please try again.");
            }
        } finally {
            setIsReporting(false);
        }
    };

    const reportReasons = [
        { value: "fake_account", label: "Fake Account" },
        { value: "inappropriate", label: "Inappropriate Content" },
        { value: "harassment", label: "Harassment" },
        { value: "spam", label: "Spam" },
        { value: "other", label: "Other" }
    ];

    if (isCurrentUser) return null;

    if (isLoadingBlockStatus || isLoadingLikeStatus) {
        return (
            <div className="flex flex-wrap gap-3 p-4">
                <div className="w-28 h-12 bg-gray-800 animate-pulse rounded-xl" />
                <div className="w-24 h-12 bg-gray-800 animate-pulse rounded-xl" />
            </div>
        );
    }

    const renderLikeButton = () => {
        const { iLiked, theyLiked, isMatch } = likeStatus;

        if (isMatch) {
            return (
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg font-semibold shadow-green-900/30 cursor-default"
                    >
                        <Sparkles className="w-5 h-5" />
                        Connected
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUnlike}
                        disabled={isLikeActionPending}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-red-900/40 text-gray-300 hover:text-red-400 rounded-xl shadow-lg transition-all duration-300 border border-gray-700 hover:border-red-700 disabled:opacity-50"
                    >
                        <HeartCrack className="w-5 h-5" />
                        Disconnect
                    </motion.button>
                </div>
            );
        }

        if (iLiked) {
            return (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUnlike}
                    disabled={isLikeActionPending}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl shadow-lg transition-all duration-300 border border-gray-600 disabled:opacity-50"
                >
                    <HeartCrack className="w-5 h-5 text-red-400" />
                    Unlike
                </motion.button>
            );
        }

        if (theyLiked) {
            return (
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-pink-400 font-medium px-1 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-pink-400" />
                        {username} liked you
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLike}
                        disabled={isLikeActionPending}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl shadow-lg transition-all duration-300 font-semibold shadow-pink-900/30 disabled:opacity-50"
                    >
                        <Heart className="w-5 h-5" />
                        Like Back
                    </motion.button>
                </div>
            );
        }

        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                disabled={isLikeActionPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl shadow-lg transition-all duration-300 font-semibold shadow-pink-900/30 disabled:opacity-50"
            >
                <Heart className="w-5 h-5" />
                Like
            </motion.button>
        );
    };

    return (
        <>
            <div className="flex flex-wrap gap-3 p-4">
                {!isBlocked ? (
                    <>
                        {renderLikeButton()}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleChat}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-300 font-semibold shadow-purple-900/30"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Chat
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleReport}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-xl shadow-lg transition-all duration-300 border border-gray-700"
                            disabled={isReporting}
                        >
                            <Flag className="w-5 h-5" />
                            {isReporting ? "Reporting..." : "Report"}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBlock}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-xl shadow-lg transition-all duration-300 border border-gray-700"
                        >
                            <ThumbsDown className="w-5 h-5" />
                            Block
                        </motion.button>
                    </>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUnblock}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg transition-all duration-300 font-semibold shadow-green-900/30"
                    >
                        <ThumbsUp className="w-5 h-5" />
                        Unblock
                    </motion.button>
                )}
            </div>

            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Report User</h3>
                        <p className="text-gray-300 mb-6">
                            Why are you reporting <span className="font-semibold text-white">{username}</span>?
                        </p>

                        <div className="space-y-3 mb-6">
                            {reportReasons.map((reason) => (
                                <label
                                    key={reason.value}
                                    className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value={reason.value}
                                        checked={reportReason === reason.value}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="w-4 h-4 text-red-500 bg-gray-800 border-gray-700 focus:ring-red-600"
                                    />
                                    <span className="text-gray-200">{reason.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowReportModal(false)}
                                disabled={isReporting}
                                className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={submitReport}
                                disabled={isReporting}
                                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {isReporting ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </span>
                                ) : "Submit Report"}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}
