'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShieldOff, Loader, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const BASE_URL = process.env.BACKEND_URL || "http://backend:5000"

interface BlockedUser {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
}

export default function BlockedPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchBlockedUsers = async () => {
    try {
      const { data } = await api.get<{ blockedUsers: BlockedUser[] }>('/users/blocked');
      setBlockedUsers(data.blockedUsers || []);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (username: string) => {
    try {
      await api.delete(`/users/block/${username}`);
      setBlockedUsers(prev => prev.filter(u => u.username !== username));
      toast.success(`Unblocked ${username}`);
    } catch (err) {
      console.error('Error unblocking user:', err);
      toast.error('Failed to unblock user');
    }
  };

  const handleViewProfile = (username: string) => {
    router.push(`/profile/${username}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-236px)]">
        <Loader className="w-8 h-8 text-purple-400 animate-spin" />
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
        <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">Blocked Users</h1>
        <p className="text-purple-200">Manage your blocked users</p>
      </div>

      {blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <ShieldOff className="w-12 h-12 text-white/30" />
          </div>
          <p className="text-white/60 text-lg">No blocked users</p>
          <p className="text-white/40 text-sm mt-1">Users you block will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {blockedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl aspect-square">
                {user.profile_picture ? (
                  <Image
                    src={BASE_URL + user.profile_picture}
                    alt={`Profile ${user.username}`}
                    fill
                    className="object-cover"
                    onClick={() => handleViewProfile(user.username)}
                  />
                ) : (
                  <div 
                    className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                    onClick={() => handleViewProfile(user.username)}
                  >
                    <span className="text-4xl font-bold text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProfile(user.username);
                      }}
                      className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center"
                    >
                      <UserPlus className="w-5 h-5 text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnblock(user.username);
                      }}
                      className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <ShieldOff className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>
              <p className="text-white font-medium mt-2 text-center">{user.username}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
