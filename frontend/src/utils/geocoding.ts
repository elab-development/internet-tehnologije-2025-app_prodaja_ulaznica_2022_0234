export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  const cacheKey = `geocode_${address}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    console.log('Using cached coordinates for:', address);
    return JSON.parse(cached);
  }
  
  console.log('Fetching coordinates from Google for:', address);
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();
    
    console.log('Geocoding response:', data); // DODAJ OVO
    
    if (data.status === 'OK' && data.results[0]) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };
      
      localStorage.setItem(cacheKey, JSON.stringify(coords));
      console.log('Cached coordinates:', coords);
      
      return coords;
    } else {
      console.error('Geocoding failed:', data.status, data.error_message); // DODAJ OVO
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}