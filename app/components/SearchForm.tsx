"use client";

import { useState } from "react";
import type { CourseResult } from "@/lib/search";
import { googleSearchFallback } from "@/lib/bookingLink";

export default function SearchForm() {
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CourseResult[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`/api/search?zip=${encodeURIComponent(zip)}&radius=${radius}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResults(data.courses);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
          className="col-span-2 mt-2 rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find courses"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {results && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            {results.length} course{results.length === 1 ? "" : "s"} within {radius} miles of {zip}
          </p>

          {results.length === 0 && (
            <p className="text-sm text-zinc-500">
              No courses found. Try a larger radius or a different zip code.
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
