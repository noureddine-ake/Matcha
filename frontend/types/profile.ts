// src/types/profile.ts
export interface Photo {
    id: number;
    photo_url: string;
    is_profile_picture: boolean;
  }
  
  export interface ProfileStats {
    views: number;
    likes: number;
    matches: number;
  }
  
  export interface ProfileProps {
    first_name: string;
    last_name: string;
    gender: string;
    sexual_preference: string;
    birth_date: string;
    biography: string;
    stats?: ProfileStats;
    photos: Photo[];
    tags: { id: number; name: string }[]; // Match your API shape
    city?: string;
    country?: string;
  }