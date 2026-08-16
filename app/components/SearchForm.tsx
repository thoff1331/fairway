"use client";

import { useState } from "react";
import type { CourseResult } from "@/lib/search";
import { googleSearchFallback } from "@/lib/bookingLink";

type Origin = { city: string; state: string };

export default function SearchForm() {
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CourseResult[] | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [searchedLabel, setSearchedLabel] = useState<string>("");

  async function runSearch(params: URLSearchParams, label: string) {
    setLoading(true);
    setError(null);
    setResults(null);
    setOrigin(null);

    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResults(data.courses);
      setOrigin(data.origin);
      setSearchedLabel(label);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ zip, radius: String(radius) });
    runSearch(params, zip);
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError("Location isn't supported in this browser.");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setZip("");
        const params = new URLSearchParams({
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
          radius: String(radius),
        });
        runSearch(params, "your location");
      },
      () => {
        setLocating(false);
        setError("Could not get your location. Check your browser's location permission.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900"
      >
        <label className="col-span-1 flex flex-col gap-1 text-sm">
          Zip code
          <input
            required
            pattern="\d{5}"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
            placeholder="90210"
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          />
        </label>

        <label className="col-span-1 flex flex-col gap-1 text-sm">
          Radius (mi)
          <input
            type="number"
            min={1}
            max={200}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          />
        </label>

        <button
          type="submit"
          disabled={loading || locating}
          className="col-span-2 mt-2 rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find courses"}
        </button>

        <button
          type="button"
          onClick={handleUseLocation}
          disabled={loading || locating}
          className="col-span-2 rounded-md border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          {locating ? "Getting your location…" : "Use my current location"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {results && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            {results.length} course{results.length === 1 ? "" : "s"} within {radius} miles of{" "}
            {searchedLabel}
            {origin && (origin.city || origin.state) && ` (${origin.city}, ${origin.state})`}
          </p>

          {results.length === 0 && (
            <p className="text-sm text-zinc-500">
              No courses found. Try a larger radius or a different location.
            </p>
          )}

          {results.map((course) => {
            const link = course.linkUrl ?? googleSearchFallback(course.name, course.city, course.state);

            return (
              <div
                key={course.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium">{course.name}</p>
                  <p className="text-sm text-zinc-500">
                    {course.city}, {course.state} · {course.distanceMiles.toFixed(1)} mi
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {course.phone && (
                    <a
                      href={`tel:${course.phone}`}
                      className="rounded-md border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      Call
                    </a>
                  )}
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    {course.linkUrl ? "Visit course site" : "Search online"}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
