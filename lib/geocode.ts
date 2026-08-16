export type Coordinates = { lat: number; lng: number };

export async function geocodeZip(zip: string): Promise<Coordinates | null> {
  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
  if (!res.ok) return null;

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;

  return {
    lat: parseFloat(place.latitude),
    lng: parseFloat(place.longitude),
  };
}
