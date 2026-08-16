import { NextRequest, NextResponse } from "next/server";
import { geocodeZip, reverseGeocode } from "@/lib/geocode";
import { findNearbyCourses } from "@/lib/search";
import { syncIfStale } from "@/lib/sync";

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip");
  const latParam = req.nextUrl.searchParams.get("lat");
  const lngParam = req.nextUrl.searchParams.get("lng");
  const radiusParam = req.nextUrl.searchParams.get("radius");
  const radiusMiles = radiusParam ? Number(radiusParam) : 25;

  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0 || radiusMiles > 200) {
    return NextResponse.json(
      { error: "Radius must be a number between 1 and 200 miles." },
      { status: 400 }
    );
  }

  let origin: { lat: number; lng: number; city: string; state: string };
  let locationKey: string;

  if (latParam && lngParam) {
    const lat = Number(latParam);
    const lng = Number(lngParam);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
    }

    const place = await reverseGeocode(lat, lng);
    origin = { lat, lng, city: place?.city ?? "", state: place?.state ?? "" };
    locationKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  } else if (zip) {
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json(
        { error: "A 5-digit US zip code is required." },
        { status: 400 }
      );
    }

    const resolved = await geocodeZip(zip);
    if (!resolved) {
      return NextResponse.json(
        { error: `Could not find location for zip code ${zip}.` },
        { status: 404 }
      );
    }

    origin = resolved;
    locationKey = zip;
  } else {
    return NextResponse.json(
      { error: "A zip code or coordinates are required." },
      { status: 400 }
    );
  }

  await syncIfStale(locationKey, origin, radiusMiles);

  const courses = await findNearbyCourses(origin, radiusMiles);

  return NextResponse.json({ origin, courses });
}
