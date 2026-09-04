import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Search,
  ArrowUpRight,
  MapPin,
  Video,
  Repeat,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { entities, supabase } from "@/api/supabaseClient";
import SEO from "@/components/SEO";
import ShareActions from "@/components/ShareActions";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

// ===========================================
// Taxonomy
// ===========================================
// `event_type` is the FORMAT of an event (set by classify_event_type() in
// Postgres). The UI filters on groups of formats so the chip row stays short.
const TYPE_GROUPS = [
  { id: "all", label: "All Events", types: null },
  { id: "summits", label: "Summits & Conferences", types: ["summit", "conference", "expo"] },
  { id: "pitch", label: "Demo Days & Pitch", types: ["demo_day", "pitch"] },
  { id: "awards", label: "Awards", types: ["awards"] },
  { id: "workshops", label: "Workshops", types: ["workshop"] },
  { id: "talks", label: "Talks & Panels", types: ["panel"] },
  { id: "hackathons", label: "Hackathons", types: ["hackathon"] },
  { id: "office-hours", label: "Office Hours & AMAs", types: ["office_hours"] },
  { id: "meetups", label: "Meetups & Networking", types: ["meetup"] },
];

const TYPE_LABELS = {
  summit: "Summit",
  conference: "Conference",
  expo: "Expo",
  demo_day: "Demo Day",
  pitch: "Pitch",
  awards: "Awards",
  hackathon: "Hackathon",
  workshop: "Workshop",
  office_hours: "Office Hours",
  panel: "Talk",
  meetup: "Meetup",
};

const FORMATS = [
  { id: "any", label: "Any Format" },
  { id: "in-person", label: "In Person" },
  { id: "virtual", label: "Virtual" },
];

const SOURCE_CONFIG = {
  meetup: { label: "Meetup", color: "text-red-400" },
  eventbrite: { label: "Eventbrite", color: "text-orange-400" },
  luma: { label: "Luma", color: "text-purple-400" },
  manual: { label: "ChiStartup", color: "text-blue-400" },
};

// Scrapers occasionally emit listings that are not events (mailing-list
// promos, ticket giveaways). Hide them without touching the raw rows.
const JUNK_TITLE = /(email list|mailing list|free tickets!|subscribe now)/i;

// Anything more than 18 months out is a placeholder date, not a plan.
const HORIZON_MONTHS = 18;

// ===========================================
// Date helpers (all parse YYYY-MM-DD as local time to avoid UTC day shift)
// ===========================================
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

const formatEventDate = (dateStr) => {
  const date = parseLocalDate(dateStr);
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) {
    return { day: "Today", weekday: date.toLocaleDateString("en-US", { weekday: "long" }) };
  }
  if (date.getTime() === tomorrow.getTime()) {
    return { day: "Tomorrow", weekday: date.toLocaleDateString("en-US", { weekday: "long" }) };
  }
  const sameYear = date.getFullYear() === today.getFullYear();
  return {
    day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weekday: sameYear
      ? date.toLocaleDateString("en-US", { weekday: "long" })
      : `${date.toLocaleDateString("en-US", { weekday: "short" })} · ${date.getFullYear()}`,
  };
};

