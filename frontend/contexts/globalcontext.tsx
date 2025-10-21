'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import api from '@/lib/api';

// ==== Types ====

// export interface User {
//   id: number;
//   first_name: string | null;
//   last_name: string | null;
//   email: string;
//   gender: string;
//   sexual_preference: string;
//   biography: string;
//   birth_date?: string;
//   city?: string;
//   country?: string;
//   views: number;
//   likes: number;
//   matches: number;
//   messages: number;
//   photos: Photo[];
//   tags: Tag[];
// };

export interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

export interface Photo {
  id: number;
  photo_url: string;
  is_profile_picture: boolean;
}

export interface Profile {
  gender: string;
  sexual_preference: string;
  biography: string;
  birth_date?: string;
  city?: string;
  country?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Stats {
  views: number;
  likes: number;
  matches: number;
  messages: number;
}

interface GlobalContextType {
  user: User | null;
  // suggestions: User[];
  profile: Profile | null;
  tags: Tag[];
  photos: Photo[];
  stats: Stats;
  loading: boolean;
  error: string;

  // Functions
  fetchProfile: () => Promise<void>;
  updateProfile: () => Promise<void>;
}

// ==== Context ====

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// ==== Provider ====

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  const [stats, setStats] = useState<Stats>({
    views: 0,
    likes: 0,
    matches: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==== Fetch profile ====
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/profile');
      setUser(data.user);
      setProfile(data.profile);
      setTags(data.tags || []);
      setPhotos(data.photos || []);

      // Replace with actual stats API later
      setStats({
        views: 128,
        likes: 42,
        matches: 8,
        messages: 5,
      });

      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // ==== Update profile ====
  const updateProfile = useCallback(
    async (updates: {
      first_name?: string;
      last_name?: string;
      email?: string;
      gender?: string;
      sexual_preference?: string;
      biography?: string;
      latitude?: number;
      longitude?: number;
      interests?: string[];
      photos?: File[];
      profilePhotoIndex?: number;
      birth_date?: string; // "YYYY-MM-DD"
      city?: string;
      country?: string;
    }) => {

     
      try {
        setLoading(true);
        setError('');
  
        const formData = new FormData();
        
        
        // Text fields
        for (const key of ['first_name', 'last_name', 'email', 'gender', 'sexual_preference', 'biography', 'city', 'country',] as const) {
          if (updates[key]) formData.append(key, updates[key]!);
        }
  
        // Coordinates
        if (updates.latitude !== undefined) formData.append('latitude', updates.latitude.toString());
        if (updates.longitude !== undefined) formData.append('longitude', updates.longitude.toString());
  
        // Birth date (must be a valid YYYY-MM-DD string)
        if (updates.birth_date && !isNaN(Date.parse(updates.birth_date))) {
          formData.append('birth_date', updates.birth_date);
        }
  
        // Interests
        if (updates.interests && updates.interests.length > 0) {
          formData.append('interests', JSON.stringify(updates.interests));
        }
  
        // Photos
        if (updates.photos && updates.photos.length > 0) {
          updates.photos.forEach((file) => {
            if (file) formData.append('photos', file); // ✅ same key name for all
          });
        }
        
        // Profile picture index
        if (updates.profilePhotoIndex !== undefined) {
          formData.append('profilePhotoIndex', updates.profilePhotoIndex.toString());
        }
  
        // Send to backend
        const { data } = await api.put('/profile/update', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
  
        // Refresh profile
        await fetchProfile();
  
        console.log('Profile updated successfully:', data.message);
      } catch (err: any) {
        console.error('Failed to update profile:', err);
        setError(err.response?.data?.error || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );
   // ====updateprofilePicture ====

  const updateprofilePicture = useCallback(
    async (photoIndex: number) => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.put('/profile/update-profile-picture', {
          profilePhotoIndex: photoIndex,
        });

        // Refresh profile
        await fetchProfile();

        console.log('Profile picture updated successfully:', data.message);
      } catch (err: any) {
        console.error('Failed to update profile picture:', err);
        setError(err.response?.data?.error || 'Failed to update profile picture');
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );
  

  // ==== Memoized value ====
  const value = useMemo(
    () => ({
      user,
      profile,
      tags,
      photos,
      stats,
      loading,
      error,
      fetchProfile,
      updateProfile,
    }),
    [user, profile, tags, photos, stats, loading, error, fetchProfile, updateProfile]
  );

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

// ==== Custom hook ====

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context)
    throw new Error('useGlobal must be used within a GlobalProvider');
  return context;
};
