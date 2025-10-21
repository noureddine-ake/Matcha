'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Heart, Info, Loader, X } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import { Photo } from '@/contexts/globalcontext';

interface Suggestions {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  gender: 'male' | 'female';
  sexual_preference: 'male' | 'female';
  biography: string | null;
  city: string | null;
  country: string | null;
  fame_rating: string;
  photos: Photo[];
  tags: string[];
}

export default function DiscoverPage() {
  const backend_url = process.env.BACKEND_URL || 'http://backend:5000'
  const [suggestionsResult, setSuggestionsResult] = useState<Suggestions[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);

      try {
        const { data } = await api.post('/suggestions');
        console.log('dataqqqqq', data.suggestionsResult);
        setSuggestionsResult(data.suggestionsResult);

        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);


  
  const controls = useAnimation();
  const currentProfile = suggestionsResult[currentProfileIndex];
  
  
  // Handle swiping
  const handleSwipe = (direction: 'left' | 'right') => {
    controls
      .start({
        x: direction === 'left' ? -300 : 300,
        opacity: 0,
        transition: { duration: 0.3 },
      })
      .then(() => {
        setShowDetails(false);
        setCurrentImageIndex(0);
        setCurrentProfileIndex((prev) => (prev + 1) % suggestionsResult.length);
        controls.set({ x: 0, opacity: 1 });
      });
  };

  // Handle image click to go to next image
  const handleImageClick = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentProfile.photos.length);
  };

  // Toggle showing more details
  const handleToggleDetails = () => setShowDetails((prev) => !prev);

  if (loading) {
    console.log('⏳ Showing loading state');
    return (
      <div className="text-red-400 w-full flex justify-center items-center h-[100px]">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (error) {
    console.log('❌ Showing error state');
    return (
      <div className="text-red-400 w-full flex justify-center items-center h-[100px]">
        Error loading suggestions
      </div>
    );
  }

  if (!suggestionsResult.length || !currentProfile) {
    console.log('⚠️ Showing no suggestions state');
    return (
      <div className="text-white w-full flex justify-center items-center h-[100px]">
        No suggestions available
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

      {suggestionsResult.length > 0 && currentProfile && (
        <motion.div
          key={currentProfile.id}
          animate={controls}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) handleSwipe('right');
            else if (info.offset.x < -100) handleSwipe('left');
          }}
          className="w-full max-w-md mx-auto select-none h-full flex flex-col justify-center"
        >
          <div className="relative group">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>

            {/* Card */}
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              {/* Image Section */}
              <div
                className="relative min-h-96 md:min-h-[500px] cursor-pointer"
                onClick={handleImageClick}
              >
                {currentProfile?.photos?.length > 0 &&
                  currentProfile.photos[currentImageIndex] && (
                    <Image
                      src={`${backend_url}${currentProfile.photos[currentImageIndex].photo_url}`}
                      alt={currentProfile.username}
                      fill
                      className={`object-cover transition-all duration-500 ${
                        showDetails ? 'brightness-50' : ''
                      }`}
                    />
                  )}
              </div>

              {/* Details overlay */}
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={
                  showDetails ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }
                }
                transition={{ duration: 0.4 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white"
              >
                <h2 className="text-3xl font-bold">
                  {currentProfile.username}
                </h2>
                <p className="text-purple-200 mt-1">
                  {currentProfile.biography}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentProfile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-purple-400/20 border border-purple-400 text-purple-200 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Info Toggle Button */}
              <motion.button
                onClick={handleToggleDetails}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Info className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
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
      )}
    </motion.div>
  );
}
