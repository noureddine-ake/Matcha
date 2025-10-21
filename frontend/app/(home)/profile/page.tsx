'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function SearchPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-purple-200">Manage your account</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Profile Header */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white">Sarah, 26</h2>
          <p className="text-purple-200 mt-1">New York, NY</p>
          <p className="text-white/60 text-sm mt-2">
            Fame Rating: ⭐⭐⭐⭐⭐ (4.8)
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Profile Views', value: '234' },
            { label: 'Likes', value: '45' },
            { label: 'Matches', value: '12' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 text-center"
            >
              <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text">
                {stat.value}
              </p>
              <p className="text-white/60 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {[
            { label: 'Edit Profile', icon: '✏️' },
            { label: 'Settings', icon: '⚙️' },
            { label: 'Privacy', icon: '🔒' },
            { label: 'Help & Support', icon: '❓' },
            { label: 'Logout', icon: '🚪' },
          ].map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="w-full p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-purple-400/50 hover:bg-white/15 transition-all text-left flex items-center justify-between group"
            >
              <span className="text-white font-semibold">{item.label}</span>
              <span className="text-xl group-hover:translate-x-1 transition-transform">
                {item.icon}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
