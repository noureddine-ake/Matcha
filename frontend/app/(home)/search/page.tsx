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
        <h1 className="text-4xl font-bold text-white mb-2">Advanced Search</h1>
        <p className="text-purple-200">Find your perfect match</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Age Range */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
          <label className="text-white font-semibold mb-3 block">
            Age Range
          </label>
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Min"
              className="flex-1 h-12 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl px-4 focus:outline-none focus:border-purple-400"
            />
            <input
              type="number"
              placeholder="Max"
              className="flex-1 h-12 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl px-4 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Location */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
          <label className="text-white font-semibold mb-3 block">
            Location
          </label>
          <input
            type="text"
            placeholder="City or distance"
            className="w-full h-12 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl px-4 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Interests */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
          <label className="text-white font-semibold mb-3 block">
            Interests
          </label>
          <div className="flex flex-wrap gap-2">
            {['#travel', '#yoga', '#music', '#fitness', '#art', '#cooking'].map(
              (tag) => (
                <button
                  key={tag}
                  className="px-4 py-2 bg-purple-400/20 border border-purple-400 text-purple-200 rounded-full hover:bg-purple-400/40 transition-all"
                >
                  {tag}
                </button>
              )
            )}
          </div>
        </div>

        <motion.button
          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Search
        </motion.button>
      </div>
    </motion.div>
  );
}
