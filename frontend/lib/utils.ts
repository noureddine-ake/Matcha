import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:5000';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getImageUrl = (photoUrl: string) => {
  if (!photoUrl) return '/placeholder.jpg';
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  return `${BACKEND_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};
