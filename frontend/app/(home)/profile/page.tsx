"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Heart, Eye, Edit3, MapPin, Star, Calendar, Hash, Loader } from "lucide-react";
import { useGlobal } from "@/contexts/globalcontext"
import Image from "next/image";
import EditProfileDialog from "@/components/dialogs/edit_profile_dialog";
import ProfilePicture from '@/components/ProfilePicture';
import PhotosGallery from '@/components/photosGallery';
import UserTags from "@/components/UserTags";
import api from "@/lib/api";


const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://backend:5000';

export default function ProfilePage() {
  const {fetchProfile, user, loading, error, } = useGlobal()
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const lougout = () => {
    try {
        api.post('/profile/logout').then(() => {
          window.location.href = '/';
        }
      );
    }
    catch (err) {
      console.error('Error during logout:', err);
    }
  }


  if (!user) {
    return <div><Loader className=" animate-spin"/></div>
  }

  return (
    <div className="min-h-full">
      {/* Profile Header */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8"
          >
            {/* Profile Picture */}
            <div className="relative">
             
              <ProfilePicture photos={user.photos} backendUrl={BACKEND_URL} size={192} />
              <button
                onClick={toggleEdit}
                className="absolute -bottom-3 -right-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-white/20"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {user?.first_name} {user?.last_name}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span>
                      {user.city || 'Location'},{' '}
                      {user.country || 'Country'}
                    </span>
                    <Image
                      src={`https://flagcdn.com/w40/${user.country?.toLowerCase() || 'us'}.png`} 
                      alt="Country flag"
                      height={100}
                      width={100}
                      className="w-6 h-4 ml-2 rounded-sm"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">4.8</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>{user.gender}</span>
                    <span className="text-gray-400">•</span>
                    <span>{user.sexual_preference}</span>
                  </div>
                  {user?.email && (
                    <div className="text-gray-300 mt-2 flex items-center gap-2">
                      <span className="font-semibold">Email: </span>
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
              {/* BIRth day */}
              {user.birth_date && (
                <div className="text-gray-300 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span>Born on: {new Date(user.birth_date).toLocaleDateString()}</span>
                </div>
              )}
              {}
              {/* LOGOUT BUTTON */}
              <button
                onClick={lougout}
                className="mt-2 px-4 mb-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-all duration-300 border border-white/20"
              >
                Logout
              </button>


              {/* Biography */}
              <p className="text-gray-300 mb-6 leading-relaxed bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                {user.biography || 'No biography provided yet.'}
              </p>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: Eye, label: 'Views', value: user.stats?.views || 0 },
                  { icon: Heart, label: 'Likes', value: user.stats?.likes || 0 },
                  { icon: Star, label: 'Matches', value: user.stats?.matches || 0 },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
                  >
                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-purple-300" />
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
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
            <UserTags tags={user.tags} />
          </div>

          {/* Photos Grid */}
          <div className="lg:col-span-2">
            <PhotosGallery
              photos={user.photos}
              backendUrl={BACKEND_URL}
            />
          </div>

          {/* Edit Modal */}
          {isEditing && (
              <EditProfileDialog setIsEditing={setIsEditing} />
          )}
          
        </div>
      </div>
    </div>
  );
}
