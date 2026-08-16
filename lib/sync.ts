import { prisma } from "@/lib/prisma";
import type { Coordinates } from "@/lib/geocode";

const API_BASE = "https://api.opengolfapi.org/v1";
const SYNC_FRESHNESS_HOURS = 24;

type OpenGolfCourse = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  website: string | null;
  phone: string | null;
  type: string | null;
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

export type SyncResult = { synced: number; skippedPrivate: number; total: number };

export async function syncCoursesNear(origin: Coordinates, radiusMiles: number): Promise<SyncResult> {
  const results = await searchByRadius(origin.lat, origin.lng, radiusMiles);

  let synced = 0;
  let skippedPrivate = 0;

  for (const course of results) {
    if (!course.latitude || !course.longitude) continue;

    if (course.type?.toLowerCase().includes("private")) {
      skippedPrivate += 1;
      continue;
    }

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
        phone: course.phone,
      },
      update: {
        name: course.name,
        city: course.city ?? "",
        state: course.state ?? "",
        lat: course.latitude,
        lng: course.longitude,
        website: course.website,
        phone: course.phone,
      },
    });

    synced += 1;
  }

  return { synced, skippedPrivate, total: results.length };
}

/**
 * Syncs a zip/radius area from OpenGolf only if it hasn't been synced with at least
 * this radius within the freshness window — avoids hammering the API on every search.
 */
export async function syncIfStale(zip: string, origin: Coordinates, radiusMiles: number): Promise<void> {
  const log = await prisma.syncLog.findUnique({ where: { zip } });

  const isFresh =
    log &&
    log.radiusMiles >= radiusMiles &&
    Date.now() - log.syncedAt.getTime() < SYNC_FRESHNESS_HOURS * 60 * 60 * 1000;

  if (isFresh) return;

  await syncCoursesNear(origin, radiusMiles);

  await prisma.syncLog.upsert({
    where: { zip },
    create: { zip, radiusMiles },
    update: { radiusMiles: Math.max(log?.radiusMiles ?? 0, radiusMiles) },
  });
}
