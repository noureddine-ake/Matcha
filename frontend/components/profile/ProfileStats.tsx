"use client";

import { motion } from "framer-motion";
import { Eye, Flame, Heart, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface Stats {
    views?: number;
    likes?: number;
    matches?: number;
    messages?: number;
}

interface ProfileStatsProps {
    stats: Stats | undefined;
    isCurrentUser: boolean;
}

export default function ProfileStats({ stats, isCurrentUser }: ProfileStatsProps) {
    const router = useRouter();

    // Only show stats for current user's profile
    if (!isCurrentUser) {
        return null;
    }

    const statItems = [
        {
            icon: Eye,
            label: "Profile Views",
            value: stats?.views || 0,
            special: isCurrentUser,
            onClick: isCurrentUser ? () => router.push("/views") : undefined,
        },
        {
            icon: Heart,
            label: "Likes Received",
            value: stats?.likes || 0,
            special: false,
            onClick: undefined,
        },
        {
            icon: Flame,
            label: "Matches",
            value: stats?.matches || 0,
            special: false,
            onClick: undefined,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 px-2 py-4 sm:grid-cols-3">
            {statItems.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.0001 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={stat.onClick}
                    className={`p-4 flex flex-col justify-center items-center relative group rounded-2xl text-center border transition-all duration-300 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20`}
                >
                    {/* <Button
                        onClick={stat.onClick}
                        className="relative p-4 z-10 bg-transparent hover:bg-white/20 w-full h-full flex flex-col items-center justify-center"> */}
                        <stat.icon
                            className={`w-5 h-5 mb-2`}
                        />
                        <div className="text-xl font-bold text-white">{stat.value}</div>
                        <div className="text-md text-gray-300">{stat.label}</div>
                    {/* </Button> */}
                </motion.div>
            ))}
        </div>
    );
}
