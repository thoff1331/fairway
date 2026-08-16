/**
 * Pulls courses from GolfCourseAPI.com and upserts them into the local `courses` table.
 *
 * GolfCourseAPI's /search endpoint matches on a free-text query (course/club name, city, etc.),
 * not a lat/lng radius, so this script takes one or more search terms — typically city names or
 * "city, state" — and syncs whatever it finds for each.
 *
 * Usage:
 *   npx tsx scripts/sync-courses.ts "Austin, TX" "Round Rock, TX"
 */
import { prisma } from "@/lib/prisma";

const API_BASE = "https://api.golfcourseapi.com/v1";

type GolfCourseApiResult = {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
};

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

async function main() {
  const queries = process.argv.slice(2);
  if (queries.length === 0) {
    console.error('Usage: npx tsx scripts/sync-courses.ts "City, ST" ["Another City, ST" ...]');
    process.exit(1);
  }

  let total = 0;

  for (const query of queries) {
    console.log(`Searching "${query}"...`);
    const results = await searchCourses(query);

    for (const course of results) {
      if (!course.location?.latitude || !course.location?.longitude) continue;

      const name = course.club_name || course.course_name;

      await prisma.course.upsert({
        where: { sourceApiId: String(course.id) },
        create: {
          sourceApiId: String(course.id),
          name,
          address: course.location.address ?? "",
          city: course.location.city ?? "",
          state: course.location.state ?? "",
          lat: course.location.latitude,
          lng: course.location.longitude,
        },
        update: {
          name,
          address: course.location.address ?? "",
          city: course.location.city ?? "",
          state: course.location.state ?? "",
          lat: course.location.latitude,
          lng: course.location.longitude,
        },
      });

      total += 1;
    }

    console.log(`  -> upserted ${results.length} course(s)`);
  }

  console.log(`Done. ${total} course(s) synced.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
