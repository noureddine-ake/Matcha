"use client";

import Image from "next/image";
import { MapPin, Star, User as UserIcon, HeartHandshake, Mail, Calendar, VenusAndMars, Heart, MessageCircleHeart } from "lucide-react";
import { User } from "@/contexts/globalcontext";

interface ProfileInfoProps {
    currentProfile: User;
    isCurrentUser: boolean;
    flagUrl: string | null;
}

export default function ProfileInfo({
    currentProfile,
    isCurrentUser,
    flagUrl,
}: ProfileInfoProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="w-full">
                {/* Name and Badge */}
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold bg-linear-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                        {currentProfile?.first_name} {currentProfile?.last_name}
                    </h1>
                    <span className="bg-linear-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full b">
                        Verified
                    </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <span className="text-lg">
                        {currentProfile.city || "Location"}, {currentProfile.country || "Country"}
                    </span>
                    {flagUrl && (
                        <Image
                            src={flagUrl}
                            alt="Country Flag"
                            width={32}
                            height={24}
                            className="inline-block ml-2 rounded-sm border border-white/20"
                        />
                    )}
                </div>

                {/* Tags: Rating, Gender, Sexual Preference */}
                <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                        <span className="font-semibold">4.8</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                        <VenusAndMars className="w-5 h-5 text-blue-400" />
                        <span>{currentProfile.gender}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                        <MessageCircleHeart className="w-5 h-5 text-purple-400" />
                        <span>{currentProfile.sexual_preference}</span>
                    </div>
                </div>

                {/* Email - only for own profile */}
                {isCurrentUser && currentProfile?.email && (
                    <div className="text-gray-300 mt-3 flex items-center gap-2 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/10 w-full ">
                        <Mail className="w-5 h-5 text-purple-400" />
                        <span>{currentProfile.email}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

interface ProfileBirthdayProps {
    birthDate: string;
}

export function ProfileBirthday({ birthDate }: ProfileBirthdayProps) {
    return (
        <div className="text-gray-300 mb-4 flex items-center gap-2 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/10">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span>
                Born on:{" "}
                {new Date(birthDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}
            </span>
        </div>
    );
}
