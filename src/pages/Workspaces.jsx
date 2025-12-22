import React, { useState } from "react";
import { MapPin, Building2, Search, Filter, X, Map as MapIcon, List, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import PageHero from "@/components/ui/page-hero";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Workspaces() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" or "map"

  const { data: workspaces = [], isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => entities.Workspace.list('-created_date'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const categories = [
    { id: "all", label: "All Workspaces" },
    { id: "tech", label: "Tech & Startups" },
    { id: "diverse", label: "Diverse Founders" },
    { id: "corporate", label: "Corporate Teams" },
    { id: "creative", label: "Creative & Design" },
    { id: "food", label: "Food & Beverage" },
    { id: "freelance", label: "Freelancers & Remote" },
    { id: "professional", label: "Professional Services" }
  ];

  const filteredWorkspaces = workspaces.filter(workspace => {
    // Use workspace_type instead of category
    if (activeCategory !== "all") {
      const workspaceType = workspace.workspace_type || '';
      const amenities = workspace.amenities || [];
      const matchesCategory = workspaceType.toLowerCase().includes(activeCategory.toLowerCase()) ||
        amenities.some(a => a?.toLowerCase().includes(activeCategory.toLowerCase()));
      if (!matchesCategory) {
        return false;
      }
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = (workspace.name || '').toLowerCase().includes(searchLower);
      const addressMatch = (workspace.address || '').toLowerCase().includes(searchLower);
      const descriptionMatch = (workspace.description || '').toLowerCase().includes(searchLower);
      const neighborhoodMatch = (workspace.neighborhood || '').toLowerCase().includes(searchLower);
      const amenitiesMatch = (workspace.amenities || []).some(item => item?.toLowerCase().includes(searchLower));

      if (!nameMatch && !addressMatch && !descriptionMatch && !neighborhoodMatch && !amenitiesMatch) {
        return false;
      }
    }

    return true;
  });

  const clearFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
  };

  const activeFilterCount = [
    activeCategory !== "all",
    searchQuery !== ""
  ].filter(Boolean).length;

  // Chicago center coordinates
  const chicagoCenter = [41.8781, -87.6298];

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 text-lg">Error loading workspaces. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Co-Working Spaces in Chicago"
        description="Find the perfect office or desk at Chicago's top co-working spaces and innovation hubs."
        keywords="coworking Chicago, office space, startup hubs, 1871, mHUB, shared office"
      />
      <div className="max-w-7xl mx-auto">
        <PageHero
          label="Workspaces"
          title="Chicago Co-Working Spaces"
          description="Find the right co-working space for your business needs in Chicago"
          stat={workspaces.length}
          statLabel="co-working spaces available"
          backgroundImage="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"
        />

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.08] inline-flex gap-1 backdrop-blur-md">
            <Button
              onClick={() => setViewMode("list")}
              className={`rounded-lg px-4 py-2 text-sm transition-all duration-300 ${
                viewMode === "list" 
                  ? "bg-white/[0.1] text-white shadow-sm" 
                  : "bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              List View
            </Button>
            <Button
              onClick={() => setViewMode("map")}
              className={`rounded-lg px-4 py-2 text-sm transition-all duration-300 ${
                viewMode === "map" 
                  ? "bg-white/[0.1] text-white shadow-sm" 
                  : "bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="sticky top-20 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 mb-8">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Search workspaces by name, location, or amenities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border-white/[0.06] focus:border-white/20 text-white placeholder:text-white/30 h-11 rounded-xl transition-all duration-300"
              />
            </div>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/[0.03] hover:bg-white/[0.08] text-white/90 border border-white/[0.06] hover:border-white/20 h-11 px-5 rounded-xl transition-all duration-300 flex items-center gap-2.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <Badge className="ml-1.5 bg-white/10 text-white hover:bg-white/20 border-none px-1.5 py-0 h-5 text-[10px]">{activeFilterCount}</Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <div>
                <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`text-xs h-8 px-3 rounded-lg transition-all duration-300 ${
                        activeCategory === category.id
                          ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                          : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
                      }`}
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-white/40 text-xs font-medium">Active:</span>
                  {activeCategory !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      {categories.find(c => c.id === activeCategory)?.label}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-white/40 hover:text-white h-6 px-2 text-[10px]"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8">
          <p className="text-white/40 text-sm font-light">
            Showing <span className="text-white/70 font-medium">{filteredWorkspaces.length}</span> workspaces
          </p>
        </div>

        {/* Map View */}
        {viewMode === "map" && filteredWorkspaces.length > 0 && (
          <div className="glass-card p-4 rounded-2xl border border-white/10 mb-8">
            <MapContainer
              center={chicagoCenter}
              zoom={12}
              style={{ height: '600px', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredWorkspaces
                .filter(workspace => workspace.latitude && workspace.longitude)
                .map((workspace, index) => (
                <Marker key={index} position={[workspace.latitude, workspace.longitude]}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-lg mb-2">{workspace.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{workspace.address}</p>
                      <p className="text-sm mb-2">{workspace.description}</p>
                      {workspace.amenities && workspace.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workspace.amenities.slice(0, 2).map((item, i) => (
                            <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <>
            {filteredWorkspaces.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70 text-lg mb-4">No co-working spaces found matching your filters</p>
                <Button onClick={clearFilters} className="glass-button">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkspaces.map((workspace, index) => (
                  <div
                    key={index}
                    className="group relative bg-[#0F0F0F] rounded-xl border border-white/[0.06] overflow-hidden flex flex-col hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60"
                  >
                    {/* Subtle accent top line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="p-6 flex flex-col h-full relative">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors tracking-tight">
                          {workspace.name}
                        </h3>
                        {workspace.featured && (
                          <Badge className="bg-white/10 text-white border-white/10 flex-shrink-0 text-[10px] px-1.5 py-0.5 font-medium">
                            Featured
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-start gap-1.5 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-white/40 mt-0.5 flex-shrink-0 group-hover:text-white/60 transition-colors" />
                        <p className="text-white/50 text-xs leading-snug group-hover:text-white/70 transition-colors">{workspace.address}</p>
                      </div>

                      <p className="text-white/50 text-sm leading-relaxed mb-6 flex-grow font-light group-hover:text-white/60 transition-colors">
                        {workspace.description}
                      </p>

                      <div className="mt-auto border-t border-white/[0.06] pt-4">
                        {workspace.amenities && workspace.amenities.length > 0 && (
                          <>
                            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">Amenities</p>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {workspace.amenities.map((item, i) => (
                                <Badge key={i} className="bg-white/[0.03] text-white/60 border-white/[0.06] text-[10px] font-normal px-1.5 py-0">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}

                        {workspace.website && (
                          <a href={workspace.website} target="_blank" rel="noopener noreferrer" className="block">
                            <Button className="w-full bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.06] hover:border-white/15 text-xs h-9 transition-all duration-300 group/btn">
                              Visit Website
                              <ExternalLink className="w-3 h-3 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}