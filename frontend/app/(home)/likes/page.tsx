'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Flame } from 'lucide-react';
import api from '@/lib/api';
import { Photo } from '@/contexts/globalcontext';


const BASE_URL = process.env.BACKEND_URL || "http://backend:5000"

interface Likes {
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
  last_seen: string;
  is_online: boolean;
  age: number;
  distance: number;
  photos: Photo[];
  tags: string[];
}

export default function LikesPage() {
  const [likes, setLikes] = useState<Likes[] | null>([]);

  const fetchLikes = async () => {
    try {
      const { data } = await api.get<Likes[]>('/likes');
      setLikes(data);
      console.log(data);
    } catch (err: unknown) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchLikes();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <Flame className="w-12 h-12 text-orange-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">Your Likes</h1>
        <p className="text-purple-200">People who liked you</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {likes && likes.map((like, index) => (
          <motion.div
            key={like.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-2xl aspect-square">
              <Image
                src={BASE_URL + like.photos[0].photo_url}
                alt={`Profile ${like.id}`}
                width={100}
                height={100}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div>
                  <p className="text-white font-bold text-lg">{like.username}</p>
                  <p className="text-white/80 text-sm">Liked you {}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