const formatTime = (timeStr) =>
  new Date(timeStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

const formatShortDate = (dateStr) =>
  parseLocalDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// "Oct 19–20", "Oct 30–Nov 2", or "Nov 17" for a single day.
const formatDateRange = (startStr, endStr) => {
  const start = parseLocalDate(startStr);
  if (!endStr || endStr === startStr) {
    return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const end = parseLocalDate(endStr);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}`;
};

// "In 45 days", "This week", "Happening now", "Tomorrow"
const countdownLabel = (startStr, endStr) => {
  const today = startOfToday();
  const start = parseLocalDate(startStr);
  const end = endStr ? parseLocalDate(endStr) : start;
  if (start <= today && end >= today) return { text: "Happening now", live: true };
  const days = Math.round((start - today) / 86400000);
  if (days === 1) return { text: "Tomorrow", live: false };
  if (days <= 7) return { text: "This week", live: false };
  if (days <= 14) return { text: "Next week", live: false };
  if (days < 60) return { text: `In ${days} days`, live: false };
  const months = Math.round(days / 30);
  return { text: `In ${months} months`, live: false };
};

// ===========================================
// Data shaping
// ===========================================
const normalizeTitle = (title) =>
  (title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Collapse recurring series (same title + organizer) into one card that
// lists the other dates, so a monthly AMA does not fill the whole timeline.
const collapseSeries = (events) => {
  const seen = new Map();
  const out = [];
  for (const event of events) {
    const key = `${normalizeTitle(event.title)}|${(event.organizer_name || "").toLowerCase()}`;
    const existing = seen.get(key);
    if (existing) {
      existing.seriesDates.push(event.event_date);
    } else {
      const entry = { ...event, seriesDates: [] };
      seen.set(key, entry);
      out.push(entry);
    }
  }
  return out;
};

const groupEventsByDate = (events) => {
  const groups = {};
  for (const event of events) {
    (groups[event.event_date] ||= []).push(event);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
};

const matchesTypeGroup = (event, group) =>
  !group.types || group.types.includes(event.event_type);

// ===========================================
// Components
// ===========================================
function TypeBadge({ type, tone = "muted" }) {
  if (!type) return null;
  const label = TYPE_LABELS[type] || type;
  const cls =
    tone === "bright"
      ? "border-white/40 text-white"
      : "border-white/10 text-white/40";
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.15em] border px-2 py-1 ${cls}`}>
      {label}
    </span>
  );
}

