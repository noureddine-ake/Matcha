import fetch from 'node-fetch';

export async function reverseGeocode(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
  console.log('[reverseGeocode] Fetching URL:', url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MatchaApp/1.0 (contact@matcha-app.com)',
      Accept: 'application/json',
    },
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!response.ok) throw new Error('Failed to fetch geocode');
  const data = await response.json();
  // Helper to extract only the Latin part (before any non-Latin/Unicode chunk)
  function extractLatin(str) {
    if (!str) return '';
    // Match only the first contiguous Latin/ASCII word(s) (letters, spaces, hyphens, dots, commas, apostrophes)
    const match = str.match(/^[A-Za-z0-9 .,'-]+/);
    return match ? match[0].trim() : str;
  }
  return {
    city: extractLatin(
      data.address?.city || data.address?.town || data.address?.village || ''
    ),
    country: extractLatin(data.address?.country || ''),
  };
}
