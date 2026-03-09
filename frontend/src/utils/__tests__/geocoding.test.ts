import { describe, it, expect, beforeEach } from 'vitest';
import { geocodeAddress } from '../geocoding';

describe('Geocoding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return cached coordinates if available', async () => {
    const address = 'Test Address';
    const coords = { lat: 44.7866, lng: 20.4489 };
    
    localStorage.setItem(`geocode_${address}`, JSON.stringify(coords));
    
    const result = await geocodeAddress(address);
    expect(result).toEqual(coords);
  });

  it('should handle empty address', async () => {
    const result = await geocodeAddress('');
    expect(result).toBeDefined();
  });
});