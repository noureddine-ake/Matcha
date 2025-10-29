type Location = {
    latitude?: number | string;
    longitude?: number | string;
  };
  
  const fetchFlag = async (location?: Location): Promise<string | null> => {
    try {
      let latitude: number | string | undefined;
      let longitude: number | string | undefined;

      if (location?.latitude && location?.longitude) {
        // Use provided props
        latitude = location.latitude;
        longitude = location.longitude;
      } else {
        // Fallback to localStorage
        const userLocation = JSON.parse(
          window.localStorage.getItem("user_location") || "{}"
        );
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
      }
  
      if (!latitude || !longitude) return null;
  
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
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
  