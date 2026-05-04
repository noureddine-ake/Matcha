'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import api from '@/lib/api';

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
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  photos: Photo[];
  tags: Tag[];
  position: Position;
  fame_rating?: string;
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
  updating: boolean;
  error: string | null;
  showLocationModal: boolean;

  // Functions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: FormUpdateUser) => Promise<void>;
  fetchUserProfile?: (username: string) => Promise<User | null>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setShowLocationModal: React.Dispatch<React.SetStateAction<boolean>>;
}

// ==== Context ====

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// ==== Provider ====

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<User>('/profile');
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
    setUpdating(true);
    setError("");

    try {
      const res = await api.put<User>("/profile/update", formdata);
      setUser(res.data);

    } catch (err: unknown) {
      console.error("Profile update failed:", err);
    } finally {
      setUpdating(false);
    }
  }, [])

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

  const value = useMemo(
    () => ({
      user,
      loading,
      updating,
      error,
      fetchProfile,
      updateProfile,
      fetchUserProfile,
      setUser,
      showLocationModal,
      setShowLocationModal,
    }),
    [user, loading, updating, error, fetchProfile, updateProfile, fetchUserProfile, setUser, showLocationModal, setShowLocationModal]
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
