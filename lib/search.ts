import { prisma } from "@/lib/prisma";
import type { Coordinates } from "@/lib/geocode";

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineMiles(a: Coordinates, b: Coordinates) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export type CourseResult = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  bookingUrl: string | null;
  distanceMiles: number;
};

export async function findNearbyCourses(
  origin: Coordinates,
  radiusMiles: number
): Promise<CourseResult[]> {
  // Coarse bounding box first to limit rows scanned, then exact haversine filter.
  const latDelta = radiusMiles / 69; // ~69 miles per degree latitude
  const lngDelta = radiusMiles / (69 * Math.cos(toRadians(origin.lat)) || 1);

  const candidates = await prisma.course.findMany({
    where: {
      lat: { gte: origin.lat - latDelta, lte: origin.lat + latDelta },
      lng: { gte: origin.lng - lngDelta, lte: origin.lng + lngDelta },
    },
  });

  return candidates
    .map((course) => ({
      id: course.id,
      name: course.name,
      address: course.address,
      city: course.city,
      state: course.state,
      bookingUrl: course.bookingUrl,
      distanceMiles: haversineMiles(origin, { lat: course.lat, lng: course.lng }),
    }))
    .filter((c) => c.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}
