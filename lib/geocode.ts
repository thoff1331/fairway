export type Coordinates = { lat: number; lng: number };
export type ZipLocation = Coordinates & { city: string; state: string };

export async function geocodeZip(zip: string): Promise<ZipLocation | null> {
  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
  if (!res.ok) return null;

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;

  return {
    lat: parseFloat(place.latitude),
    lng: parseFloat(place.longitude),
    city: place["place name"],
    state: place["state abbreviation"],
  };
}

export type ReverseGeocodeResult = { city: string; state: string } | null;

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
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

  return { city, state };
}
