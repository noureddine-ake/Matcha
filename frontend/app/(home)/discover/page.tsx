'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Image from 'next/image';

export default function DiscoverPage () {
  const profiles = [
    {
      id: 1,
      name: 'Sarah',
      age: 26,
      image: '/woman-profile.png',
      interests: ['#travel', '#yoga', '#coffee'],
      bio: 'Adventure seeker and coffee enthusiast',
    },
    {
      id: 2,
      name: 'Emma',
      age: 24,
      image: '/woman-profile.png',
      interests: ['#art', '#music', '#photography'],
      bio: 'Artist and music lover',
    },
    {
      id: 3,
      name: 'Jessica',
      age: 27,
      image: '/woman-profile.png',
      interests: ['#fitness', '#cooking', '#travel'],
      bio: 'Fitness enthusiast and foodie',
    },
  ];
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const currentProfile = profiles[currentProfileIndex];
  const handleLike = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    }
  };
  const handlePass = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Discover</h1>
        <p className="text-purple-200">Swipe to find your perfect match</p>
      </div>

      {currentProfile && (
        <motion.div
          key={currentProfile.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md mx-auto"
        >
          {/* Profile Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              {/* Image */}
              <div className="relative h-96 overflow-hidden">
                <Image
                  src={currentProfile.image || '/placeholder.svg'}
                  alt={currentProfile.name}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  <p className="text-purple-200 mt-1">{currentProfile.bio}</p>
                </div>

                {/* Interests */}
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-purple-400/20 border border-purple-400 text-purple-200 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 justify-center">
            <motion.button
              onClick={handlePass}
              className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">✕</span>
            </motion.button>
            <motion.button
              onClick={handleLike}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className="w-8 h-8 text-white fill-white" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
