type Location = {
    latitude?: number | string;
    longitude?: number | string;
  };
  
  const fetchFlag = async (location?: Location): Promise<string | null> => {
    try {
  
      if (!location || !location.latitude || !location.longitude) return null;
  
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`
      );
      const data = await res.json();
  
      const countryCode = data.address?.country_code?.toLowerCase();
      if (!countryCode) return null;
  
      return `https://flagcdn.com/w40/${countryCode}.png`;
    } catch (err) {
      console.error("Error fetching flag:", err);
      return null;
    }
  };
  
  export default fetchFlag;
  