'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { Photo, Tag } from './globalcontext';
import api from '@/lib/api';

interface LikesUser {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  gender: string;
  sexual_preference: string;
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

interface LikesContextType {
  likes: LikesUser[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  offset: number;
  limit: number;
  fetchLikes: (reset?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  resetPagination: () => void;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export const LikesProvider = ({ children }: { children: ReactNode }) => {
  const [likes, setLikes] = useState<LikesUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const fetchLikes = useCallback(async (reset = true) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    try {
      const res = await api.get(`/likes?limit=${limit}&offset=${currentOffset}`);

      if (reset) {
        setLikes(res.data.likes);
      } else {
        setLikes(prev => [...prev, ...res.data.likes]);
      }

      setOffset(currentOffset + res.data.count);
      setHasMore(res.data.count === limit);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load likes');
    } finally {
      setLoading(false);
    }
  }, [offset, limit]);

  const fetchMore = useCallback(async () => {
    if (hasMore && !loading) {
      fetchLikes(false);
    }
  }, [hasMore, loading, fetchLikes]);

  const resetPagination = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    setLikes([]);
  }, []);

  const value = useMemo(
    () => ({
      likes,
      loading,
      error,
      hasMore,
      offset,
      limit,
      fetchLikes,
      fetchMore,
      resetPagination,
    }),
    [likes, loading, error, hasMore, offset, limit, fetchLikes, fetchMore, resetPagination]
  );

  return (
    <LikesContext.Provider value={value}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
};
