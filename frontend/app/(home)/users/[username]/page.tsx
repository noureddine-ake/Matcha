// app/user/[username]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  XCircle,
  MapPin,
  Star,
  Eye,
  ImageIcon,
  X,
  Loader,
 Bot, MessageCircle 
} from "lucide-react";
import ProfilePictureSection from "@/components/user/ProfilePictureSection";
import PhotosGallerySection from "@/components/user/PhotosGallerySection";
import UserTagsSection from "@/components/user/UserTagsSection";
import { useGlobal } from "@/contexts/globalcontext";
import { BACKEND_URL } from "@/lib/constants/env";
import { ProfileProps } from "@/types/profile";
import { calculateAge } from "@/lib/date";

export default function PublicUserProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileProps>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {fetchUserProfile} = useGlobal();

  useEffect(() => {
    const loadProfile = async () => {
      if (!username || !fetchUserProfile) return;
      try {
        const userProfile = await fetchUserProfile(username);
        if (userProfile) {
          setProfile(userProfile as ProfileProps);
        } else {
          setError("Profile not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Profile not found");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username]);

  // === Loading State ===
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10"
        >
          <Loader className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
          <p className="text-gray-300">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  // === Error / Not Found ===
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 text-center max-w-md border border-white/10 shadow-2xl"
        >
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Profile Unavailable</h2>
          <p className="text-gray-300 mb-6">{error || "This user does not exist."}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:opacity-90 transition-all shadow-lg"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }
  // === Main Profile Content ===
  const age = calculateAge(profile.birth_date);

  return (
    <div className="min-h-screen  text-white">
      {/* Profile Header */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8"
          >
            {/* Profile Picture */}
            <ProfilePictureSection photos={profile.photos} backendUrl={BACKEND_URL} />

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-gray-300 mb-3">
                    <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>
                      {profile.city || "—"}, {profile.country || "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <span>{profile.gender || "—"}</span>
                    <span>•</span>
                    <span>Interested in: {profile.sexual_preference || "—"}</span>
                    {age && (
                      <>
                        <span>•</span>
                        <span>{age} years old</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
             

        <div className="flex gap-3 mt-4 md:mt-0 justify-center">
          {/* ❤️ Match */}
          <button
            className="p-3 bg-pink-600/20 hover:bg-pink-600/40 rounded-full border border-pink-500/30 transition-all shadow-lg hover:shadow-pink-500/30"
            title="Matched"
          >
            <Heart className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* ❌ Dislike */}
          <button
            className="p-3 bg-gray-600/20 hover:bg-gray-600/40 rounded-full border border-gray-500/30 transition-all shadow-lg hover:shadow-gray-500/30"
            title="Dislike"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* 🤖 Rebot */}
          <button
            className="p-3 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-full border border-yellow-500/30 transition-all shadow-lg hover:shadow-yellow-500/30"
            title="Rebot"
          >
            <Bot className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* 💬 Chat */}
          <button
            className="p-3 bg-blue-600/20 hover:bg-blue-600/40 rounded-full border border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/30"
            title="Chat"
          >
            <MessageCircle className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          </button>
</div>
              </div>

              {/* Bio */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 leading-relaxed"
              >
                {profile.biography || (
                  <span className="text-gray-500 italic">No bio provided.</span>
                )}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {[
                  { icon: Eye, label: "Views", value: profile.stats?.views || 0 },
                  { icon: Heart, label: "Likes", value: profile.stats?.likes || 0 },
                  { icon: Star, label: "Matches", value: profile.stats?.matches || 0 },
                  { icon: ImageIcon, label: "Photos", value: profile.photos?.length || 0 },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10"
                  >
                    <stat.icon className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Sections */}
       {/* ✅ ENHANCED: Fully responsive 1-column (mobile) → 2-column (desktop) */}
       <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UserTagsSection tags={profile.tags} />
          <PhotosGallerySection photos={profile.photos} backendUrl={BACKEND_URL} />
        </div>
      </div>
    </div>
  );
}