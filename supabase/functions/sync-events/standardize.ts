/**
 * Event Standardization Module
 *
 * Single source of truth for transforming raw scraper data into
 * the aggregated_events schema. All field mapping, categorization,
 * and dedup hashing lives here.
 */

// deno-lint-ignore-file no-explicit-any

export interface StandardizedEvent {
  source: string;
  external_id: string;
  source_url: string;
  title: string;
  description: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  is_virtual: boolean;
  venue_name: string;
  venue_address: string;
  city: string;
  state: string;
  virtual_url: string | null;
  organizer_name: string;
  organizer_url: string | null;
  category: string | null;
  tags: string[];
  image_url: string | null;
  registration_url: string;
  is_free: boolean;
  price_info: string | null;
  status: string;
  dedup_hash: string;
  raw_data: Record<string, unknown>;
}

export interface FieldMapping {
  default?: Record<string, string>;
  jsonld?: Record<string, string>;
  serverdata?: Record<string, string>;
  [key: string]: Record<string, string> | undefined;
}

/**
 * Standardize a raw event from any source into the aggregated_events schema.
 *
 * @param rawEvent - Raw event object from scraper
 * @param source - Source name (meetup, eventbrite, luma)
 * @param fieldMapping - DB-driven field mapping (format-aware sub-mappings)
 */
export function standardizeEvent(
  rawEvent: Record<string, any>,
  source: string,
  fieldMapping: FieldMapping,
): StandardizedEvent {
  // Pick the right sub-mapping based on _sourceFormat tag
  const format = rawEvent._sourceFormat || 'default';
  const mapping = fieldMapping[format] || fieldMapping.default || {};

  const event: StandardizedEvent = {
    source,
    external_id: '',
    source_url: '',
    title: '',
    description: '',
    event_date: null,
    start_time: null,
    end_time: null,
    timezone: 'America/Chicago',
    is_virtual: false,
    venue_name: '',
    venue_address: '',
    city: 'Chicago',
    state: 'IL',
    virtual_url: null,
    organizer_name: '',
    organizer_url: null,
    category: null,
    tags: [],
    image_url: null,
    registration_url: '',
    is_free: true,
    price_info: null,
    status: 'upcoming',
    dedup_hash: '',
    raw_data: rawEvent,
  };

  // Apply field mapping
  for (const [sourcePath, targetField] of Object.entries(mapping)) {
    const value = getNestedValue(rawEvent, sourcePath);
    if (value !== undefined && value !== null) {
      (event as any)[targetField] = value;
    }
  }

  // Post-processing: clean description
  event.description = cleanDescription(event.description);

  // Normalize timestamps
  event.event_date = extractDate(event.start_time);
  event.start_time = normalizeTimestamp(event.start_time);
  event.end_time = event.end_time ? normalizeTimestamp(event.end_time) : null;

  // Extract external_id from URL if still missing (Eventbrite JSON-LD case)
  if (!event.external_id && event.source_url) {
    event.external_id = extractExternalIdFromUrl(event.source_url, source);
  }

  // Auto-categorize if not set
  if (!event.category) {
    event.category = autoCategorize(event.title, event.description);
  }

  // Generate dedup hash
  event.dedup_hash = generateDedupHash(event.title, event.event_date, event.venue_name, event.start_time);

  // Fallback registration URL
  if (!event.registration_url) {
    event.registration_url = event.source_url;
  }

  // Strip internal fields from raw_data
  const { _sourceFormat: _, ...cleanRaw } = rawEvent;
  event.raw_data = cleanRaw;

  return event;
}

/**
 * Validate that a standardized event has all required NOT NULL fields
 * before upserting into the aggregated_events table.
 */
export function isValidEvent(event: StandardizedEvent): { valid: boolean; reason?: string } {
  if (!event.external_id) return { valid: false, reason: 'missing external_id' };
  if (!event.source_url) return { valid: false, reason: 'missing source_url' };
  if (!event.title) return { valid: false, reason: 'missing title' };
  if (!event.event_date) return { valid: false, reason: 'missing event_date' };
  if (!event.start_time) return { valid: false, reason: 'missing start_time' };
  return { valid: true };
}

/**
 * Get a nested value from an object using dot notation.
 * Supports array indexing like "hosts[0].name".
 */
export function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current?.[key]?.[parseInt(index)];
    } else {
      current = current?.[part];
    }
    if (current === undefined) return undefined;
  }

  return current;
}

/**
 * Extract date (YYYY-MM-DD) from a timestamp string.
 */
export function extractDate(timestamp: string | null): string | null {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Normalize a timestamp to ISO 8601 format.
 */
export function normalizeTimestamp(timestamp: string | null): string | null {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Auto-categorize an event based on keyword patterns in title/description.
 */
export function autoCategorize(title: string, description: string): string {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  if (/artificial intelligence|machine learning|ai\/ml|llm|gpt|neural|deep learning/.test(text)) {
    return 'ai-ml';
  }
  if (/web3|blockchain|crypto|defi|nft|ethereum|solana/.test(text)) {
    return 'web3';
  }
  if (/workshop|hands-on|tutorial|bootcamp|training/.test(text)) {
    return 'workshop';
  }
  if (/pitch|demo day|investor|funding|venture|angel/.test(text)) {
    return 'pitch';
  }
  if (/conference|summit|expo|convention/.test(text)) {
    return 'conference';
  }

  return 'networking';
}

/**
 * Generate an MD5-based deduplication hash from title + date + venue.
 * Uses Web Crypto API available in Deno / Supabase Edge Runtime.
 */
export function generateDedupHash(
  title: string,
  eventDate: string | null,
  venueName: string,
  startTime: string | null = null,
): string {
  const normalized = [
    (title || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    eventDate || '',
    (venueName || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    startTime || '',
  ].join('');

  // Synchronous hash using simple djb2 + fnv mix for deterministic output.
  // crypto.subtle.digest is async and MD5 may not be available in all
  // Supabase edge runtimes, so we use a fast JS hash that produces
  // consistent 16-hex-char strings.
  let h1 = 0x811c9dc5; // FNV offset basis
  let h2 = 5381; // DJB2 seed
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193); // FNV prime
    h2 = Math.imul(h2, 33) + c;
  }
  const lo = (h1 >>> 0).toString(16).padStart(8, '0');
  const hi = (h2 >>> 0).toString(16).padStart(8, '0');
  return lo + hi;
}

/**
 * Strip HTML tags and truncate to 2000 chars.
 */
export function cleanDescription(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);
}

/**
 * Extract an external_id from a URL when the raw data doesn't provide one.
 */
function extractExternalIdFromUrl(url: string, source: string): string {
  if (source === 'eventbrite') {
    // Eventbrite URLs: https://www.eventbrite.com/e/title-123456789
    const match = url.match(/\/e\/[^/]*?-(\d+)/);
    if (match) return match[1];
    // Fallback: last numeric segment
    const numMatch = url.match(/(\d{6,})(?:\?|$)/);
    if (numMatch) return numMatch[1];
  }
  if (source === 'luma') {
    // Luma URLs: https://lu.ma/eventslug
    const slug = url.split('/').pop()?.split('?')[0];
    if (slug) return slug;
  }
  // Generic fallback
  return url;
}
