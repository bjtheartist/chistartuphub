import React, { useState } from "react";
import { Calendar, ExternalLink, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import PageHero from "@/components/ui/page-hero";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: eventHubs, isLoading, error } = useQuery({
    queryKey: ['event-hubs'],
    queryFn: () => entities.EventHub.list('-created_date'),
    initialData: [],
  });

  const filteredHubs = eventHubs.filter(hub => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = hub.name.toLowerCase().includes(searchLower);
      const descriptionMatch = hub.description.toLowerCase().includes(searchLower);
      
      if (!nameMatch && !descriptionMatch) {
        return false;
      }
    }
    return true;
  });

  const featuredHubs = filteredHubs.filter(hub => hub.featured);
  const regularHubs = filteredHubs.filter(hub => !hub.featured);

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Loading hubs and events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 text-lg">Error loading hubs. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Startup Events & Innovation Hubs"
        description="Stay connected with the latest tech events, meetups, and workshops in Chicago's innovation ecosystem."
        keywords="Chicago tech events, startup meetups, networking, workshops, innovation hubs"
      />
      <div className="max-w-7xl mx-auto">
        <PageHero
          label="Discover"
          title="Innovation Hubs & Events"
          description="Connect with Chicago's leading innovation hubs and discover upcoming events, workshops, and networking opportunities"
          stat={filteredHubs.length}
          statLabel={searchQuery ? 'matching innovation hubs' : 'active innovation hubs'}
          backgroundImage="https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&q=80"
        />

        {/* Search */}
            <div className="sticky top-20 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 mb-8 max-w-2xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Search hubs by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border-white/[0.06] focus:border-white/20 text-white placeholder:text-white/30 h-11 rounded-xl transition-all duration-300 text-sm"
              />
            </div>
            </div>

            {/* Featured Hubs */}
        {featuredHubs.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-blue-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Featured Hubs</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredHubs.map((hub, index) => (
                <div
                  key={index}
                  className="group relative bg-[#0F0F0F] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60"
                >
                  {/* Sleek top highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="p-8 flex flex-col h-full relative">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-500" />
                    
                    <div className="relative flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                        <Calendar className="w-5 h-5 text-blue-400" />
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">Featured Hub</Badge>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors">
                      {hub.name}
                    </h3>
                    
                    <p className="text-white/50 text-sm leading-relaxed mb-6 flex-grow font-light">
                      {hub.description}
                    </p>

                    <a href={hub.link} target="_blank" rel="noopener noreferrer" className="mt-auto">
                      <Button className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 group/btn">
                        Visit Event Calendar
                        <ExternalLink className="w-3.5 h-3.5 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Hubs */}
        {regularHubs.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-white/20 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/40">More Innovation Hubs</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {regularHubs.map((hub, index) => (
                <div
                  key={index}
                  className="group relative bg-white/[0.02] rounded-xl border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
                        <Calendar className="w-5 h-5 text-white/70" />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 tracking-tight group-hover:text-white/90 transition-colors">
                      {hub.name}
                    </h3>
                    
                    <p className="text-white/40 text-sm leading-relaxed mb-6 flex-grow font-light group-hover:text-white/50 transition-colors">
                      {hub.description}
                    </p>

                    <a href={hub.link} target="_blank" rel="noopener noreferrer" className="mt-auto">
                      <Button className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 hover:border-white/10 text-sm transition-all duration-300 group/btn h-9">
                        Visit Event Calendar
                        <ExternalLink className="w-3 h-3 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredHubs.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg">
              {searchQuery ? 'No hubs match your search. Try a different term.' : 'No event hubs available yet. Check back soon!'}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery("")} className="glass-button mt-4">
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}