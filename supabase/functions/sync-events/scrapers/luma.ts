/**
 * Luma Scraper — Deno Edge Function version
 *
 * Returns RAW Luma event objects. No transformation here;
 * standardize.ts handles all field mapping.
 *
 * Fetches from:
 * 1. Known Chicago calendar slugs → resolve via /url API → GET /calendar/get-items
 * 2. HTML __NEXT_DATA__ / JSON-LD fallback
 *
 * Note: The old /public/v1/* endpoints are 404. The current API uses
 *   GET /url?url=SLUG to resolve a slug to a calendar_api_id, then
 *   GET /calendar/get-items?calendar_api_id=ID&period=future to list events.
 */

// deno-lint-ignore-file no-explicit-any

import { delay, deduplicateBy, isChicagoArea, parseJsonLdEvents } from '../utils.ts';

const CHICAGO_LUMA_CALENDARS = [
  'chicagotech',
  'chicagoai',
];

/**
 * Fetch all Luma events. Returns raw Luma event objects.
 */
export async function fetchLumaEvents(): Promise<any[]> {
  const allEvents: any[] = [];

  for (const slug of CHICAGO_LUMA_CALENDARS) {
    try {
      const events = await fetchCalendarEvents(slug);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`Luma calendar "${slug}" failed:`, err);
    }
    await delay(500);
  }

  const unique = deduplicateBy(allEvents, (e) => e.api_id || e.event_id || e.id || '');
  return unique.filter(isChicagoArea);
}

/**
 * Resolve a calendar slug to its api_id, then fetch future events.
 */
async function fetchCalendarEvents(calendarSlug: string): Promise<any[]> {
  // Step 1: Resolve slug → calendar_api_id
  const calApiId = await resolveCalendarId(calendarSlug);
  if (!calApiId) {
    console.warn(`Luma slug "${calendarSlug}" could not be resolved, falling back to HTML`);
    return await scrapeCalendarPage(calendarSlug);
  }

  // Step 2: Fetch events via GET /calendar/get-items
  let allEntries: any[] = [];
  let cursor: string | null = null;

  // Paginate (the API supports next_cursor)
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({
      calendar_api_id: calApiId,
      period: 'future',
      pagination_limit: '50',
    });
    if (cursor) params.set('pagination_cursor', cursor);

    const resp = await fetch(`https://api.lu.ma/calendar/get-items?${params}`);
    if (!resp.ok) {
      console.warn(`Luma get-items for "${calendarSlug}" HTTP ${resp.status}`);
      break;
    }

    const data = await resp.json();
    const entries = data.entries || [];
    allEntries = allEntries.concat(entries);

    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
    await delay(300);
  }

  if (allEntries.length === 0) {
    // Fallback to HTML scraping
    return await scrapeCalendarPage(calendarSlug);
  }

  return allEntries.map((entry: any) => entry.event).filter(Boolean);
}

/**
 * Resolve a Luma calendar slug to its internal calendar_api_id.
 */
async function resolveCalendarId(slug: string): Promise<string | null> {
  try {
    const resp = await fetch(`https://api.lu.ma/url?url=${encodeURIComponent(slug)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.data?.calendar?.api_id || null;
  } catch {
    return null;
  }
}

async function scrapeCalendarPage(calendarSlug: string): Promise<any[]> {
  const resp = await fetch(`https://lu.ma/${calendarSlug}`, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (compatible; ChiStartupHub/1.0)',
    },
  });

  if (!resp.ok) {
    throw new Error(`Luma HTML fetch failed: ${resp.status}`);
  }

  const html = await resp.text();
  return parseHtmlEvents(html);
}

function parseHtmlEvents(html: string): any[] {
  const events: any[] = [];

  // __NEXT_DATA__
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );

  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const pageProps = nextData.props?.pageProps;

      const sources = [
        pageProps?.initialData?.entries,
        pageProps?.entries,
        pageProps?.events,
      ];

      for (const source of sources) {
        if (Array.isArray(source)) {
          for (const item of source) {
            const event = item.event || item;
            if (event.api_id || event.event_id) {
              events.push(event);
            }
          }
        }
      }
    } catch {
      // Skip
    }
  }

  // JSON-LD (shared utility tags with _sourceFormat)
  events.push(...parseJsonLdEvents(html));

  return events;
}