function SpotlightCard({ event, featured = false }) {
  const range = formatDateRange(event.event_date, event.end_date);
  const start = parseLocalDate(event.event_date);
  const year = start.getFullYear();
  const weekday = event.end_date && event.end_date !== event.event_date
    ? `${start.toLocaleDateString("en-US", { weekday: "short" })} – ${parseLocalDate(event.end_date).toLocaleDateString("en-US", { weekday: "short" })}`
    : start.toLocaleDateString("en-US", { weekday: "long" });
  const countdown = countdownLabel(event.event_date, event.end_date);
  const href = event.registration_url || event.source_url;

  return (
    <article
      className={`group relative border border-white/20 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/40 transition-all duration-300 ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <div className={`flex flex-col ${featured ? "md:flex-row" : ""}`}>
        {/* Date block */}
        <div
          className={`border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between ${
            featured ? "md:w-64 flex-shrink-0" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-6">
            {countdown.live && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${countdown.live ? "text-red-400" : "text-white/50"}`}>
              {countdown.text}
            </span>
          </div>
          <div>
            <div className={`font-mono text-white leading-none ${featured ? "text-4xl md:text-5xl" : "text-3xl"}`}>
              {range}
            </div>
            <div className="font-mono text-xs text-white/40 uppercase tracking-[0.1em] mt-3">
              {weekday} · {year}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <TypeBadge type={event.event_type} tone="bright" />
            {event.is_free && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-400">Free</span>
            )}
          </div>

          <h3 className={`font-serif text-white leading-tight mb-3 ${featured ? "text-3xl md:text-4xl" : "text-2xl"}`}>
            {event.title}
          </h3>

          {event.tagline && (
            <p className="font-serif italic text-white/60 text-lg mb-6 max-w-xl">{event.tagline}</p>
          )}

          <div className="mt-auto space-y-2 mb-6 text-sm text-white/50">
            <div className="flex items-center gap-2">
              {event.is_virtual ? (
                <Video className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              ) : (
                <MapPin className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              )}
              <span>
                {event.is_virtual ? "Virtual" : event.venue_name}
                {!event.is_virtual && event.venue_address && (
                  <span className="text-white/30">, {event.venue_address}</span>
                )}
              </span>
            </div>
            {event.organizer_name && (
              <div className="text-white/40">Hosted by {event.organizer_name}</div>
            )}
            {event.price_info && !event.is_free && (
              <div className="font-mono text-[11px] text-white/40 uppercase tracking-[0.1em]">{event.price_info}</div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Register for ${event.title}`}
              className="font-mono text-[10px] uppercase tracking-[0.15em] px-5 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors flex items-center gap-2 cursor-crosshair"
            >
              <span>Register</span>
              <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
            </a>
            <ShareActions resourceType="event" resourceId={event.id} resourceName={event.title} />
          </div>
        </div>
      </div>
    </article>
  );
}

function EventCard({ event }) {
  const sourceConfig = SOURCE_CONFIG[event.source] || SOURCE_CONFIG.manual;
  const href = event.registration_url || event.source_url;
  const extraDates = event.seriesDates || [];
  const isMultiDay = event.end_date && event.end_date !== event.event_date;

  return (
    <div className="group relative bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300">
      {event.status === "live" && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-400">Live</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {event.image_url && (
          <div className="md:w-48 h-32 md:h-auto relative overflow-hidden flex-shrink-0">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050A14]/80" />
          </div>
        )}

        <div className="flex-1 p-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
            <span className="font-mono text-sm text-white/60">
              {isMultiDay ? (
                formatDateRange(event.event_date, event.end_date)
              ) : (
                <>
                  {formatTime(event.start_time)}
                  {event.end_time && <span className="text-white/30"> — {formatTime(event.end_time)}</span>}
                </>
              )}
            </span>
            <TypeBadge type={event.event_type} />
            <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${sourceConfig.color}`}>
              {sourceConfig.label}
            </span>
            {event.is_free && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-400/80">Free</span>
            )}
          </div>

          <h3 className="font-serif text-xl text-white mb-2">{event.title}</h3>

          {event.organizer_name && (
            <p className="text-white/40 text-sm mb-3">By {event.organizer_name}</p>
          )}

          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            {event.is_virtual ? (
              <>
                <Video className="w-4 h-4" strokeWidth={1.5} />
                <span>Virtual Event</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
                <span>
                  {event.venue_name}
                  {event.venue_address && `, ${event.venue_address}`}
                </span>
              </>
            )}
          </div>

          {extraDates.length > 0 && (
            <div className="flex items-start gap-2 text-white/40 text-xs mb-4 font-mono">
              <Repeat className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <span>
                Recurring · also {extraDates.slice(0, 3).map(formatShortDate).join(", ")}
                {extraDates.length > 3 && ` +${extraDates.length - 3} more`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`RSVP for ${event.title}`}
              className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-2 cursor-crosshair"
            >
              <span>RSVP</span>
              <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
            </a>
            <ShareActions resourceType="event" resourceId={event.id} resourceName={event.title} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DateHeader({ date }) {
  const { day, weekday } = formatEventDate(date);
  const isToday = day === "Today";
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="text-right min-w-[100px]">
        <div className={`font-mono text-lg ${isToday ? "text-white" : "text-white/70"}`}>{day}</div>
        <div className="font-mono text-xs text-white/40 uppercase tracking-[0.1em]">{weekday}</div>
      </div>
      <div className="relative flex items-center">
        <div className={`w-3 h-3 border-2 ${isToday ? "border-white bg-white/20" : "border-white/30 bg-transparent"}`} />
      </div>
    </div>
  );
}

function Chip({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border transition-colors cursor-crosshair flex items-center gap-2 ${
        active
          ? "bg-white text-black border-white"
          : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
      }`}
    >
      <span>{children}</span>
      {typeof count === "number" && (
        <span className={active ? "text-black/50" : "text-white/25"}>{count}</span>
      )}
    </button>
  );
}

