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
