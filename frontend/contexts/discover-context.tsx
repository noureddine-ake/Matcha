'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import { Photo } from './globalcontext';
import api from '@/lib/api';

// ==== Types ====

export interface Filters {
  maxDistance: number;
  minAge: number;
  maxAge: number;
  minFame: number;
  maxFame: number;
  sortBy: 'distance' | 'age' | 'fame';
}

export interface Suggestions {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  gender: 'male' | 'female';
  sexual_preference: 'male' | 'female';
  biography: string | null;
  city: string | null;
  country: string | null;
  fame_rating: string;
  last_seen: string;
  is_online: boolean;
  age: number;
  distance: number;
  photos: Photo[];
  tags: string[];
}

interface DiscoverContextType {
  showPopup: boolean;
  filters: Filters;
  suggestions: Suggestions[];
  loading: boolean;
  error: string;

  // Functions
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  setSuggestions: React.Dispatch<React.SetStateAction<Suggestions[]>>;
  fetchSuggestions: () => Promise<void>;
}

// ==== Context ====

const DiscoverContext = createContext<DiscoverContextType | undefined>(
  undefined
);

// ==== Provider ====

export const DiscoverProvider = ({ children }: { children: ReactNode }) => {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Suggestions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [filters, setFilters] = useState<Filters>({
    maxDistance: 50,
    minAge: 18,
    maxAge: 35,
    minFame: 0,
    maxFame: 5,
    sortBy: 'distance',
  });

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams(
        Object.entries(filters).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      const res = await api.post(`/suggestions?${query}`);
      setSuggestions(res.data.suggestions);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ==== Memoized value ====
  const value = useMemo(
    () => ({
      showPopup,
      filters,
      suggestions,
      loading,
      error,

      // Functions
      setShowPopup,
      setFilters,
      fetchSuggestions,
      setSuggestions,
    }),
    [showPopup, filters, suggestions, loading, error, fetchSuggestions]
  );

  return (
    <DiscoverContext.Provider value={value}>
      {children}
    </DiscoverContext.Provider>
  );
};

// ==== Custom hook ====

export const useDiscover = () => {
  const context = useContext(DiscoverContext);
  if (!context)
    throw new Error('useGlobal must be used within a DiscoverProvider');
  return context;
};
