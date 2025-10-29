// ```jsx
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
  Bot,
  MessageCircle,
  User,
  Mail,
  Calendar,
  Hash
} from "lucide-react";
import ProfilePictureSection from "@/components/user/ProfilePictureSection";
import PhotosGallerySection from "@/components/user/PhotosGallerySection";
import UserTagsSection from "@/components/user/UserTagsSection";
import { useGlobal } from "@/contexts/globalcontext";
import { BACKEND_URL } from "@/lib/constants/env";
import { ProfileProps } from "@/types/profile";
import { calculateAge } from "@/lib/date";
import fetchFlag from "@/lib/fetchflag";

export default function PublicUserProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileProps>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {fetchUserProfile} = useGlobal();
  const [flagUrl, setFlagUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileAndFlag = async () => {
      if (!username || !fetchUserProfile) return;
    
      try {
        const userProfile = await fetchUserProfile(username);
    
        if (userProfile) {
          setProfile(userProfile as ProfileProps);
    
          // Only call fetchFlag if latitude and longitude exist
          if (userProfile.latitude && userProfile.longitude) {
            const url = await fetchFlag({
              latitude: userProfile.latitude,
              longitude: userProfile.longitude,
            });
            setFlagUrl(url || null);
          }
        } else {
          setError("Profile not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Profile not found");
      } finally {
        setLoading(false);
      }
    };
    
    // Call it once
    loadProfileAndFlag();
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
        <div className="absolute inset-0 "></div>
        <div className="relative max-w-6xl mx-auto px-4 py-8">
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
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Verified
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-gray-300 mb-3">
                    <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span className="text-lg">
                      {profile.city || "—"}, {profile.country || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {flagUrl && (
                      <div className="relative w-8 h-5 overflow-hidden border rounded-sm shadow-sm transition-transform duration-300 hover:scale-110">
                        <img
                          src={flagUrl}
                          alt="Country Flag"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">4.8</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                      <User className="w-5 h-5 text-blue-400" />
                      <span>{profile.gender || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                      <Heart className="w-5 h-5 text-pink-400" />
                      <span>Interested in: {profile.sexual_preference || "—"}</span>
                    </div>
                    {age && (
                      <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span>{age} years old</span>
                      </div>
                    )}
                  </div>
                  
                  {profile.email && (
                    <div className="text-gray-300 mt-3 flex items-center gap-2 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                      <Mail className="w-5 h-5 text-purple-400" />
                      <span>{profile.email}</span>
                    </div>
                  )}
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
                className="mb-6 bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/20 leading-relaxed shadow-lg"
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
                  { icon: Eye, label: "Profile Views", value: profile.stats?.views || 0 },
                  { icon: Heart, label: "Likes Received", value: profile.stats?.likes || 0 },
                  { icon: Star, label: "Matches", value: profile.stats?.matches || 0 },
                  { icon: ImageIcon, label: "Photos", value: profile.photos?.length || 0 },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
                  >
                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-purple-300" />
                    <div className="text-xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-300">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Hash className="w-6 h-6 text-purple-400" />
              Interests & Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.tags?.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white rounded-full text-sm border border-white/20 hover:from-purple-600/50 hover:to-pink-600/50 transition-all"
                >
                  {typeof tag === 'object' ? tag.name : tag}
                </span>
              ))}
            </div>
          </div>
          
          <PhotosGallerySection photos={profile.photos} backendUrl={BACKEND_URL} />
        </div>
      </div>
    </div>
  );
}
// ```