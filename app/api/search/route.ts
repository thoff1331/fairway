import { NextRequest, NextResponse } from "next/server";
import { geocodeZip } from "@/lib/geocode";
import { findNearbyCourses } from "@/lib/search";

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip");
  const radiusParam = req.nextUrl.searchParams.get("radius");
  const radiusMiles = radiusParam ? Number(radiusParam) : 25;

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json(
      { error: "A 5-digit US zip code is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0 || radiusMiles > 200) {
    return NextResponse.json(
      { error: "Radius must be a number between 1 and 200 miles." },
      { status: 400 }
    );
  }

  const origin = await geocodeZip(zip);
  if (!origin) {
    return NextResponse.json(
      { error: `Could not find location for zip code ${zip}.` },
      { status: 404 }
    );
  }

  const courses = await findNearbyCourses(origin, radiusMiles);

  return NextResponse.json({ origin, courses });
}
