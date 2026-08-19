import { redis } from "./redis";

export type Coordinates = { lat: number; lng: number };
export type ZipLocation = Coordinates & { city: string; state: string };

const GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 1 week
const zipCacheKey = (zip: string) => `geocode:zip:${zip}`;
const coordsCacheKey = (lat: number, lng: number) =>
  `geocode:coords:${lat.toFixed(2)},${lng.toFixed(2)}`;

export async function geocodeZip(zip: string): Promise<ZipLocation | null> {
  const cacheKey = zipCacheKey(zip);

  if (redis) {
    const cached = await redis.get<ZipLocation>(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
  if (!res.ok) return null;

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;

  const location: ZipLocation = {
    lat: parseFloat(place.latitude),
    lng: parseFloat(place.longitude),
    city: place["place name"],
    state: place["state abbreviation"],
  };

  if (redis) {
    await redis.set(cacheKey, location, { ex: GEOCODE_CACHE_TTL_SECONDS });
  }

  return location;
}

export type ReverseGeocodeResult = { city: string; state: string } | null;

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const cacheKey = coordsCacheKey(lat, lng);

  if (redis) {
    const cached = await redis.get<ReverseGeocodeResult>(cacheKey);
    if (cached) return cached;
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "fairway-tee-time-finder/0.1 (reverse geocode for search display)" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const address = data.address;
  if (!address) return null;

  const city = address.city ?? address.town ?? address.village ?? address.hamlet ?? "";
  const state = address.state_code ?? address.state ?? "";
  if (!city && !state) return null;

  const result: ReverseGeocodeResult = { city, state };

  if (redis) {
    await redis.set(cacheKey, result, { ex: GEOCODE_CACHE_TTL_SECONDS });
  }

  return result;
}
