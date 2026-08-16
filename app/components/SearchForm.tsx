"use client";

import { useState } from "react";
import type { CourseResult } from "@/lib/search";
import { buildBookingLink, googleSearchFallback } from "@/lib/bookingLink";

type TimeRange = "any" | "morning" | "midday" | "afternoon" | "evening";

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  any: "Any time",
  morning: "Morning (6am–10am)",
  midday: "Midday (10am–1pm)",
  afternoon: "Afternoon (1pm–4pm)",
  evening: "Evening (4pm–close)",
};

export default function SearchForm() {
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);
  const [date, setDate] = useState("");
  const [players, setPlayers] = useState(4);
  const [timeRange, setTimeRange] = useState<TimeRange>("any");

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
        className="grid grid-cols-2 gap-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-4"
      >
        <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
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

        <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
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

        <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
          Date
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          />
        </label>

        <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
          Players
          <select
            value={players}
            onChange={(e) => setPlayers(Number(e.target.value))}
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-4">
          Time range
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          >
            {Object.entries(TIME_RANGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="col-span-2 mt-2 rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50 sm:col-span-4"
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
            const link = course.bookingUrl
              ? buildBookingLink(course.bookingUrl, { date, players })
              : googleSearchFallback(course.name, course.city, course.state);

            return (
              <div
                key={course.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium">{course.name}</p>
                  <p className="text-sm text-zinc-500">
                    {course.address}, {course.city}, {course.state} ·{" "}
                    {course.distanceMiles.toFixed(1)} mi
                  </p>
                </div>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-md border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                >
                  {course.bookingUrl ? "Book" : "Find booking page"}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
