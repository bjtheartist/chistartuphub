export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Generic deduplication helper. Keeps the first occurrence for each key.
 */
export function deduplicateBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = keyFn(item);
    if (key && !seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}

/**
 * Parse JSON-LD Event blocks from raw HTML.
 * Shared across scrapers that rely on structured data (Eventbrite, Luma).
 */
// deno-lint-ignore no-explicit-any
export function parseJsonLdEvents(html: string): any[] {
  // deno-lint-ignore no-explicit-any
  const events: any[] = [];
  const matches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (!matches) return events;
  for (const match of matches) {
    try {
      const jsonStr = match
        .replace(/<script type="application\/ld\+json">/, '')
        .replace(/<\/script>/, '');
      const data = JSON.parse(jsonStr);
      if (data['@type'] === 'Event') {
        events.push({ ...data, _sourceFormat: 'jsonld' });
      } else if (Array.isArray(data)) {
        for (const item of data) {
          if (item['@type'] === 'Event') {
            events.push({ ...item, _sourceFormat: 'jsonld' });
          }
        }
      }
    } catch {
      // Skip invalid JSON-LD
    }
  }
  return events;
}

/**
 * Check whether an event is in the Chicago metro area.
 * Handles Meetup, Luma, and JSON-LD event formats.
 */
// deno-lint-ignore no-explicit-any
export function isChicagoArea(event: any): boolean {
  // Virtual/online events always included
  if (event.isOnline || event.location_type === 'online') return true;

  let city = '';
  let address = '';
  let state = '';

  // Meetup format
  if (event.venue?.city) {
    city = (event.venue.city || '').toLowerCase();
    state = (event.venue.state || '').toLowerCase();
    address = (event.venue.address || '').toLowerCase();
  }

  // Luma geo_address_json format
  if (event.geo_address_json) {
    let geo = event.geo_address_json;
    if (typeof geo === 'string') {
      try { geo = JSON.parse(geo); } catch { geo = {}; }
    }
    city = city || (geo.city || '').toLowerCase();
    address = address || (geo.full_address || geo.address || '').toLowerCase();
  }

  // Luma geo_address_info format
  if (event.geo_address_info) {
    city = city || (event.geo_address_info.city || '').toLowerCase();
    address = address || (event.geo_address_info.full_address || '').toLowerCase();
  }

  // JSON-LD format
  if (event.location?.address?.addressLocality) {
    city = city || event.location.address.addressLocality.toLowerCase();
  }

  const chicagoCities = [
    'chicago', 'evanston', 'oak park', 'skokie', 'naperville',
    'schaumburg', 'aurora', 'joliet', 'elgin', 'waukegan',
    'cicero', 'arlington heights', 'bolingbrook', 'palatine',
  ];

  if (chicagoCities.includes(city)) return true;
  if (state === 'il' || state === 'illinois') return true;

  const indicators = ['chicago', 'il', 'illinois', ...chicagoCities];
  return indicators.some(ind => address.includes(ind));
}
