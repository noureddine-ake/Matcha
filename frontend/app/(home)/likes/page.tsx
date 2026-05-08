'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { LikesProvider, useLikes } from '@/contexts/likes-context';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000"

function LikesContent() {
  const { likes, loading, hasMore, fetchMore, fetchLikes } = useLikes();

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  if (loading && likes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

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
        {likes.map((like, index) => (
          <motion.div
            key={like.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-2xl aspect-square">
              <Image
                src={like.photos[0]?.photo_url || '/placeholder.jpg'}
                alt={`Profile ${like.id}`}
                width={100}
                height={100}
                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div>
                  <Link href={`/profile/${like.username}`} className="hover:underline">
                    <p className="text-white font-bold text-lg">{like.username}</p>
                  </Link>
                  <p className="text-white/80 text-sm">Liked you</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={fetchMore}
            disabled={loading}
            className="px-6 py-3 bg-purple-500/80 hover:bg-purple-500 text-white rounded-full transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function LikesPage() {
  return (
    <LikesProvider>
      <LikesContent />
    </LikesProvider>
  );
}
