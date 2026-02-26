"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, ShieldOff, Loader, Calendar as CalendarIcon } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import { useGlobal, FormUpdateUser } from "@/contexts/globalcontext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";

const BASE_URL = process.env.BACKEND_URL || "http://backend:5000";

interface BlockedUser {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Select..."
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            backgroundSize: "16px"
          }}
        >
          <option value="" className="bg-purple-900">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-purple-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "blocked">("edit");
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const router = useRouter();

  const { user, updateProfile, loading: profileLoading } = useGlobal();

  const [formData, setFormData] = useState<Partial<FormUpdateUser>>({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    username: user?.username || "",
    email: user?.email || "",
    gender: user?.gender || "",
    sexual_preference: user?.sexual_preference || "",
    biography: user?.biography || "",
    birth_date: user?.birth_date || "",
    city: user?.city || "",
    country: user?.country || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        email: user.email || "",
        gender: user.gender || "",
        sexual_preference: user.sexual_preference || "",
        biography: user.biography || "",
        birth_date: user.birth_date || "",
        city: user.city || "",
        country: user.country || "",
      });
    }
  }, [user]);

  const fetchBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const { data } = await api.get<{ blockedUsers: BlockedUser[] }>("/users/blocked");
      setBlockedUsers(data.blockedUsers || []);
    } catch (err) {
      console.error("Error fetching blocked users:", err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "blocked") {
      fetchBlockedUsers();
    }
  }, [isOpen, activeTab]);

  const handleUnblock = async (username: string) => {
    try {
      await api.delete(`/users/block/${username}`);
      setBlockedUsers((prev) => prev.filter((u) => u.username !== username));
      toast.success(`Unblocked ${username}`);
    } catch (err) {
      console.error("Error unblocking user:", err);
      toast.error("Failed to unblock user");
    }
  };

  const handleViewProfile = (username: string) => {
    router.push(`/profile/${username}`);
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name?.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!formData.last_name?.trim()) {
      toast.error("Last name is required");
      return;
    }
    if (!formData.email?.trim()) {
      toast.error("Email is required");
      return;
    }
    if (formData.biography && formData.biography.length > 150) {
      toast.error("Bio too long, must be less than 150 characters");
      return;
    }
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      if (actualAge < 18) {
        toast.error("You must be at least 18 years old");
        return;
      }
    }

    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed right-0 top-[90px] bottom-[90px] w-full max-w-2xl bg-linear-to-t from-purple-600/30 to-black/20 backdrop-blur-lg z-50 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                    activeTab === "edit"
                      ? "bg-white/10 text-white border-b-2 border-purple-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-5 h-5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setActiveTab("blocked")}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                    activeTab === "blocked"
                      ? "bg-white/10 text-white border-b-2 border-purple-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <ShieldOff className="w-5 h-5" />
                  Blocked Users
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                {activeTab === "edit" ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">First Name</label>
                        <input
                          type="text"
                          value={formData.first_name || ""}
                          onChange={(e) => handleChange("first_name", e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                        <input
                          type="text"
                          value={formData.last_name || ""}
                          onChange={(e) => handleChange("last_name", e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Username</label>
                        <input
                          type="text"
                          value={formData.username || ""}
                          onChange={(e) => handleChange("username", e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email || ""}
                          onChange={(e) => handleChange("email", e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <SelectInput
                        label="Gender"
                        value={formData.gender || ""}
                        onChange={(value) => handleChange("gender", value)}
                        options={[
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                          { value: "Non-binary", label: "Non-binary" },
                          { value: "Other", label: "Other" },
                        ]}
                        placeholder="Select gender"
                      />
                      <SelectInput
                        label="Sexual Preference"
                        value={formData.sexual_preference || ""}
                        onChange={(value) => handleChange("sexual_preference", value)}
                        options={[
                          { value: "men", label: "Men" },
                          { value: "women", label: "Women" },
                          { value: "both", label: "Both" },
                        ]}
                        placeholder="Select preference"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        <CalendarIcon className="w-4 h-4 inline mr-2" />
                        Birth Date (must be 18+)
                      </label>
                      <DatePicker
                        value={formData.birth_date ? new Date(formData.birth_date) : undefined}
                        onChange={(date) => {
                          if (date) {
                            handleChange("birth_date", date.toISOString());
                          } else {
                            handleChange("birth_date", "");
                          }
                        }}
                        maxDate={new Date(new Date().getFullYear() - 18, 11, 31)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">City</label>
                        <input
                          type="text"
                          value={formData.city || ""}
                          onChange={(e) => handleChange("city", e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Country</label>
                        <input
                          type="text"
                          value={formData.country || ""}
                          onChange={(e) => handleChange("country", e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Biography ({formData.biography?.length || 0}/150)
                      </label>
                      <Textarea
                        value={formData.biography || ""}
                        onChange={(e) => handleChange("biography", e.target.value)}
                        maxLength={150}
                        placeholder="Tell us about yourself..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-purple-500 min-h-[100px]"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                      >
                        {profileLoading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    {loadingBlocked ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader className="w-8 h-8 text-purple-400 animate-spin" />
                      </div>
                    ) : blockedUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <ShieldOff className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60 text-lg">No blocked users</p>
                        <p className="text-white/40 text-sm mt-1">
                          Users you block will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {blockedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between bg-white/10 rounded-xl p-3"
                          >
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => handleViewProfile(user.username)}
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                                {user.profile_picture ? (
                                  <Image
                                    src={BASE_URL + user.profile_picture}
                                    alt={user.username}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {user.username}
                                </p>
                                <p className="text-white/50 text-sm">
                                  {user.first_name} {user.last_name}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnblock(user.username)}
                              className="px-4 py-2 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition text-sm font-medium"
                            >
                              Unblock
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
