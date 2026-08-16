/**
 * Pulls courses from OpenGolf API (opengolfapi.org) and upserts them into the local
 * `courses` table. OpenGolf supports a native lat/lng + radius search and returns
 * coordinates directly, so this script geocodes a zip via the same helper the app
 * uses (lib/geocode.ts) and queries around it — no separate geocoding pass needed.
 *
 * Usage:
 *   npx tsx scripts/sync-courses.ts 78746 50
 *   npx tsx scripts/sync-courses.ts 84003 25
 */
import { prisma } from "@/lib/prisma";
import { geocodeZip } from "@/lib/geocode";

const API_BASE = "https://api.opengolfapi.org/v1";

type OpenGolfCourse = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  website: string | null;
};

async function searchByRadius(lat: number, lng: number, radiusMiles: number): Promise<OpenGolfCourse[]> {
  const url = `${API_BASE}/courses/search?lat=${lat}&lng=${lng}&radius=${radiusMiles}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`OpenGolf API request failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.courses ?? [];
}

async function main() {
  const [zip, radiusArg] = process.argv.slice(2);
  const radiusMiles = radiusArg ? Number(radiusArg) : 50;

  if (!zip || !/^\d{5}$/.test(zip)) {
    console.error("Usage: npx tsx scripts/sync-courses.ts <zip> [radiusMiles]");
    process.exit(1);
  }

  const origin = await geocodeZip(zip);
  if (!origin) {
    console.error(`Could not geocode zip ${zip}.`);
    process.exit(1);
  }

  console.log(`Searching within ${radiusMiles} miles of ${zip} (${origin.lat}, ${origin.lng})...`);
  const results = await searchByRadius(origin.lat, origin.lng, radiusMiles);

  let total = 0;

  for (const course of results) {
    if (!course.latitude || !course.longitude) continue;

    await prisma.course.upsert({
      where: { sourceApiId: course.id },
      create: {
        sourceApiId: course.id,
        name: course.name,
        city: course.city ?? "",
        state: course.state ?? "",
        lat: course.latitude,
        lng: course.longitude,
        website: course.website,
      },
      update: {
        name: course.name,
        city: course.city ?? "",
        state: course.state ?? "",
        lat: course.latitude,
        lng: course.longitude,
        website: course.website,
      },
    });

    total += 1;
  }

  console.log(`Done. ${total} of ${results.length} course(s) synced.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
