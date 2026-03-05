type Location = {
  latitude?: number | string;
  longitude?: number | string;
};

const CACHE_PREFIX = "flag_";

const fetchFlag = async (location?: Location): Promise<string | null> => {
  try {
    if (!location || !location.latitude || !location.longitude) return null;

    const cacheKey = `${CACHE_PREFIX}${location.latitude}_${location.longitude}`;
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) return cached;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`
    );
    const data = await res.json();

    const countryCode = data.address?.country_code?.toLowerCase();
    if (!countryCode) return null;

    const flagUrl = `https://flagcdn.com/w40/${countryCode}.png`;

    if (typeof window !== "undefined") {
      localStorage.setItem(cacheKey, flagUrl);
    }

    return flagUrl;
  } catch (err) {
    console.error("Error fetching flag:", err);
    return null;
  }
};

export default fetchFlag;
  