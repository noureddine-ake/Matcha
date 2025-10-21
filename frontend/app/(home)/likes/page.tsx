"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Flame } from 'lucide-react';

export default function LikesPage() {
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-2xl aspect-square">
              <Image
                src={`/profile-photo-.jpg?height=300&width=300&query=profile photo ${i}`}
                alt={`Profile ${i}`}
                width={100}
                height={100}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div>
                  <p className="text-white font-bold text-lg">Sarah, 26</p>
                  <p className="text-white/80 text-sm">Liked you 2h ago</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
