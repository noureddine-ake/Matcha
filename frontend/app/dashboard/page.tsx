"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Camera, Heart, MessageCircle, Eye, Edit3, MapPin, Calendar, Star } from "lucide-react";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Photo {
  id: number;
  photo_url: string;
  is_profile_picture: boolean;
}

interface Profile {
  gender: string;
  sexual_preference: string;
  biography: string;
  birth_date?: string;
  city?: string;
  country?: string;
}

interface Tag {
  id: number;
  name: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    matches: 0,
    messages: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        const data = res.data;
        setUser(data.user);
        setProfile(data.profile);
        setTags(data.tags || []);
        setPhotos(data.photos || []);
        
        // Mock stats data - replace with actual API call
        setStats({
          views: 128,
          likes: 42,
          matches: 8,
          messages: 5
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-800 rounded-xl"></div>
            <div className="h-64 bg-gray-800 rounded-xl"></div>
            <div className="h-48 bg-gray-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Profile Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8"
          >
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
                {photos.length > 0 && photos.find(p => p.is_profile_picture) ? (
                  <img
                    src={`${BACKEND_URL}${photos.find(p => p.is_profile_picture)?.photo_url}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-white/50" />
                  </div>
                )}
              </div>
              <button 
                onClick={toggleEdit}
                className="absolute -bottom-3 -right-3 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {user?.first_name} {user?.last_name}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-300 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{profile?.city || 'Location'}, {profile?.country || 'Country'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">4.8</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>{profile?.gender}</span>
                    <span className="text-gray-400">•</span>
                    <span>{profile?.sexual_preference}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                {profile?.biography || "No biography provided yet."}
              </p>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Eye, label: 'Views', value: stats.views },
                  { icon: Heart, label: 'Likes', value: stats.likes },
                  { icon: Star, label: 'Matches', value: stats.matches },
                  { icon: MessageCircle, label: 'Messages', value: stats.messages }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
                  >
                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-purple-300" />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-300">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interests/Tags Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <motion.span
                      key={tag.id}
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium cursor-pointer hover:shadow-lg transition-all duration-300"
                    >
                      {tag.name}
                    </motion.span>
                  ))
                ) : (
                  <p className="text-gray-400">No interests added yet.</p>
                )}
              </div>
            </motion.div>

            {/* Edit Modal (simplified for this example) */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">Edit Profile</h3>
                  <p className="text-gray-300 mb-6">Edit functionality would go here</p>
                  <div className="flex gap-3">
                    <button
                      onClick={toggleEdit}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Photos Grid */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Camera className="w-6 h-6" />
                Photos
              </h2>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="relative group"
                    >
                      <div className={`rounded-xl overflow-hidden aspect-square ${photo.is_profile_picture ? 'ring-4 ring-purple-500' : ''}`}>
                        <img
                          src={`${BACKEND_URL}${photo.photo_url}`}
                          alt="Profile photo"
                          className="w-full h-full object-cover"
                        />
                        {photo.is_profile_picture && (
                          <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Profile
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No photos uploaded yet.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}