export function googleSearchFallback(courseName: string, city: string, state: string): string {
  const query = `${courseName} ${city} ${state} tee times`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
