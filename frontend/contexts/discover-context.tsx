'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import { Photo, Tag } from './globalcontext';
import api from '@/lib/api';

import { useGlobal } from '@/contexts/globalcontext';

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
  tags: Tag[];
}

interface DiscoverContextType {
  showPopup: boolean;
  filters: Filters;
  suggestions: Suggestions[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  offset: number;
  limit: number;

  // Functions
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  setSuggestions: React.Dispatch<React.SetStateAction<Suggestions[]>>;
  fetchSuggestions: (reset?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  resetPagination: () => void;
}

// ==== Context ====

const DiscoverContext = createContext<DiscoverContextType | undefined>(
  undefined
);

// ==== Provider ====

export const DiscoverProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useGlobal();
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Suggestions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const [filters, setFilters] = useState<Filters>({
    maxDistance: 100,
    minAge: 18,
    maxAge: 100,
    minFame: 0,
    maxFame: 5,
    sortBy: 'distance',
  });

  const fetchSuggestions = useCallback(async (reset = true) => {
    if (!user || user.latitude === null || user.longitude === null) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    
    try {
      const params = {
        ...filters,
        limit: String(limit),
        offset: String(currentOffset),
      };
      const query = new URLSearchParams(
        params as unknown as Record<string, string>
      ).toString();
      const res = await api.post(`/suggestions?${query}`);
      
      if (reset) {
        setSuggestions(res.data.suggestions);
      } else {
        setSuggestions(prev => [...prev, ...res.data.suggestions]);
      }
      
      setOffset(currentOffset + res.data.count);
      setHasMore(res.data.count === limit);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [filters, user, offset, limit]);

  const fetchMore = useCallback(async () => {
    if (hasMore && !loading) {
      fetchSuggestions(false);
    }
  }, [hasMore, loading, fetchSuggestions]);

  const resetPagination = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    setSuggestions([]);
  }, []);

  // ==== Memoized value ====
  const value = useMemo(
    () => ({
      showPopup,
      filters,
      suggestions,
      loading,
      error,
      hasMore,
      offset,
      limit,

      // Functions
      setShowPopup,
      setFilters,
      fetchSuggestions,
      fetchMore,
      resetPagination,
      setSuggestions,
    }),
    [
      showPopup,
      filters,
      suggestions,
      loading,
      error,
      hasMore,
      offset,
      limit,
      fetchSuggestions,
      fetchMore,
      resetPagination,
    ]
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
    throw new Error('useDiscover must be used within a DiscoverProvider');
  return context;
};
