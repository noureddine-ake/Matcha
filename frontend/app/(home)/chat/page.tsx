'use client';

import React from 'react';
import { motion } from 'framer-motion';
import MatchesCarousel from '@/components/matchesList';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <MatchesCarousel />

      <div className="space-y-3 max-w-2xl mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: i * 0.2 }}
            onClick={router.push(`/chat/${i}`)}
            className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-purple-400/50 hover:bg-white/15 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">Sarah</p>
                <p className="text-white/60 text-sm truncate">
                  That sounds amazing! When are you free?
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white/60 text-xs">2m ago</p>
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-1"></div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
