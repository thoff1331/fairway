/**
 * Sets (or clears) the booking URL for a course by name match.
 *
 * If multiple courses match the name, pass a city as a third argument to disambiguate.
 *
 * Usage:
 *   npx tsx scripts/set-booking-url.ts "Lions Municipal Golf Course" "https://foreupsoftware.com/..."
 *   npx tsx scripts/set-booking-url.ts "Austin Golf Club" "https://..." "Spicewood"
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const [nameQuery, bookingUrl, cityFilter] = process.argv.slice(2);

  if (!nameQuery || !bookingUrl) {
    console.error(
      'Usage: npx tsx scripts/set-booking-url.ts "<course name>" "<booking url>" ["<city>"]'
    );
    process.exit(1);
  }

  let matches = await prisma.course.findMany({
    where: { name: { contains: nameQuery, mode: "insensitive" } },
  });

  if (cityFilter) {
    matches = matches.filter((c) => c.city.toLowerCase().includes(cityFilter.toLowerCase()));
  }

  if (matches.length === 0) {
    console.error(`No course found matching "${nameQuery}"${cityFilter ? ` in "${cityFilter}"` : ""}.`);
    process.exit(1);
  }

  if (matches.length > 1) {
    const exact = matches.filter((c) => c.name.toLowerCase() === nameQuery.toLowerCase());
    if (exact.length === 1) {
      matches = exact;
    } else {
      console.error(`Multiple courses match "${nameQuery}", be more specific (add a city as a 3rd arg):`);
      matches.forEach((c) => console.error(`  - ${c.name} (${c.city}, ${c.state})`));
      process.exit(1);
    }
  }

  await prisma.course.update({
    where: { id: matches[0].id },
    data: { bookingUrl },
  });

  console.log(`Updated "${matches[0].name}" (${matches[0].city}, ${matches[0].state}) -> ${bookingUrl}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
