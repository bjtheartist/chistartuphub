/**
 * Eventbrite Scraper — Deno Edge Function version
 *
 * Returns RAW event data with a `_sourceFormat` tag so the standardizer
 * knows which sub-mapping to use.
 *
 * Formats: 'api' (browse API), 'jsonld' (HTML JSON-LD), 'serverdata' (HTML __SERVER_DATA__)
 */

// deno-lint-ignore-file no-explicit-any

import { delay, deduplicateBy, parseJsonLdEvents } from '../utils.ts';

const SEARCH_KEYWORDS = [
  'tech',
  'startup',
  'AI',
  'developer',
  'coding',
  'entrepreneur',
  'innovation',
  'hackathon',
];

/**
 * Fetch all Eventbrite events. Returns raw objects tagged with _sourceFormat.
 */
export async function fetchEventbriteEvents(): Promise<any[]> {
  const allEvents: any[] = [];

  for (const keyword of SEARCH_KEYWORDS) {
    try {
      const events = await searchEvents(keyword);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`Eventbrite "${keyword}" failed:`, err);
    }
    await delay(500);
  }

  return deduplicateBy(allEvents, deriveId);
}

async function searchEvents(keyword: string): Promise<any[]> {
  // Attempt the browse API first
  const apiUrl = `https://www.eventbrite.com/api/v3/destination/search/?${new URLSearchParams({
    q: keyword,
    page: '1',
    page_size: '50',
    place: 'Chicago',
    bbox: '-88.263,41.6445,-87.5244,42.0231',
    date_range: 'current_future',
    online_events_only: 'false',
  })}`;

  try {
    const resp = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ChiStartupHub/1.0)',
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      const events = data.events?.results || data.events || [];
      return events.map((e: any) => ({ ...e, _sourceFormat: 'api' }));
    }
  } catch {
    // Fall through to HTML scraping
  }

  // Fallback: scrape the search results page
  return await scrapeSearchPage(keyword);
}

async function scrapeSearchPage(keyword: string): Promise<any[]> {
  const url = `https://www.eventbrite.com/d/il--chicago/${encodeURIComponent(keyword)}/`;

  const resp = await fetch(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (compatible; ChiStartupHub/1.0)',
    },
  });

  if (!resp.ok) {
    throw new Error(`Eventbrite HTML fetch failed: ${resp.status}`);
  }

  const html = await resp.text();
  return parseHtmlResults(html);
}

function parseHtmlResults(html: string): any[] {
  // JSON-LD structured data (shared utility)
  const events: any[] = parseJsonLdEvents(html);

  // __SERVER_DATA__
  const serverDataMatch = html.match(
    /window\.__SERVER_DATA__\s*=\s*({[\s\S]*?});/,
  );
  if (serverDataMatch) {
    try {
      const serverData = JSON.parse(serverDataMatch[1]);
      const searchEvents =
        serverData?.search_data?.events?.results || [];
      for (const e of searchEvents) {
        events.push({ ...e, _sourceFormat: 'serverdata' });
      }
    } catch {
      // Skip
    }
  }

  return events;
}

/**
 * Derive a stable ID from raw event data regardless of format.
 */
function deriveId(event: any): string {
  if (event._sourceFormat === 'api' || event._sourceFormat === 'serverdata') {
    return String(event.id || event.event_id || '');
  }
  // JSON-LD: extract from URL
  if (event.url) {
    const match = event.url.match(/\/e\/[^/]*?-(\d+)(?:\?|$)/);
    if (match) return match[1];
    const numMatch = event.url.match(/(\d{6,})(?:\?|$)/);
    if (numMatch) return numMatch[1];
    return event.url;
  }
  return '';
}
