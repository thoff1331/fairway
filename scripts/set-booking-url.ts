/**
 * Sets (or clears) the booking URL for a course by name match.
 *
 * Usage:
 *   npx tsx scripts/set-booking-url.ts "Lions Municipal Golf Course" "https://foreupsoftware.com/index.php/booking/..."
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const [nameQuery, bookingUrl] = process.argv.slice(2);

  if (!nameQuery || !bookingUrl) {
    console.error('Usage: npx tsx scripts/set-booking-url.ts "<course name>" "<booking url>"');
    process.exit(1);
  }

  const matches = await prisma.course.findMany({
    where: { name: { contains: nameQuery, mode: "insensitive" } },
  });

  if (matches.length === 0) {
    console.error(`No course found matching "${nameQuery}".`);
    process.exit(1);
  }

  if (matches.length > 1) {
    console.error(`Multiple courses match "${nameQuery}", be more specific:`);
    matches.forEach((c) => console.error(`  - ${c.name} (${c.city}, ${c.state})`));
    process.exit(1);
  }

  await prisma.course.update({
    where: { id: matches[0].id },
    data: { bookingUrl },
  });

  console.log(`Updated "${matches[0].name}" -> ${bookingUrl}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
