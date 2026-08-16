/**
 * Manually syncs courses near a zip code from OpenGolf API into the local `courses`
 * table. The app itself also auto-syncs on search (see lib/sync.ts), so this script
 * is mainly useful for pre-warming an area or forcing a refresh.
 *
 * Usage:
 *   npx tsx scripts/sync-courses.ts 78746 50
 *   npx tsx scripts/sync-courses.ts 84003 25
 */
import { prisma } from "@/lib/prisma";
import { geocodeZip } from "@/lib/geocode";
import { syncCoursesNear } from "@/lib/sync";

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
  const { synced, skippedPrivate, total } = await syncCoursesNear(origin, radiusMiles);

  await prisma.syncLog.upsert({
    where: { zip },
    create: { zip, radiusMiles },
    update: { radiusMiles },
  });

  console.log(`Done. ${synced} of ${total} course(s) synced (${skippedPrivate} private course(s) excluded).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
