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
import { AxiosError } from 'axios';

// ==== Types ====

export interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string;
  gender: string;
  sexual_preference: string;
  biography: string;
  birth_date?: string;
  city?: string;
  country?: string;
  photos: Photo[];
  tags: Tag[];
  position: Position;
  stats: Stats;
};

export interface FormUpdateUser {
  first_name?: string | undefined;
  last_name?: string | undefined;
  username?: string | undefined;
  email?: string;
  gender?: string;
  sexual_preference?: string;
  biography?: string;
  birth_date?: string;
  city?: string;
  country?: string;
};

export interface Position {
  latitude: number;
  longitude: number;
}

export interface Photo {
  id: number;
  photo_url: string;
  is_profile_picture: boolean;
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
  loading: boolean;
  error: string | null;

  // Functions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: FormUpdateUser) => Promise<void>;
  fetchUserProfile?: (username: string) => Promise<User | null>;
}

// ==== Context ====

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// ==== Provider ====

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==== Fetch profile ====
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<User>('/profile');
      console.log("ttt", res.data)
      setUser(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (formdata: FormUpdateUser) => {
    setLoading(true);
    setError("");

    try {
      const res = await api.put<User>("/profile/update", formdata);
      console.log("hehehehe", res.data)
      setUser(res.data);

    } catch (err: unknown) {
      console.error("Profile update failed:", err);
      // if (err instanceof AxiosError)
      //   setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }, [])

   // ====updateprofilePicture ====

  // const updateprofilePicture = useCallback(
  //   async (photoIndex: number) => {
  //     try {
  //       setLoading(true);
  //       setError('');

  //       const { data } = await api.put('/profile/update-profile-picture', {
  //         profilePhotoIndex: photoIndex,
  //       });

  //       // Refresh profile
  //       await fetchProfile();

  //       console.log('Profile picture updated successfully:', data.message);
  //     } catch (err: unknown) {
  //       console.error('Failed to update profile picture:', err);
  //       if (err instanceof AxiosError)
  //         setError(err.response?.data?.error || 'Failed to update profile picture');
  //     } finally {
  //       setLoading(false);
  //     }
  //   },
  //   [fetchProfile]
  // );
  
  // ==== Fetch user profile by username ====
  const fetchUserProfile = useCallback(
    async (username: string): Promise<User | null> => {
      try {
        const res = await api.get<User>(`/profile/user/${username}`);
        return res.data;
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        return null;
      }
    },
    []
  );

  // ==== Memoized value ====
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      fetchProfile,
      updateProfile,
      fetchUserProfile,
    }),
    [user, loading, error, fetchProfile, updateProfile, fetchUserProfile]
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
