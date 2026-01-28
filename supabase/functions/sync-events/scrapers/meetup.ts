/**
 * Meetup Scraper — Deno Edge Function version
 *
 * Returns RAW event objects. No transformation here;
 * standardize.ts handles all field mapping.
 *
 * Strategy:
 *   1. HTML scraping of search pages + group pages (primary — works from any IP)
 *   2. gql2 GraphQL API (fallback — may be blocked by Meetup's CDN on cloud IPs)
 *
 * Events are extracted from __APOLLO_STATE__ in the __NEXT_DATA__ script tag.
 */

// deno-lint-ignore-file no-explicit-any

import { delay, deduplicateBy, isChicagoArea } from '../utils.ts';

const CHICAGO_TECH_GROUPS = [
  'Chicago-AI-and-Machine-Learning-Meetup',
  'ChicagoRuby',
  'Chicago-Python-User-Group',
  'Chicago-JavaScript-Meetup',
  'Chicago-AWS-User-Group',
  'Chicago-Blockchain-Meetup',
  'Chicago-Tech-Founders',
  'Chicago-Startup-Founders',
  'Women-Who-Code-Chicago',
  'Chicago-Data-Science',
  'Chicago-DevOps-Meetup',
  'Chicago-React-Meetup',
  'Chicago-Golang-Meetup',
  'Chicago-Kubernetes-Meetup',
];

const SEARCH_TERMS = [
  'tech',
  'startup',
  'AI',
  'developer',
  'coding',
  'entrepreneur',
];

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const GQL_URL = 'https://www.meetup.com/gql2';

const EVENT_FIELDS = `
  id title description dateTime endTime eventUrl going isOnline
  venue { name address city state lat lng }
  group { name urlname link }
  images { baseUrl }
  hosts { name }
`;

const SEARCH_QUERY = `
  query($filter: EventSearchFilter!) {
    eventSearch(filter: $filter, first: 50) {
      edges { node { ${EVENT_FIELDS} } }
    }
  }
`;

const GROUP_QUERY = `
  query($urlname: String!) {
    groupByUrlname(urlname: $urlname) {
      events(first: 20) {
        edges { node { ${EVENT_FIELDS} } }
      }
    }
  }
`;

/**
 * Fetch all Meetup events. Returns raw event objects.
 */
export async function fetchMeetupEvents(): Promise<any[]> {
  const allEvents: any[] = [];

  // Primary: HTML scraping (works from cloud IPs)
  const htmlEvents = await fetchViaHtml();
  allEvents.push(...htmlEvents);

  // Fallback: try gql2 API if HTML returned few results
  if (allEvents.length < 10) {
    console.log('Meetup HTML returned few results, trying gql2 API...');
    const gqlEvents = await fetchViaGql();
    allEvents.push(...gqlEvents);
  }

  const unique = deduplicateBy(allEvents, (e) => e.id || e.eventUrl || JSON.stringify(e));
  return unique.filter(isChicagoArea);
}

// ============================================================
// HTML Scraping (Primary)
// ============================================================

async function fetchViaHtml(): Promise<any[]> {
  const allEvents: any[] = [];

  // Search pages
  for (const term of SEARCH_TERMS) {
    try {
      const url = `https://www.meetup.com/find/?keywords=${encodeURIComponent(term)}&location=Chicago%2C+IL&source=EVENTS`;
      const events = await scrapeApolloEvents(url);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`Meetup HTML search "${term}" failed:`, err);
    }
    await delay(500);
  }

  // Group pages
  for (const urlname of CHICAGO_TECH_GROUPS) {
    try {
      const url = `https://www.meetup.com/${urlname}/events/`;
      const events = await scrapeApolloEvents(url);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`Meetup HTML group "${urlname}" failed:`, err);
    }
    await delay(500);
  }

  return allEvents;
}

async function scrapeApolloEvents(url: string): Promise<any[]> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' },
    redirect: 'follow',
  });
  if (!resp.ok) return [];

  const html = await resp.text();
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!nextDataMatch) return [];

  try {
    const nextData = JSON.parse(nextDataMatch[1]);
    const apolloState = nextData.props?.pageProps?.__APOLLO_STATE__;
    if (!apolloState) return [];

    const events: any[] = [];
    for (const [key, value] of Object.entries(apolloState)) {
      if (key.startsWith('Event:') && (value as any).title) {
        const raw = value as any;
        // Resolve Apollo references for venue and group
        const venue = resolveRef(apolloState, raw.venue);
        const group = resolveRef(apolloState, raw.group);
        events.push({
          ...raw,
          venue: venue || raw.venue,
          group: group || raw.group,
        });
      }
    }
    return events;
  } catch {
    return [];
  }
}

/**
 * Apollo state stores references as { __ref: "Type:id" }.
 * Resolve them to the actual object.
 */
function resolveRef(state: any, ref: any): any {
  if (!ref?.__ref) return null;
  return state[ref.__ref] || null;
}

// ============================================================
// GraphQL API (Fallback)
// ============================================================

async function fetchViaGql(): Promise<any[]> {
  const allEvents: any[] = [];
  const headers = { 'Content-Type': 'application/json', 'User-Agent': BROWSER_UA };

  for (const term of SEARCH_TERMS) {
    try {
      const resp = await fetch(GQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: SEARCH_QUERY,
          variables: {
            filter: { query: `${term} chicago`, lat: 41.8781, lon: -87.6298, radius: 50 },
          },
        }),
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data.errors) continue;
      const edges = data.data?.eventSearch?.edges || [];
      for (const edge of edges) {
        if (edge.node?.id) allEvents.push(edge.node);
      }
    } catch (err) {
      console.warn(`Meetup gql2 search "${term}" failed:`, err);
    }
    await delay(500);
  }

  for (const urlname of CHICAGO_TECH_GROUPS) {
    try {
      const resp = await fetch(GQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: GROUP_QUERY, variables: { urlname } }),
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data.errors) continue;
      const edges = data.data?.groupByUrlname?.events?.edges || [];
      for (const edge of edges) {
        if (edge.node) allEvents.push(edge.node);
      }
    } catch (err) {
      console.warn(`Meetup gql2 group "${urlname}" failed:`, err);
    }
    await delay(500);
  }

  return allEvents;
}

