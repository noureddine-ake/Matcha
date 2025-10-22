// ```jsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Heart, MessageCircle, Eye, Edit3, MapPin, Star, Calendar, Flag, Globe, Hash, Upload } from "lucide-react";
import { useGlobal } from "@/contexts/globalcontext"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function ProfilePage() {
  const {fetchProfile, updateProfile, user, profile, tags, photos, stats, loading, error, } = useGlobal()
  const [isEditing, setIsEditing] = useState(false);
  const [newPhotos, setNewPhotos] = useState([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  


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

  const handleSave = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const updates = {};

    formData.forEach((value, key) => {
      if (value) {
        if (['latitude', 'longitude'].includes(key)) {
          updates[key] = Number(value);
        } else if (key === 'birth_date') {
          updates[key] = value.toString();
        } else if (key === 'interests') {
          try {
            updates[key] = JSON.parse(value.toString());
          } catch {
            updates[key] = value.toString().split(',').map(tag => tag.trim());
          }
        } else {
          updates[key] = value;
        }
      }
    });

    // Handle photo uploads
    const photoInputs = form.querySelectorAll('input[type="file"]');
    const photoFiles = [];
    photoInputs.forEach((input) => {
      if (input.files && input.files.length > 0) {
        photoFiles.push(input.files[0]);
      }
    });
    if (photoFiles.length > 0) updates.photos = photoFiles;

    await updateProfile(updates);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
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
              <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                {photos.length > 0 && photos.find(p => p.is_profile_picture) ? (
                  <img
                    src={`${BACKEND_URL}${photos.find(p => p.is_profile_picture)?.photo_url}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-white/50" />
                  </div>
                )}
              </div>
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
                    <span>{profile?.city || 'Location'}, {profile?.country || 'Country'}</span>
                    {/* <img 
                      src={`https://flagcdn.com/w40/${profile?.country?.toLowerCase() || 'us'}.png`} 
                      alt="Country flag" 
                      className="w-6 h-4 ml-2 rounded-sm"
                    /> */}
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
                  {user?.email && (
                    <div className="text-gray-300 mt-2 flex items-center gap-2">
                      <span className="font-semibold">Email: </span>
                      {user.email}
                    </div>
                  )}
                </div>
                
              </div>
             {/* BIRth day */} 
              {profile?.birth_date && (
                <div className="text-gray-300 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span>Born on: {new Date(profile.birth_date).toLocaleDateString()}</span>
                </div>
              )}

              


              {/* Biography */}
              <p className="text-gray-300 mb-6 leading-relaxed bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                {profile?.biography || "No biography provided yet."}
              </p>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Eye, label: 'Views', value: stats?.views || 0 },
                  { icon: Heart, label: 'Likes', value: stats?.likes || 0 },
                  { icon: Star, label: 'Matches', value: stats?.matches || 0 },
                  { icon: MessageCircle, label: 'Messages', value: stats?.messages || 0 }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
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
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Hash className="w-6 h-6 text-purple-400" />
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <motion.span
                      key={tag.id}
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium cursor-pointer hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border border-white/20"
                    >
                      {tag.name}
                    </motion.span>
                  ))
                ) : (
                  <p className="text-gray-400">No interests added yet.</p>
                )}
              </div>
            </motion.div>

            {/* Edit Modal */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-white/20 shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Edit3 className="w-6 h-6 text-purple-400" /> Edit Profile
                  </h3>

                  <form
                    onSubmit={handleSave}
                    className="space-y-4"
                  >
                    {/* Name & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                          <span className="w-4 h-4"></span>
                          First Name
                        </label>
                        <input
                          name="first_name"
                          defaultValue={user?.first_name || ""}
                          className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                          <span className="w-4 h-4"></span>
                          Last Name
                        </label>
                        <input
                          name="last_name"
                          defaultValue={user?.last_name || ""}
                          className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <span className="w-4 h-4"><Globe className="w-4 h-4" /></span>
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={user?.email || ""}
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                      />
                    </div>

                    {/* Profile Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                          <span className="w-4 h-4"></span>
                          Gender
                        </label>
                        <select
                          name="gender"
                          defaultValue={profile?.gender || ""}
                          className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                          <span className="w-4 h-4"></span>
                          Sexual Preference
                        </label>
                        <select
                          name="sexual_preference"
                          defaultValue={profile?.sexual_preference || ""}
                          className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <span className="w-4 h-4"><Calendar className="w-4 h-4" /></span>
                        Birth Date
                      </label>
                      <input
                        name="birth_date"
                        type="date"
                        defaultValue={profile?.birth_date || ""}
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <span className="w-4 h-4"><MapPin className="w-4 h-4" /></span>
                        City
                      </label>
                      <input
                        name="city"
                        defaultValue={profile?.city || ""}
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <span className="w-4 h-4"><Flag className="w-4 h-4" /></span>
                        Country
                      </label>
                      <input
                        name="country"
                        defaultValue={profile?.country || ""}
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <span className="w-4 h-4"><Hash className="w-4 h-4" /></span>
                        Biography
                      </label>
                      <textarea
                        name="biography"
                        defaultValue={profile?.biography || ""}
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 min-h-[100px]"
                        rows={3}
                      />
                    </div>

                    {/* Interests */}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <span className="w-4 h-4"><Hash className="w-4 h-4" /></span>
                        Interests (comma separated)
                      </label>
                      <input
                        name="interests"
                        defaultValue={profile?.interests?.join(', ') || ""}
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-white/10 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                      />
                    </div>

                    {/* Photos */}
                   {/* Photos */}
<div>
  <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
    <Camera className="w-4 h-4" />
    Upload Photos (up to 5)
  </label>

  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="relative group">
        <input
          type="file"
          accept="image/*"
          id={`photo${i}`}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setNewPhotos((prev) => {
                const updated = [...prev];
                updated[i] = file;
                return updated;
              });
            }
          }}
        />
        <label
          htmlFor={`photo${i}`}
          className="block w-full h-20 bg-gray-800 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-purple-500 transition-all duration-300 group-hover:bg-gray-700/50 overflow-hidden relative"
        >
          {newPhotos[i] ? (
            <img
              src={URL.createObjectURL(newPhotos[i])}
              alt={`photo-${i}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
          )}
        </label>
      </div>
    ))}
  </div>

  {newPhotos.length > 0 && (
    <div className="mt-4 text-right">
      <button
        type="button"
        onClick={async () => {
          await updateProfile({ photos: newPhotos });
          setNewPhotos([]);
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-md border border-white/10 transition-all duration-300"
      >
        <Upload className="w-4 h-4" />
        Save Photos
      </button>
    </div>
  )}
</div>


                    <div className="flex gap-3 pt-6">
                      <button
                        type="button"
                        onClick={toggleEdit}
                        className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white py-3 px-4 rounded-lg transition-all duration-300 border border-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg transition-all duration-300 border border-white/20 shadow-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Photos Grid */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Camera className="w-6 h-6 text-purple-400" />
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
                      whileHover={{ scale: 1.03 }}
                      className="relative group cursor-pointer"
                    >
                      <div className={`rounded-xl overflow-hidden aspect-square transition-all duration-300 ${photo.is_profile_picture ? 'ring-4 ring-purple-500' : 'hover:ring-2 hover:ring-purple-400'}`}>
                        <img
                          src={`${BACKEND_URL}${photo.photo_url}`}
                          alt="Profile photo"
                          className="w-full h-full object-cover"
                        />
                        {photo.is_profile_picture && (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-medium border border-white/20">
                            Profile
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
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
// ```