// ===========================================
// Page
// ===========================================
export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoaded, setIsLoaded] = useState(false);

  // URL-backed filter state so a filtered view is shareable.
  const viewMode = searchParams.get("view") === "past" ? "past" : "upcoming";
  const typeGroupId = searchParams.get("type") || "all";
  const format = searchParams.get("format") || "any";
  const freeOnly = searchParams.get("free") === "1";
  const searchQuery = searchParams.get("q") || "";

  const setParam = useCallback(
    (key, value, defaultValue) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === defaultValue || value === "" || value == null) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearFilters = () => setSearchParams({}, { replace: true });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: eventHubs = [] } = useQuery({
    queryKey: ["event-hubs"],
    queryFn: () => entities.EventHub.list("-created_date"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: rawEvents = [], isLoading: eventsLoading, isError } = useQuery({
    queryKey: ["aggregated-events-v2", viewMode],
    queryFn: async () => {
      const today = toISODate(startOfToday());
      const horizon = new Date(startOfToday());
      horizon.setMonth(horizon.getMonth() + HORIZON_MONTHS);

      let query = supabase
        .from("aggregated_events")
        .select(
          "id, source, source_url, title, description, event_date, end_date, start_time, end_time, timezone, is_virtual, venue_name, venue_address, city, virtual_url, organizer_name, category, event_type, image_url, registration_url, is_free, price_info, status, is_marquee, marquee_rank, tagline"
        )
        .eq("is_duplicate", false);

      if (viewMode === "past") {
        query = query
          .eq("status", "past")
          .order("event_date", { ascending: false })
          .order("start_time", { ascending: false })
          .limit(100);
      } else {
        query = query
          .in("status", ["upcoming", "live"])
          // Multi-day events stay listed until their last day.
          .or(`event_date.gte.${today},end_date.gte.${today}`)
          .lte("event_date", toISODate(horizon))
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(300);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).filter((e) => !JUNK_TITLE.test(e.title || ""));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Spotlight = curated marquee rows, ranked. Only for the upcoming view.
  const marqueeEvents = useMemo(() => {
    if (viewMode === "past") return [];
    return rawEvents
      .filter((e) => e.is_marquee)
      .sort((a, b) => (a.marquee_rank ?? 999) - (b.marquee_rank ?? 999) || a.event_date.localeCompare(b.event_date));
  }, [rawEvents, viewMode]);

  // Timeline = everything (marquee included, so type filters still find
  // them), with recurring series collapsed.
  const timelineBase = useMemo(() => collapseSeries(rawEvents), [rawEvents]);

  // Counts per type group, computed BEFORE the type filter so chips show
  // what each one would reveal.
  const typeCounts = useMemo(() => {
    const counts = {};
    for (const group of TYPE_GROUPS) {
      counts[group.id] = timelineBase.filter((e) => matchesTypeGroup(e, group)).length;
    }
    return counts;
  }, [timelineBase]);

  const activeGroup = TYPE_GROUPS.find((g) => g.id === typeGroupId) || TYPE_GROUPS[0];

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return timelineBase.filter((event) => {
      if (!matchesTypeGroup(event, activeGroup)) return false;
      if (format === "virtual" && !event.is_virtual) return false;
      if (format === "in-person" && event.is_virtual) return false;
      if (freeOnly && !event.is_free) return false;
      if (q) {
        const haystack = `${event.title} ${event.description || ""} ${event.organizer_name || ""} ${event.venue_name || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [timelineBase, activeGroup, format, freeOnly, searchQuery]);

  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);
  const hasActiveFilters = typeGroupId !== "all" || format !== "any" || freeOnly || !!searchQuery;

  return (
    <div className="min-h-screen relative" data-page="events">
      <SEO
        title="Chicago Tech Events | Summits, Conferences & Meetups | ChiStartup Hub"
        description="The marquee Chicago tech calendar: summits, conferences, demo days, awards, and meetups. Filter by event type. Aggregated from Meetup, Eventbrite, Luma, and curated by ChiStartup Hub."
        keywords="Chicago tech events, Chicago Venture Summit, TechChicago Week, startup conferences Chicago, demo days, networking, workshops"
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Hero */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className={`${isLoaded ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "100ms" }}>
              <span className="bureau-label block mb-6">[EVENTS: CHICAGO_TECH]</span>
            </div>

            <h1
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "200ms" }}
            >
              Chicago Tech Events
            </h1>

            <p
              className={`text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "300ms" }}
            >
              The marquee summits and conferences, plus everything aggregated from Meetup,
              Eventbrite, Luma, and community calendars.
            </p>

            <div className={`flex flex-wrap items-center gap-8 ${isLoaded ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "400ms" }}>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{timelineBase.length}</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">
                  {viewMode === "past" ? "Past Events" : "Upcoming Events"}
                </span>
              </div>
              {marqueeEvents.length > 0 && (
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl text-white">{marqueeEvents.length}</span>
                  <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Marquee</span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{eventHubs.length}+</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Innovation Hubs</span>
              </div>
            </div>
          </div>
        </section>

        {/* Spotlight */}
        {!eventsLoading && marqueeEvents.length > 0 && (
          <section className="px-6 pb-16">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-baseline justify-between mb-6">
                <span className="bureau-label block">[SPOTLIGHT]</span>
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em]">
                  Summits · Conferences · Awards
                </span>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                {marqueeEvents.map((event, index) => (
                  <SpotlightCard key={event.id} event={event} featured={index === 0} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="border border-white/10 p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex-1 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
                <Search className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="SEARCH_EVENTS..."
                  value={searchQuery}
                  onChange={(e) => setParam("q", e.target.value, "")}
                  className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 uppercase tracking-[0.1em]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Chip active={viewMode === "upcoming"} onClick={() => setParam("view", "upcoming", "upcoming")}>Upcoming</Chip>
                <Chip active={viewMode === "past"} onClick={() => setParam("view", "past", "upcoming")}>Past</Chip>
              </div>
            </div>

            {/* Event type */}
            <div className="mt-6">
              <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em] block mb-3">Event Type</span>
              <div className="flex flex-wrap gap-2">
                {TYPE_GROUPS.filter((g) => g.id === "all" || g.id === typeGroupId || typeCounts[g.id] > 0).map((group) => (
                  <Chip
                    key={group.id}
                    active={typeGroupId === group.id}
                    onClick={() => setParam("type", group.id, "all")}
                    count={typeCounts[group.id]}
                  >
                    {group.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Format + price */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {FORMATS.map((f) => (
                <Chip key={f.id} active={format === f.id} onClick={() => setParam("format", f.id, "any")}>
                  {f.label}
                </Chip>
              ))}
              <span className="w-px h-6 bg-white/10 mx-1 hidden md:block" />
              <Chip active={freeOnly} onClick={() => setParam("free", freeOnly ? "" : "1", "")}>Free Only</Chip>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 text-white/40 hover:text-white transition-colors cursor-crosshair ml-auto"
                >
                  Clear ×
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline justify-between mb-8">
              <span className="bureau-label block">[TIMELINE]</span>
              {!eventsLoading && (
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em]">
                  {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
                  {activeGroup.id !== "all" && ` · ${activeGroup.label}`}
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-[116px] top-0 bottom-0 w-px bg-white/10 hidden md:block" />

              {eventsLoading && (
                <div className="border border-white/10 p-16 text-center">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
                  <span className="bureau-label block">[SYNCING_EVENTS]</span>
                  <p className="text-white/40 mt-2">Loading events from aggregated sources...</p>
                </div>
              )}

              {!eventsLoading && isError && (
                <div className="border border-red-500/20 p-16 text-center">
                  <Calendar className="w-12 h-12 text-red-400/40 mx-auto mb-4" strokeWidth={1} />
                  <span className="bureau-label block mb-4">[SYNC_ERROR]</span>
                  <p className="text-white/40">Failed to load events. Please try again later.</p>
                </div>
              )}

              {!eventsLoading && !isError && groupedEvents.map(([date, dateEvents]) => (
                <div key={date} className="mb-8">
                  <DateHeader date={date} />
                  <div className="md:ml-[140px] space-y-4">
                    {dateEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))}

              {!eventsLoading && !isError && filteredEvents.length === 0 && (
                <div className="border border-white/10 p-16 text-center">
                  <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                  <span className="bureau-label block mb-4">[NO_EVENTS_FOUND]</span>
                  <p className="text-white/40 mb-6">
                    {hasActiveFilters
                      ? "No events match these filters."
                      : viewMode === "past"
                        ? "No past events on record yet."
                        : "No upcoming events synced yet. Events are aggregated from Meetup, Eventbrite, and Luma every 4 hours."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Innovation Hubs */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="border-t border-white/10 pt-16">
              <span className="bureau-label block mb-4">[INNOVATION_HUBS]</span>
              <h2 className="font-serif text-3xl text-white mb-4">Event Calendars by Hub</h2>
              <p className="text-white/50 mb-8 max-w-xl">
                Major Chicago innovation hubs maintain their own event calendars. Visit them
                directly for hub-specific programming.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
                {eventHubs.map((hub, index) => (
                  <a
                    key={hub.id || index}
                    href={hub.website || hub.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 hover:bg-white/[0.02] transition-colors group flex items-center justify-between cursor-crosshair"
                  >
                    <div>
                      <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white/80 group-hover:text-white transition-colors mb-1">
                        {hub.name}
                      </h3>
                      <p className="text-white/40 text-sm">{hub.description?.substring(0, 60)}...</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors flex-shrink-0 ml-4" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}
