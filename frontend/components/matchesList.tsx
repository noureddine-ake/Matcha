'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Skeleton } from './ui/skeleton';
import { Suggestions } from '@/contexts/discover-context';

const MatchesCarousel = () => {
  const backend_url = process.env.BACKEND_URL || 'http://backend:5000';
  const [matches, setMatches] = useState<Suggestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await api.get('/matches');
        setMatches(res.data.matches || []);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex gap-4 px-4">
        {loading ? (
          [0, 1, 2, 3].map((key) => (
            <Skeleton
              key={key}
              className="w-20 h-20 rounded-full bg-gray-500"
            />
          ))
        ) : error ? (
          <p className="text-red-500 text-center h-20">{error}</p>
        ) : (
          matches.map((match) => (
            <motion.div
              key={match.id}
              className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-purple-500 overflow-hidden relative cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (window.location.href = `/chat/${match.id}`)}
            >
              <Image
                src={
                  backend_url +
                  match.photos.find((item) => item.is_profile_picture)
                    ?.photo_url
                }
                alt={`${match.first_name} ${match.last_name}`}
                fill
                className="object-cover"
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MatchesCarousel;
