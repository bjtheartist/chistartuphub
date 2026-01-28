/**
 * Supabase Edge Function: sync-events
 *
 * Single runtime for Chicago Tech Events aggregation.
 * Scrapes Meetup, Eventbrite, and Luma, then standardizes and upserts.
 *
 * Triggers:
 *   - pg_cron (recommended, every 4 hours)
 *   - Manual: POST /functions/v1/sync-events
 *   - Optional body: { "sources": ["meetup"] } to sync specific sources
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { standardizeEvent, isValidEvent, type FieldMapping } from './standardize.ts';
import { fetchMeetupEvents } from './scrapers/meetup.ts';
import { fetchEventbriteEvents } from './scrapers/eventbrite.ts';
import { fetchLumaEvents } from './scrapers/luma.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// deno-lint-ignore no-explicit-any
type Scraper = () => Promise<any[]>;

const SCRAPERS: Record<string, Scraper> = {
  meetup: fetchMeetupEvents,
  eventbrite: fetchEventbriteEvents,
  luma: fetchLumaEvents,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Fix 3: Auth gate — require SYNC_SECRET if configured
  const syncSecret = Deno.env.get('SYNC_SECRET');
  if (syncSecret) {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    if (token !== syncSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional sources filter from request body
    let requestedSources: string[] | null = null;
    try {
      const body = await req.json();
      if (Array.isArray(body?.sources)) {
        requestedSources = body.sources;
      }
    } catch {
      // No body or invalid JSON — sync all sources
    }

    // Get active sources from DB
    const { data: sourcesConfig, error: sourcesError } = await supabase
      .from('event_sources')
      .select('name, field_mapping, is_active, last_sync_count')
      .eq('is_active', true);

    if (sourcesError) {
      throw new Error(`Failed to fetch event_sources: ${sourcesError.message}`);
    }

    // Filter to requested sources if specified
    const activeSources = (sourcesConfig || []).filter((s) => {
      if (!SCRAPERS[s.name]) return false; // Skip sources without a scraper (e.g. manual)
      if (requestedSources) return requestedSources.includes(s.name);
      return true;
    });

    console.log(
      `Starting sync for: ${activeSources.map((s) => s.name).join(', ')}`,
    );

    // Fix 5: Fetch raw events from all sources in parallel, tagging errors with source name
    const fetchResults = await Promise.allSettled(
      activeSources.map(async (sourceConfig) => {
        try {
          const scraper = SCRAPERS[sourceConfig.name];
          const rawEvents = await scraper();
          return { sourceConfig, rawEvents };
        } catch (err) {
          throw new Error(
            `[${sourceConfig.name}] ${(err as Error).message ?? err}`,
          );
        }
      }),
    );

    const summary: Record<
      string,
      { found: number; created: number; errors: number; error?: string }
    > = {};

    // Process each source's results
    for (const result of fetchResults) {
      if (result.status === 'rejected') {
        // Fix 5: Source name is now embedded in the error message
        console.error('Source fetch failed:', result.reason);
        continue;
      }

      const { sourceConfig, rawEvents } = result.value;
      const sourceName = sourceConfig.name;

      // Fix 2: Try/catch per source so one failure doesn't crash the rest
      try {
        const fieldMapping: FieldMapping = sourceConfig.field_mapping || {};

        console.log(`${sourceName}: ${rawEvents.length} raw events`);

        // Standardize all events
        const standardized = rawEvents.map((raw) =>
          standardizeEvent(raw, sourceName, fieldMapping),
        );

        // Deduplicate within this source by external_id
        const dedupMap = new Map<string, typeof standardized[0]>();
        for (const event of standardized) {
          if (event.external_id && !dedupMap.has(event.external_id)) {
            dedupMap.set(event.external_id, event);
          }
        }
        const deduped = Array.from(dedupMap.values());

        // Filter out invalid events (missing NOT NULL fields)
        const uniqueEvents = deduped.filter((evt) => {
          const { valid, reason } = isValidEvent(evt);
          if (!valid) {
            console.warn(`${sourceName}: skipping invalid event: ${reason} — "${evt.title || '(no title)'}"`);
          }
          return valid;
        });

        // Fix 1: Batch upsert instead of sequential per-event upsert
        let created = 0;
        let errors = 0;

        const { error: upsertError } = await supabase
          .from('aggregated_events')
          .upsert(uniqueEvents, { onConflict: 'source,external_id' });

        if (upsertError) {
          console.error(
            `Batch upsert failed for ${sourceName}:`,
            upsertError.message,
          );
          errors = uniqueEvents.length;
        } else {
          created = uniqueEvents.length;
        }

        const syncStatus = errors > 0 ? 'partial' : 'success';
        const errorMessage = upsertError?.message ?? null;

        // Fix 6: Wrap post-upsert DB calls in try/catch
        // Log to event_sync_logs
        try {
          await supabase.from('event_sync_logs').insert({
            source_name: sourceName,
            status: syncStatus,
            events_found: rawEvents.length,
            events_created: created,
            events_skipped: errors,
            duplicates_found: rawEvents.length - uniqueEvents.length,
            // Fix 4: Set completed_at and error_message
            completed_at: new Date().toISOString(),
            error_message: errorMessage,
          });
        } catch (logErr) {
          console.error(
            `Failed to insert sync log for ${sourceName}:`,
            (logErr as Error).message,
          );
        }

        // Update source status
        try {
          await supabase
            .from('event_sources')
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_status: syncStatus,
              last_sync_count: created,
            })
            .eq('name', sourceName);
        } catch (updateErr) {
          console.error(
            `Failed to update event_sources for ${sourceName}:`,
            (updateErr as Error).message,
          );
        }

        // Fix 4: Zero-event threshold warning
        if (
          rawEvents.length === 0 &&
          sourceConfig.last_sync_count != null &&
          sourceConfig.last_sync_count > 0
        ) {
          console.warn(
            `WARNING: ${sourceName} returned 0 events but previously had ${sourceConfig.last_sync_count}. Possible scraper failure.`,
          );
        }

        summary[sourceName] = {
          found: rawEvents.length,
          created,
          errors,
          ...(errorMessage ? { error: errorMessage } : {}),
        };
      } catch (sourceErr) {
        console.error(
          `Processing failed for ${sourceName}:`,
          (sourceErr as Error).message,
        );
        summary[sourceName] = {
          found: rawEvents.length,
          created: 0,
          errors: rawEvents.length,
          error: (sourceErr as Error).message,
        };
      }
    }

    // Fix 6: Wrap update_event_statuses RPC in try/catch
    try {
      await supabase.rpc('update_event_statuses');
    } catch (rpcErr) {
      console.error(
        'Failed to update event statuses:',
        (rpcErr as Error).message,
      );
    }

    console.log('Sync complete:', JSON.stringify(summary));

    return new Response(
      JSON.stringify({ success: true, summary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Sync failed:', error);

    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
