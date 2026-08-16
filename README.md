# Fairway

Find public golf courses near you and get in touch to book — by zip code or your current location, filtered by search radius.

Live: [fairway-theta.vercel.app](https://fairway-theta.vercel.app)

## What it does

Fairway is a golf course finder. Search a zip code (or share your location) and a radius, and it returns nearby **public** courses sorted by distance, each with a way to reach them — no live tee-time booking, since that would require a data-sharing agreement with individual courses or golf booking platforms. Instead, it gets you to the point of booking as fast as possible: a phone number to call, or a link to the course's own site.

## Features

- **Search by zip code or current location** — enter a zip, or use the browser's geolocation to search around wherever you are.
- **Adjustable radius** — 1–200 miles.
- **Distance-sorted results** — real haversine distance from your search location to each course.
- **Public courses only** — private clubs and country clubs are filtered out automatically.
- **Call or visit** — each result shows a `tel:` link (works as a tap-to-call on mobile) and a link to the course's website when known, falling back to a Google search if not.
- **Auto-synced course data** — course data for a given area is pulled live from [OpenGolf API](https://www.opengolfapi.org/) the first time it's searched, then cached for 24 hours so repeat searches are instant.

## How it works

- **Course data**: [OpenGolf API](https://www.opengolfapi.org/) — a free, keyless API that returns golf courses with coordinates, type (public/private), phone, and website, searchable by lat/lng + radius.
- **Zip → coordinates**: [zippopotam.us](https://zippopotam.us/) for zip lookups; [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/) for reverse-geocoding a "use my location" search back into a city/state label.
- **Storage**: Postgres (via [Supabase](https://supabase.com)) caches synced course data and tracks which areas have been synced recently, so the app doesn't re-hit OpenGolf on every search.
- **Stack**: Next.js (App Router) + TypeScript + Prisma, deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase DATABASE_URL / DIRECT_URL
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3010](http://localhost:3010).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 3010 |
| `npm run build` | Production build |
| `npm run sync-courses -- <zip> [radiusMiles]` | Manually pre-sync courses for an area (the app also does this automatically on search) |
| `npm run set-booking-url -- "<course name>" "<url>" ["<city>"]` | Override a course's link with a specific booking-platform URL instead of its generic website |

## Known limitations

- No live tee-time availability — this is a course *finder*, not a booking system, since that requires a data agreement most booking platforms don't offer publicly.
- Course data depends on OpenGolf API's coverage, which isn't exhaustive everywhere.
