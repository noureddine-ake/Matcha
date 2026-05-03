'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Heart, Info, Loader, X, MapPin, Award, Clock, User, Globe } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import { Suggestions, useDiscover } from '@/contexts/discover-context';
import MatchPopup, { MatchData } from '@/components/matchPopup';
import { getImageUrl } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

export default function DiscoverPage() {
  const discover = useDiscover();
  const [matchData, setMatchData] = useState<MatchData | null>(null);


  useEffect(() => {
    discover.fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);

  const controls = useAnimation();
  const currentProfile: Suggestions | undefined = discover?.suggestions?.[0];

  // Handle swiping
  const handleSwipe = async (direction: 'left' | 'right') => {
    try {
      controls.start({
        x: direction === 'left' ? -300 : 300,
        opacity: 0,
        transition: { duration: 0.3 },
      });

      if (direction === 'right' && discover?.suggestions?.length > 0) {
        const likedUserUsername = discover.suggestions[0].username;
        const res = await api.post(`/like/${likedUserUsername}`);
        if (res.data.isMatch) {
          setMatchData(res.data.likedUser);
        }
      }

      setShowSidebar(false);
      setCurrentImageIndex(0);
      discover.setSuggestions((prev) => [...prev.slice(1)]);
      controls.set({ x: 0, opacity: 1 });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle image click to go to next image
  const handleImageClick = () => {
    if (currentProfile) {
      setCurrentImageIndex((prev) => (prev + 1) % currentProfile.photos.length);
    }
  };

  const handleToggleSidebar = () => setShowSidebar((prev) => !prev);

  if (discover.loading) {
    return (
      <div className="text-red-400 w-full flex justify-center items-center h-[100px]">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (discover.error) {
    return (
      <div className="text-red-400 w-full flex justify-center items-center h-[100px]">
        Error loading suggestions
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 h-[calc(100vh-236px)] flex flex-col justify-start"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white my-2">Discover</h1>
        <p className="text-purple-200">Swipe or tap to explore profiles</p>
      </div>

      {matchData && <MatchPopup matchData={matchData} setMatchData={setMatchData}/>}

      <motion.div
        className="w-full max-w-md mx-auto select-none h-full flex flex-col justify-center"
      >
        {discover?.suggestions?.length > 0 && currentProfile ? (
          <motion.div
            key={currentProfile.id}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) handleSwipe('right');
              else if (info.offset.x < -100) handleSwipe('left');
            }}
            className="relative group"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-linear-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>

            {/* Card */}
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              {/* Image Section */}
              <div
                className="relative min-h-96 md:min-h-[500px] cursor-pointer"
                onClick={handleImageClick}
              >
                {currentProfile.photos[currentImageIndex] && (
                  <Image
                    src={getImageUrl(currentProfile.photos[currentImageIndex].photo_url)}
                    alt={currentProfile.username}
                    fill
                    className={`object-cover transition-all duration-500 ${
                      showSidebar ? 'brightness-50' : ''
                    }`}
                  />
                )}
              </div>

              {/* Info Toggle Button */}
              <motion.button
                onClick={handleToggleSidebar}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Info className="w-5 h-5 text-white" />
              </motion.button>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <h2 className="text-3xl font-bold">
                  {currentProfile.username}
                </h2>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center min-h-96 md:min-h-[500px] bg-gray-500/50 rounded-2xl text-white/20 text-md">
            No suggestions available
          </div>
        )}
        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 justify-center [@media(hover:none)]:hidden">
          <motion.button
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center hover:bg-white/20 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-8 h-8 text-white" />
          </motion.button>
          <motion.button
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSidebar && currentProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bh-green-300 bg-black/60 z-50"
              onClick={handleToggleSidebar}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-22.5  bottom-22.5 h- w-full max-w-md bg-linear-to-b from-black/20 to-purple-600/30 backdrop-blur-lg z-50 overflow-y-auto no-scrollbar"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">{currentProfile.username}&apos;s Profile</h2>
                  <button
                    onClick={handleToggleSidebar}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" /> About
                    </h3>
                    <div className="space-y-3 text-white/90">
                      <div className="flex items-center gap-3">
                        <span className="text-purple-300 min-w-[80px]">Name:</span>
                        <span>{currentProfile.first_name} {currentProfile.last_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-purple-300 min-w-[80px]">Age:</span>
                        <span>{currentProfile.age} years old</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-purple-300 min-w-[80px]">Gender:</span>
                        <span className="capitalize">{currentProfile.gender}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" /> Location
                    </h3>
                    <div className="space-y-3 text-white/90">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-purple-300" />
                        <span>{currentProfile.city}, {currentProfile.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-purple-300 min-w-[80px]">Distance:</span>
                        <span>{currentProfile.distance} km away</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5" /> Fame Rating
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                          style={{ width: `${Math.min(parseFloat(currentProfile.fame_rating), 100)}%` }}
                        />
                      </div>
                      <span className="text-white font-bold">{currentProfile.fame_rating}</span>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Status
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentProfile.is_online 
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                          : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                      }`}>
                        {currentProfile.is_online ? 'Online now' : 'Offline'}
                      </span>
                    </div>
                    {currentProfile.last_seen && (
                      <p className="text-white/60 text-sm">
                        Last seen: {new Date(currentProfile.last_seen).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {currentProfile.biography && (
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                      <h3 className="text-lg font-semibold text-white mb-3">Biography</h3>
                      <p className="text-white/80 leading-relaxed">{currentProfile.biography}</p>
                    </div>
                  )}

                  {currentProfile.tags && currentProfile.tags.length > 0 && (
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                      <h3 className="text-lg font-semibold text-white mb-3">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-3 py-1.5 bg-purple-500/20 border border-purple-400/30 text-purple-200 rounded-full text-sm font-medium"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                    <h3 className="text-lg font-semibold text-white mb-4">Photos ({currentProfile.photos.length})</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {currentProfile.photos.map((photo, index) => (
                        <div 
                          key={photo.id} 
                          className={`relative aspect-square rounded-xl overflow-hidden ${
                            photo.is_profile_picture ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-purple-900' : ''
                          }`}
                        >
                          <Image
                            src={getImageUrl(photo.photo_url)}
                            alt={`Photo ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {photo.is_profile_picture && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-purple-500/80 text-white text-xs rounded-md font-medium">
                              Profile
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
