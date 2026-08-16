/**
 * Pulls courses from GolfCourseAPI.com and upserts them into the local `courses` table.
 *
 * GolfCourseAPI's /search endpoint matches on a free-text query (course/club name, city, etc.)
 * and does NOT include coordinates in its response, so each course's address is separately
 * geocoded via Nominatim (OpenStreetMap) — rate-limited to 1 request/sec per their usage policy.
 *
 * Usage:
 *   npx tsx scripts/sync-courses.ts "Austin, TX" "Round Rock, TX"
 */
import { prisma } from "@/lib/prisma";

const API_BASE = "https://api.golfcourseapi.com/v1";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "fairway-tee-time-finder/0.1 (course data sync script)";

type GolfCourseApiResult = {
  id: string;
  club_name: string;
  course_name: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchCourses(query: string): Promise<GolfCourseApiResult[]> {
  const apiKey = process.env.GOLF_COURSE_API_KEY;
  if (!apiKey) {
    throw new Error("GOLF_COURSE_API_KEY is not set in the environment.");
  }

  const res = await fetch(`${API_BASE}/search?search_query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Key ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`GolfCourseAPI request failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.courses ?? [];
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`${NOMINATIM_BASE}?q=${encodeURIComponent(address)}&format=json&limit=1`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) return null;

  const results = await res.json();
  const first = results?.[0];
  if (!first) return null;

  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
}

async function main() {
  const queries = process.argv.slice(2);
  if (queries.length === 0) {
    console.error('Usage: npx tsx scripts/sync-courses.ts "City, ST" ["Another City, ST" ...]');
    process.exit(1);
  }

  let total = 0;
  let skipped = 0;

  for (const query of queries) {
    console.log(`Searching "${query}"...`);
    const results = await searchCourses(query);

    for (const course of results) {
      const name = course.club_name || course.course_name;
      const fullAddress = course.location?.address || "";

      await sleep(1100); // Nominatim usage policy: max 1 request/sec
      const coords = await geocodeAddress(fullAddress);

      if (!coords) {
        console.log(`  ! could not geocode "${name}" (${fullAddress}), skipping`);
        skipped += 1;
        continue;
      }

      await prisma.course.upsert({
        where: { sourceApiId: String(course.id) },
        create: {
          sourceApiId: String(course.id),
          name,
          address: course.location?.address ?? "",
          city: course.location?.city ?? "",
          state: course.location?.state ?? "",
          lat: coords.lat,
          lng: coords.lng,
        },
        update: {
          name,
          address: course.location?.address ?? "",
          city: course.location?.city ?? "",
          state: course.location?.state ?? "",
          lat: coords.lat,
          lng: coords.lng,
        },
      });

      total += 1;
    }

    console.log(`  -> upserted ${results.length - skipped} of ${results.length} course(s)`);
  }

  console.log(`Done. ${total} course(s) synced, ${skipped} skipped (no geocode match).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
