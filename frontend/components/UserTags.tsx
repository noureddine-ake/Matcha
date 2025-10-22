// src/components/UserTags.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Hash, X } from "lucide-react";
import api from "@/lib/api";

interface Tag {
  id: number | string;
  name: string;
}

interface UserTagsProps {
  tags: Tag[]; // initial tags from parent (e.g., from SSR or parent state)
}

export default function UserTags({ tags: initialTags }: UserTagsProps) {
  const [userTags, setUserTags] = useState<Tag[]>(initialTags);
  const [newTag, setNewTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync internal state if parent updates tags (e.g., after external change)
  useEffect(() => {
    setUserTags(initialTags);
  }, [initialTags]);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    setLoading(true);
    setError(null);

    try {
     const res = await api.post("profile/add-tag", { tagName: newTag.trim() });
      setUserTags((prev) => [...prev, res.data.tag]);
      setNewTag("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to add tag");
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        // @ts-expect-error: axios error type
        setError(err.response?.data?.error || "Failed to add tag");
      } else {
        setError("Failed to add tag");
      }
    }
    finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: number | string) => {
    setLoading(true);
    setError(null);

    try {
       // profileRoute.delete(
//   '/remove-tag/:tagId',
//   JWT.verifyAndDecodeToken,
//   removeUserTag
// ); update for that api call
        await api.delete(`profile/remove-tag/${tagId}`);
        setUserTags((prev) => prev.filter((tag) => tag.id !== tagId));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to remove tag");
        } else if (typeof err === 'object' && err !== null && 'response' in err) {
          // @ts-expect-error: axios error type
          setError(err.response?.data?.error || "Failed to remove tag");
        } else {
          setError("Failed to remove tag");
        }
      }
      
    finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
    >
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Hash className="w-6 h-6 text-purple-400" />
        Interests
      </h2>

      {/* Add new tag form */}
      <form onSubmit={handleAddTag} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add an interest..."
          className="flex-1 px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newTag.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
        >
          Add
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {userTags.length > 0 ? (
          userTags.map((tag) => (
            <motion.div
              key={tag.id}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <motion.span
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium cursor-default hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border border-white/20 flex items-center gap-1"
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  disabled={loading}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-200"
                  aria-label="Remove tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-400">No interests added yet.</p>
        )}
      </div>
    </motion.div>
  );
}