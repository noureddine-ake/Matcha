"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, ShieldCheck, LogOut, UserCircle } from "lucide-react"

interface Profile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_verified: boolean
  avatar?: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile")
        setProfile(res.data.profile)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.error || "Failed to load profile")

        // Redirect to login if unauthorized
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/auth/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const logout = async () => {
    try {
      await api.post("/profile/logout"); 
    } catch (err) {
      console.error(err); // optional: log error
    } finally {
      // redirect to home in any case
      window.location.href = "/";
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-xl">Loading your profile...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="text-center max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
        <div className="text-red-400 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
        <p className="text-purple-200 mb-6">{error}</p>
        <button 
          onClick={() => router.push("/auth/login")}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Go to Login
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 flex justify-center items-center min-h-screen p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Your Profile
              </motion.h1>
              <p className="text-purple-200">Manage your account information</p>
            </div>

            <div className="flex flex-col items-center space-y-8">
              {/* Avatar */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                {profile?.avatar ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50"></div>
                    <img
                      src={profile.avatar}
                      alt="Avatar"
                      className="relative w-32 h-32 rounded-full object-cover border-4 border-white/20"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50"></div>
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl text-white border-4 border-white/20">
                      <UserCircle className="w-16 h-16" />
                    </div>
                  </div>
                )}
                
                {!profile?.is_verified && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="absolute -bottom-2 -right-2 bg-yellow-500 text-xs text-white px-2 py-1 rounded-full"
                  >
                    Unverified
                  </motion.div>
                )}
              </motion.div>

              {/* Profile Info */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full max-w-md space-y-6"
              >
                <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <User className="text-purple-400 w-6 h-6 mr-4" />
                  <div>
                    <p className="text-sm text-purple-300">Username</p>
                    <p className="text-lg font-medium text-white">{profile?.username}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <Mail className="text-purple-400 w-6 h-6 mr-4" />
                  <div>
                    <p className="text-sm text-purple-300">Email</p>
                    <p className="text-lg font-medium text-white">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <User className="text-purple-400 w-6 h-6 mr-4" />
                  <div>
                    <p className="text-sm text-purple-300">Full Name</p>
                    <p className="text-lg font-medium text-white">{profile?.first_name} {profile?.last_name}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <ShieldCheck className="text-purple-400 w-6 h-6 mr-4" />
                  <div>
                    <p className="text-sm text-purple-300">Account Status</p>
                    <p className="text-lg font-medium text-white flex items-center">
                      {profile?.is_verified ? (
                        <span className="flex items-center text-green-400">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-400">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                          Unverified
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Logout Button */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full max-w-xs"
              >
                <button 
                  onClick={logout}
                  className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-lg transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}