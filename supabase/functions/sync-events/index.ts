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
import { standardizeEvent, type FieldMapping } from './standardize.ts';
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
      .select('name, field_mapping, is_active')
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

    // Fetch raw events from all sources in parallel
    const fetchResults = await Promise.allSettled(
      activeSources.map(async (sourceConfig) => {
        const scraper = SCRAPERS[sourceConfig.name];
        const rawEvents = await scraper();
        return { sourceConfig, rawEvents };
      }),
    );

    const summary: Record<
      string,
      { found: number; created: number; errors: number; error?: string }
    > = {};

    // Process each source's results
    for (const result of fetchResults) {
      if (result.status === 'rejected') {
        // Find which source failed — can't determine easily from rejected promise
        console.error('Source fetch failed:', result.reason);
        continue;
      }

      const { sourceConfig, rawEvents } = result.value;
      const sourceName = sourceConfig.name;
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
      const uniqueEvents = Array.from(dedupMap.values());

      // Upsert to database
      let created = 0;
      let errors = 0;

      for (const event of uniqueEvents) {
        const { error } = await supabase
          .from('aggregated_events')
          .upsert(event, { onConflict: 'source,external_id' });

        if (error) {
          console.error(
            `Failed to upsert "${event.title}":`,
            error.message,
          );
          errors++;
        } else {
          created++;
        }
      }

      // Log to event_sync_logs
      await supabase.from('event_sync_logs').insert({
        source_name: sourceName,
        status: errors > 0 ? 'partial' : 'success',
        events_found: rawEvents.length,
        events_created: created,
        events_skipped: errors,
        duplicates_found: rawEvents.length - uniqueEvents.length,
      });

      // Update source status
      await supabase
        .from('event_sources')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: errors > 0 ? 'partial' : 'success',
          last_sync_count: created,
        })
        .eq('name', sourceName);

      summary[sourceName] = {
        found: rawEvents.length,
        created,
        errors,
      };
    }

    // Update event statuses (past/live/upcoming)
    await supabase.rpc('update_event_statuses');

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
