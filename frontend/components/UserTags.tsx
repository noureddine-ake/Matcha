"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Hash, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface Tag {
  id: number | string;
  name: string;
}

interface UserTagsProps {
  tags: Tag[];
  editable?: boolean;
}

export default function UserTags({ tags: initialTags, editable = true }: UserTagsProps) {
  const [userTags, setUserTags] = useState<Tag[]>(initialTags);
  const [newTag, setNewTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      let message = "Failed to add tag";
      if (err && typeof err === 'object') {
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
        if (axiosErr.response?.data?.error) {
          message = axiosErr.response.data.error;
        } else if (axiosErr.message) {
          message = axiosErr.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: number | string) => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`profile/remove-tag/${tagId}`);
      setUserTags((prev) => prev.filter((tag) => tag.id !== tagId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to remove tag");
      } else if (typeof err === "object" && err !== null && "response" in err) {
        setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to remove tag");
      } else {
        setError("Failed to remove tag");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
    >
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Hash className="w-6 h-6 text-purple-400" />
        Interests
      </h2>

      {editable && (
        <form onSubmit={handleAddTag} className="mb-4">
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add an interest..."
                disabled={loading}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl pl-12 pr-4 focus-visible:ring-2 focus-visible:ring-purple-400"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !newTag.trim()}
              className="h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold px-6 shadow-lg disabled:opacity-50"
            >
              Add
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {userTags.length > 0 ? (
          userTags.map((tag) => (
            <motion.div
              key={tag.id}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <motion.span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium cursor-default hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border border-white/20 flex items-center gap-1">
                {tag.name}
                {editable && (
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    disabled={loading}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-200"
                    aria-label="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.span>
            </motion.div>
          ))
        ) : (
          <p className="text-white/60">No interests added yet.</p>
        )}
      </div>
    </motion.div>
  );
}
