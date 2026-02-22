  "use client";

  import { useEffect, useState, useCallback } from "react";
  import { motion } from "framer-motion";
  import { useGlobal, User } from "@/contexts/globalcontext";
  import api from "@/lib/api";
  import fetchFlag from "@/lib/fetchflag";
  import { useParams } from "next/navigation";

  import {
    ProfileHeader,
    ProfileInfo,
    ProfileBirthday,
    ProfileActions,
    ProfileBio,
    ProfileStats,
    ProfileContent,
    ProfileLoading,
  } from "@/components/profile";

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:5000";

  export default function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { user, profile, loading, error, fetchUserProfile } = useGlobal();
    const [isEditing, setIsEditing] = useState(false);
    const [flagUrl, setFlagUrl] = useState<string | null>(null);
    const [currentProfile, setCurrentProfile] = useState<User | null>(null);

    const updateLocationAllFields = useCallback(async (lat: number, lng: number) => {
      try {
        await api.put("/profile/update-location", { latitude: lat, longitude: lng });
        const res = await api.get('/profile');
        setCurrentProfile(res.data);
      } catch (err) {
        console.error("[updateLocationAllFields] Error:", err);
      }
    }, []);

    // Compare with logged-in user to determine if it's their own profile
    const isCurrentUser = Boolean(user && user.username === decodeURIComponent(username));

    // Update currentProfile when user or profile changes
    useEffect(() => {
      if (!user) return;

      const decodedUsername = decodeURIComponent(username);
      if (user.username === decodedUsername) {
        setCurrentProfile(user);
      } else {
        fetchUserProfile?.(username);
      }
    }, [user, username, fetchUserProfile]);

    // Update currentProfile when profile (other user) is fetched
    useEffect(() => {
      if (profile && user && user.username !== username) {
        setCurrentProfile(profile);
      }
    }, [profile, user, username]);

    // Fetch flag and update location
    useEffect(() => {
      const userLocation = JSON.parse(
        window.localStorage.getItem("user_location") || "{}"
      );
      const { latitude, longitude } = userLocation;

      const getFlag = async () => {
        const url = await fetchFlag({ latitude, longitude });
        setFlagUrl(url || null);
      };
      getFlag();

        console.log("isCurrentUser", isCurrentUser)
      if (isCurrentUser) {
        updateLocationAllFields(latitude, longitude);
      }
    }, [isCurrentUser, updateLocationAllFields]);

    // Loading state
    if (loading || !currentProfile) {
      return <ProfileLoading variant={loading ? "skeleton" : "spinner"} />;
    }

    const toggleEdit = () => setIsEditing(!isEditing);

    return (
      <div className="h-full overflow-scroll no-scrollbar w-full max-w-6xl ">
        {/* Profile Header Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0"></div>
          <div className="relative w-full mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col mx-auto max-w-full md:flex-row gap-8"
            >
              {/* Profile Picture */}
              <ProfileHeader
                currentProfile={currentProfile}
                backendUrl={BACKEND_URL}
                isCurrentUser={isCurrentUser}
                onEditClick={toggleEdit}
              />

              {/* Profile Info */}
              <div className="flex-1 text-white w-full min-w-0 overflow-hidden">
                <ProfileInfo
                  currentProfile={currentProfile}
                  isCurrentUser={isCurrentUser}
                  flagUrl={flagUrl}
                />

                {/* Birthday */}
                {currentProfile.birth_date && (
                  <ProfileBirthday birthDate={currentProfile.birth_date} />
                )}

                {/* Actions: Logout or Like/Chat/Report/Block */}
                <ProfileActions
                  isCurrentUser={isCurrentUser}
                  username={username}
                  userId = {currentProfile.id.toString()}
                />

                {/* Biography */}
                <ProfileBio biography={currentProfile.biography} />

                {/* Stats Cards */}
                <ProfileStats
                  stats={currentProfile.stats}
                  isCurrentUser={isCurrentUser}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tags and Photos Section */}
        <ProfileContent
          currentProfile={currentProfile}
          backendUrl={BACKEND_URL}
          isCurrentUser={isCurrentUser}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      </div>
    );
  }
