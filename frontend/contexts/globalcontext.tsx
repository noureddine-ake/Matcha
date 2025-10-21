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
    }),
    [user, profile, tags, photos, stats, loading, error, fetchProfile]
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
