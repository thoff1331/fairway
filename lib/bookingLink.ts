export type SearchPrefs = {
  date: string; // yyyy-mm-dd
  players: number;
};

/**
 * Some booking platforms accept query params that pre-fill their own search.
 * Only add params for platforms we've confirmed the param format for —
 * otherwise return the plain booking URL unchanged.
 */
export function buildBookingLink(bookingUrl: string, prefs: SearchPrefs): string {
  try {
    const url = new URL(bookingUrl);

    if (url.hostname.endsWith("foreupsoftware.com")) {
      url.searchParams.set("date", prefs.date);
      url.searchParams.set("players", String(prefs.players));
    }

    return url.toString();
  } catch {
    return bookingUrl;
  }
}

export function googleSearchFallback(courseName: string, city: string, state: string): string {
  const query = `${courseName} ${city} ${state} tee times`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
