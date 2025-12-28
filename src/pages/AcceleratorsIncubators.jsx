import React, { useState } from "react";
import { Rocket, ExternalLink, Search, Filter, X, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";

export default function AcceleratorsIncubators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: ['accelerators'],
    queryFn: () => entities.Accelerator.list('-created_date'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filterCategories = [
    "all",
    "Tech",
    "Healthcare",
    "Food & Beverage",
    "Manufacturing",
    "Real Estate",
    "Creative Industries",
    "University-Based",
    "Energy & CleanTech"
  ];

  const filteredPrograms = programs.filter(program => {
    // Category filter
    if (activeFilter !== "all" && !program.category.includes(activeFilter)) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = program.name.toLowerCase().includes(searchLower);
      const descriptionMatch = program.description.toLowerCase().includes(searchLower);
      const categoryMatch = program.category.some(cat => cat.toLowerCase().includes(searchLower));
      
      if (!nameMatch && !descriptionMatch && !categoryMatch) {
        return false;
      }
    }

    return true;
  });

  const clearFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
  };

  const activeFilterCount = [
    activeFilter !== "all",
    searchQuery !== ""
  ].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 text-lg">Error loading programs. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Accelerators & Incubators
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-4">
            Connect with Chicago's leading accelerator and incubator programs
          </p>
          <p className="text-white/60">
            <span className="font-bold text-white">{programs.length}</span> programs available
          </p>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="text"
                placeholder="Search programs by name, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
            </div>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="glass-button flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter by Category
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-white/20 text-white">{activeFilterCount}</Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <label className="text-white text-sm font-medium mb-3 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {filterCategories.map((category) => (
                    <Button
                      key={category}
                      onClick={() => setActiveFilter(category)}
                      className={`text-sm ${
                        activeFilter === category
                          ? 'glass-button'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {category === "all" ? "All Categories" : category}
                    </Button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-white/70 text-sm">Active filters:</span>
                  {activeFilter !== "all" && (
                    <Badge className="bg-white/10 text-white border-white/20">
                      {activeFilter}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge className="bg-white/10 text-white border-white/20">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-white/70 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-white/70">
            Showing <span className="font-bold text-white">{filteredPrograms.length}</span> programs
          </p>
        </div>

        {/* Programs Grid */}
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg mb-4">No programs found matching your filters</p>
            <Button onClick={clearFilters} className="glass-button">
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl border border-white/10 hover:scale-105 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-white" />
                    <h3 className="text-xl font-bold text-white">{program.name}</h3>
                  </div>
                  {program.featured && (
                    <Badge className="bg-gradient-to-r from-gray-200 to-gray-400 text-black border-0">
                      Featured
                    </Badge>
                  )}
                </div>

                {program.founded && (
                  <p className="text-white/60 text-sm mb-3">Founded: {program.founded}</p>
                )}

                <p className="text-white/70 mb-4 leading-relaxed flex-grow">
                  {program.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {program.category.map((cat, i) => (
                    <Badge key={i} className="bg-white/5 text-white/80 border-white/10 text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>

                <a href={program.link} target="_blank" rel="noopener noreferrer">
                  <Button className="glass-button w-full text-sm">
                    Learn More
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}