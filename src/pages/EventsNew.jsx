import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Search,
  ArrowUpRight,
  MapPin,
  Video,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { entities, supabase } from "@/api/supabaseClient";
import SEO from "@/components/SEO";
import ShareActions from "@/components/ShareActions";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

// Category configuration
const CATEGORIES = [
  { id: "all", label: "All Events" },
  { id: "ai-ml", label: "AI/ML" },
  { id: "networking", label: "Networking" },
  { id: "workshop", label: "Workshops" },
  { id: "pitch", label: "Pitch Events" },
  { id: "web3", label: "Web3" },
  { id: "conference", label: "Conferences" },
];

// Source badges
const SOURCE_CONFIG = {
  meetup: { label: "Meetup", color: "text-red-400" },
  eventbrite: { label: "Eventbrite", color: "text-orange-400" },
  luma: { label: "Luma", color: "text-purple-400" },
  manual: { label: "ChiStartup", color: "text-blue-400" },
};

// Helper to format date
const formatEventDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return { day: "Today", weekday: date.toLocaleDateString('en-US', { weekday: 'long' }) };
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return { day: "Tomorrow", weekday: date.toLocaleDateString('en-US', { weekday: 'long' }) };
  }
  return {
    day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
  };
};

// Helper to format time
const formatTime = (timeStr) => {
  return new Date(timeStr).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Group events by date
const groupEventsByDate = (events) => {
  const groups = {};
  events.forEach(event => {
    const date = event.event_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
};

// Event Card Component
function EventCard({ event, index }) {
  const sourceConfig = SOURCE_CONFIG[event.source] || SOURCE_CONFIG.manual;
  
  return (
    <div className="group relative bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300">
      {/* Live Badge */}
      {event.status === 'live' && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-400">Live</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row">
        {/* Event Image */}
        {event.image_url && (
          <div className="md:w-48 h-32 md:h-auto relative overflow-hidden flex-shrink-0">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050A14]/80" />
          </div>
        )}
        
        {/* Event Content */}
        <div className="flex-1 p-6">
          {/* Time and Source */}
          <div className="flex items-center gap-4 mb-3">
            <span className="font-mono text-sm text-white/60">
              {formatTime(event.start_time)}
              {event.end_time && (
                <span className="text-white/30"> — {formatTime(event.end_time)}</span>
              )}
            </span>
            <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${sourceConfig.color}`}>
              {sourceConfig.label}
            </span>
          </div>
          
          {/* Title */}
          <h3 className="font-serif text-xl text-white mb-2 group-hover:text-white transition-colors">
            {event.title}
          </h3>
          
          {/* Organizer */}
          <p className="text-white/40 text-sm mb-3">
            By {event.organizer_name}
          </p>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            {event.is_virtual ? (
              <>
                <Video className="w-4 h-4" strokeWidth={1.5} />
                <span>Virtual Event</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
                <span>{event.venue_name}{event.venue_address && `, ${event.venue_address}`}</span>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Category Badge */}
            {event.category && (
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 border border-white/10 px-2 py-1">
                {event.category.replace('-', '/')}
              </span>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`RSVP for ${event.title}`}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-2 cursor-crosshair"
              >
                <span>RSVP</span>
                <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
              </a>
              <ShareActions
                resourceType="event"
                resourceId={event.id}
                resourceName={event.title}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline Date Header
function DateHeader({ date }) {
  const { day, weekday } = formatEventDate(date);
  const isToday = day === "Today";
  
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="text-right min-w-[100px]">
        <div className={`font-mono text-lg ${isToday ? 'text-white' : 'text-white/70'}`}>
          {day}
        </div>
        <div className="font-mono text-xs text-white/40 uppercase tracking-[0.1em]">
          {weekday}
        </div>
      </div>
      <div className="relative flex items-center">
        <div className={`w-3 h-3 border-2 ${isToday ? 'border-white bg-white/20' : 'border-white/30 bg-transparent'}`} />
      </div>
    </div>
  );
}

export default function EventsNew() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("upcoming"); // upcoming | past
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch innovation hubs (existing events table)
  const { data: eventHubs = [] } = useQuery({
    queryKey: ['event-hubs'],
    queryFn: () => entities.EventHub.list('-created_date'),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch aggregated events from database
  const { data: aggregatedEvents = [], isLoading: eventsLoading, isError, error } = useQuery({
    queryKey: ['aggregated-events', viewMode, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('aggregated_events')
        .select('id, source, source_url, title, description, event_date, start_time, end_time, timezone, is_virtual, venue_name, venue_address, city, virtual_url, organizer_name, category, image_url, registration_url, is_free, price_info, status')
        .eq('is_duplicate', false)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(100);
      
      // Filter by status
      if (viewMode === 'past') {
        query = query.eq('status', 'past');
      } else {
        query = query.in('status', ['upcoming', 'live']);
      }
      
      // Filter by category
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter events (category is already filtered server-side via the query)
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return aggregatedEvents;
    const searchLower = searchQuery.toLowerCase();
    return aggregatedEvents.filter(event => {
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const descMatch = event.description?.toLowerCase().includes(searchLower);
      const orgMatch = event.organizer_name?.toLowerCase().includes(searchLower);
      return titleMatch || descMatch || orgMatch;
    });
  }, [aggregatedEvents, searchQuery]);

  // Group by date
  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  return (
    <div className="min-h-screen relative" data-page="events">
      <SEO
        title="Chicago Tech Events | ChiStartup Hub"
        description="Discover tech events, meetups, workshops, and conferences happening in Chicago. Aggregated from Meetup, Eventbrite, Luma, and more."
        keywords="Chicago tech events, startup meetups, networking, workshops, conferences, AI events, Web3 events"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[EVENTS: CHICAGO_TECH]</span>
            </div>
            
            <h1 
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Chicago Tech Events
            </h1>

            <p 
              className={`text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Aggregated from Meetup, Eventbrite, Luma, and community calendars. 
              Never miss a networking opportunity.
            </p>

            {/* Stats */}
            <div 
              className={`flex items-center gap-8 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{aggregatedEvents.length}</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">
                  {viewMode === 'past' ? 'Past Events' : 'Upcoming Events'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{eventHubs.length}+</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Innovation Hubs</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="border border-white/10 p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">
              {/* Search */}
              <div className="flex-1 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
                <Search className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="SEARCH_EVENTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 uppercase tracking-[0.1em]"
                />
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("upcoming")}
                  className={`font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border transition-colors cursor-crosshair ${
                    viewMode === "upcoming" 
                      ? "bg-white text-black border-white" 
                      : "border-white/20 text-white/60 hover:border-white/40"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setViewMode("past")}
                  className={`font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border transition-colors cursor-crosshair ${
                    viewMode === "past" 
                      ? "bg-white text-black border-white" 
                      : "border-white/20 text-white/60 hover:border-white/40"
                  }`}
                >
                  Past
                </button>
              </div>
            </div>
            
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border transition-colors cursor-crosshair ${
                    selectedCategory === cat.id
                      ? "bg-white text-black border-white"
                      : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Events Timeline */}
        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <span className="bureau-label block mb-8">[TIMELINE]</span>
            
            {/* Timeline */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[116px] top-0 bottom-0 w-px bg-white/10 hidden md:block" />

              {/* Loading State */}
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
                  <p className="text-white/40 mb-6">
                    Failed to load events. Please try again later.
                  </p>
                </div>
              )}

              {!eventsLoading && groupedEvents.map(([date, dateEvents]) => (
                <div key={date} className="mb-8">
                  {/* Date Header */}
                  <DateHeader date={date} />

                  {/* Events for this date */}
                  <div className="md:ml-[140px] space-y-4">
                    {dateEvents.map((event, eventIndex) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        index={eventIndex}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {!eventsLoading && filteredEvents.length === 0 && (
                <div className="border border-white/10 p-16 text-center">
                  <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                  <span className="bureau-label block mb-4">[NO_EVENTS_FOUND]</span>
                  <p className="text-white/40 mb-6">
                    {searchQuery
                      ? 'No events match your search.'
                      : selectedCategory !== 'all'
                        ? 'No upcoming events in this category.'
                        : 'No events synced yet. Events are aggregated from Meetup, Eventbrite, and Luma every 4 hours.'}
                  </p>
                  {(searchQuery || selectedCategory !== "all") && (
                    <button
                      onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
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

        {/* Innovation Hubs Section */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="border-t border-white/10 pt-16">
              <span className="bureau-label block mb-4">[INNOVATION_HUBS]</span>
              <h2 className="font-serif text-3xl text-white mb-4">
                Event Calendars by Hub
              </h2>
              <p className="text-white/50 mb-8 max-w-xl">
                Major Chicago innovation hubs maintain their own event calendars. 
                Visit them directly for hub-specific programming.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
                {eventHubs.slice(0, 6).map((hub, index) => (
                  <a
                    key={hub.id || index}
                    href={hub.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 hover:bg-white/[0.02] transition-colors group flex items-center justify-between cursor-crosshair"
                  >
                    <div>
                      <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white/80 group-hover:text-white transition-colors mb-1">
                        {hub.name}
                      </h3>
                      <p className="text-white/40 text-sm">
                        {hub.description?.substring(0, 60)}...
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors flex-shrink-0 ml-4" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
              
              {eventHubs.length > 6 && (
                <div className="mt-4 text-center">
                  <a href="/events-hubs" className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors">
                    View all {eventHubs.length} hubs →
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
