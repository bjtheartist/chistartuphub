import { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  Search, 
  ArrowUpRight, 
  MapPin, 
  Users, 
  Clock,
  Video,
  ExternalLink,
  Filter,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { entities, supabase } from "@/api/supabaseClient";
import SEO from "@/components/SEO";
import ShareActions from "@/components/ShareActions";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

// Mock data for fallback when database is empty
const MOCK_EVENTS = [
  {
    id: "1",
    title: "Chicago AI & ML Meetup",
    description: "Monthly gathering of AI/ML practitioners. This month: Building RAG applications with LangChain.",
    event_date: "2026-01-28",
    start_time: "2026-01-28T18:00:00",
    end_time: "2026-01-28T21:00:00",
    venue_name: "1871",
    venue_address: "111 N Canal St, Chicago",
    is_virtual: false,
    organizer_name: "Chicago AI Meetup",
    rsvp_count: 127,
    category: "ai-ml",
    source: "meetup",
    registration_url: "https://meetup.com/chicago-ai",
    image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
    is_live: true,
  },
  {
    id: "2",
    title: "Founder Office Hours with Hyde Park Angels",
    description: "Get feedback on your pitch deck from experienced angel investors.",
    event_date: "2026-01-29",
    start_time: "2026-01-29T14:00:00",
    end_time: "2026-01-29T16:00:00",
    venue_name: "Polsky Center",
    venue_address: "1452 E 53rd St, Chicago",
    is_virtual: false,
    organizer_name: "Hyde Park Angels",
    rsvp_count: 24,
    category: "networking",
    source: "eventbrite",
    registration_url: "https://eventbrite.com/e/123",
    image_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop",
  },
  {
    id: "3",
    title: "Web3 Chicago: DeFi Deep Dive",
    description: "Understanding decentralized finance protocols and their applications.",
    event_date: "2026-01-29",
    start_time: "2026-01-29T18:30:00",
    end_time: "2026-01-29T20:30:00",
    venue_name: "Online",
    is_virtual: true,
    virtual_url: "https://zoom.us/j/123",
    organizer_name: "Web3 Chicago",
    rsvp_count: 89,
    category: "web3",
    source: "luma",
    registration_url: "https://lu.ma/web3chicago",
    image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop",
  },
  {
    id: "4",
    title: "HealthTech Demo Day",
    description: "MATTER's quarterly startup demo day featuring healthcare innovations from 8 startups.",
    event_date: "2026-01-30",
    start_time: "2026-01-30T17:00:00",
    end_time: "2026-01-30T20:00:00",
    venue_name: "MATTER",
    venue_address: "222 W Merchandise Mart Plaza",
    is_virtual: false,
    organizer_name: "MATTER",
    rsvp_count: 156,
    category: "pitch",
    source: "eventbrite",
    registration_url: "https://matter.health/events",
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop",
  },
  {
    id: "5",
    title: "React Chicago: Server Components Workshop",
    description: "Hands-on workshop building with React Server Components and Next.js 15.",
    event_date: "2026-02-01",
    start_time: "2026-02-01T10:00:00",
    end_time: "2026-02-01T14:00:00",
    venue_name: "Thoughtworks",
    venue_address: "200 E Randolph St",
    is_virtual: false,
    organizer_name: "React Chicago",
    rsvp_count: 45,
    category: "workshop",
    source: "meetup",
    registration_url: "https://meetup.com/react-chicago",
    image_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop",
  },
  {
    id: "6",
    title: "Chicago Startup Week Kickoff",
    description: "Opening ceremony and networking for Chicago's biggest startup celebration.",
    event_date: "2026-02-03",
    start_time: "2026-02-03T18:00:00",
    end_time: "2026-02-03T21:00:00",
    venue_name: "Navy Pier",
    venue_address: "600 E Grand Ave",
    is_virtual: false,
    organizer_name: "Chicago Startup Week",
    rsvp_count: 500,
    category: "conference",
    source: "eventbrite",
    registration_url: "https://chicagostartupweek.com",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop",
  },
];

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
      {event.is_live && (
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
              >
                <button className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-2 cursor-crosshair">
                  <span>RSVP</span>
                  <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                </button>
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
  const { data: aggregatedEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['aggregated-events', viewMode, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('aggregated_events')
        .select('*')
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

  // Use aggregated events if available, otherwise fall back to mock data
  const events = aggregatedEvents.length > 0 ? aggregatedEvents : MOCK_EVENTS;

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = event.title?.toLowerCase().includes(searchLower);
        const descMatch = event.description?.toLowerCase().includes(searchLower);
        const orgMatch = event.organizer_name?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch && !orgMatch) return false;
      }
      
      // Category filter
      if (selectedCategory !== "all" && event.category !== selectedCategory) {
        return false;
      }
      
      return true;
    });
  }, [events, searchQuery, selectedCategory]);

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
                <span className="font-mono text-2xl text-white">{events.length}</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Upcoming Events</span>
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
                  className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 focus:outline-none uppercase tracking-[0.1em]"
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
              
              {groupedEvents.map(([date, dateEvents], groupIndex) => (
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
              {filteredEvents.length === 0 && (
                <div className="border border-white/10 p-16 text-center">
                  <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                  <span className="bureau-label block mb-4">[NO_EVENTS_FOUND]</span>
                  <p className="text-white/40 mb-6">
                    {searchQuery ? 'No events match your search.' : 'No upcoming events in this category.'}
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
