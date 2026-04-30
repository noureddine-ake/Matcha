import fetch from 'node-fetch';

export async function reverseGeocode(latitude: any, longitude: any) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
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
  const data: any = await response.json();
  // Helper to extract only the Latin part (before any non-Latin/Unicode chunk)
  function extractLatin(str: any) {
    if (!str) return '';
    const match = str.match(/^[A-Za-z0-9 .,'-]+/);
    if (!match) return str;
    const extracted = match[0].trim();
    return extracted.length > 1 ? extracted : str;
  }
  return {
    city: extractLatin(
      data.address?.city || data.address?.town || data.address?.village || ''
    ),
    country: extractLatin(data.address?.country || ''),
  };
}
