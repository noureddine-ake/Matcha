"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, User, XCircle, Loader } from "lucide-react";
import { useGlobal } from "@/contexts/globalcontext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/constants/env";

interface Viewer {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  completed_profile: boolean;
  viewed_at?: string;
  profile_picture?: string | null;
  city?: string;
  country?: string;
}

export default function ProfileViewsPage() {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthToken } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    const fetchViewers = async () => {
      try {
        const res = await api.get("/profile/views", {
          headers: {
            // Authorization: `Bearer ${getAuthToken?.()}`,
          },
        });

        const data = res.data?.viewers;
        if (!Array.isArray(data)) {
          setViewers([]);
        } else {
          setViewers(data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchViewers();
  }, [getAuthToken]);

  // === Loading ===
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10"
        >
          <Loader className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
          <p className="text-gray-300">Loading profile views...</p>
        </motion.div>
      </div>
    );
  }

  // === Error / Empty ===
  if (error || viewers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 text-center max-w-md border border-white/10 shadow-2xl"
        >
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">No Views Yet</h2>
          <p className="text-gray-300 mb-6">
            {error || "No one has viewed your profile yet."}
          </p>
        </motion.div>
      </div>
    );
  }

  // === Main Content ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8 flex items-center gap-3"
        >
          <Eye className="w-8 h-8 text-purple-400" />
          Who Viewed You
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {viewers.map((v) => (
            <div
              key={v.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 border border-white/20 hover:shadow-xl hover:shadow-purple-500/20 transition-all"
            >
              {/* Profile Picture */}
              <img
                src={
                  v.profile_picture
                    ? `${BACKEND_URL}/${v.profile_picture}`
                    : "/default-avatar.png"
                }
                alt={`${v.first_name} ${v.last_name}`}
                className="w-12 h-12 rounded-full object-cover border border-white/20"
              />

              {/* Viewer Info */}
              <div className="flex-1">
                <p
                  className="font-semibold text-white cursor-pointer hover:underline"
                  onClick={() => router.push(`/users/${v.username}`)}
                >
                  {v.first_name} {v.last_name} @{v.username}
                </p>
                <p className="text-gray-400 text-sm">
                  {v.city && v.country ? `• ${v.city}, ${v.country}` : ""}
                </p>
                {v.viewed_at && (
                  <p className="text-gray-500 text-xs">
                    Viewed at: {new Date(v.viewed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
