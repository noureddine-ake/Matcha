import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getImageUrl = (photoUrl: string) => {
  if (!photoUrl) return '/placeholder.jpg';
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  return `${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};
