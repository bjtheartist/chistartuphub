import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, Award, Filter, X, Sparkles, Shield, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import StoryCard from "../components/stories/StoryCard";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "@/components/SEO";
import PageHero from "@/components/ui/page-hero";
import { generateSlug } from "@/lib/utils";

export default function Stories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [moatFilter, setMoatFilter] = useState("all");
  const [unicornFilter, setUnicornFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 12;

  const { data: stories, isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: () => entities.Story.list('-created_date'),
    initialData: [],
  });

  const sectors = useMemo(() => [
    { id: "all", label: "All" },
    { id: "Consumer Tech", label: "Consumer" },
    { id: "FinTech", label: "FinTech" },
    { id: "SaaS", label: "SaaS" },
    { id: "HealthTech", label: "Health" },
    { id: "Logistics Tech", label: "Logistics" },
    { id: "B2B SaaS", label: "B2B" },
    { id: "FoodTech", label: "Food" },
    { id: "E-commerce", label: "Ecommerce" },
    { id: "AI & IoT", label: "AI/IoT" },
    { id: "LegalTech", label: "Legal" },
    { id: "InsurTech", label: "Insurance" },
    { id: "Creator Economy", label: "Creator" },
    { id: "HR Tech", label: "HR" },
    { id: "AI/ML", label: "AI/ML" },
    { id: "Hospitality Tech", label: "Hospitality" },
    { id: "Marketplace", label: "Marketplace" }
  ], []);

  const moats = useMemo(() => [
    { id: "all", label: "All" },
    { id: "Scale Economies", label: "Scale" },
    { id: "Network Effects", label: "Network" },
    { id: "Switching Costs", label: "Switching" },
    { id: "Branding", label: "Brand" },
    { id: "Counter-Positioning", label: "Counter-Pos" },
    { id: "Cornered Resource", label: "Resource" },
    { id: "Process Power", label: "Process" }
  ], []);

  // Helper to get founder name(s) from founders array or founder_name
  const getFounderName = (story) => {
    // New Supabase schema uses 'founders' array
    if (story.founders && Array.isArray(story.founders)) {
      return story.founders.join(', ');
    }
    // Old Base44 schema used 'founder_name' string
    if (story.founder_name) return story.founder_name;
    return 'Unknown Founder';
  };

  // Helper to get journey summary/description
  const getJourneySummary = (story) => {
    // New Supabase schema uses 'description'
    // Old Base44 schema used 'journey_summary'
    return story.description || story.journey_summary || story.tagline || '';
  };

  // Helper to get category/sector
  const getCategory = (story) => {
    // New Supabase schema uses 'sector'
    // Old Base44 schema used 'category'
    return story.sector || story.category || 'Technology';
  };

  // Helper to get exit value/valuation
  const getExitValue = (story) => {
    // New Supabase schema uses 'funding_raised' or 'valuation'
    return story.funding_raised || story.valuation || story.exit_value || '';
  };

  // Helper to get founded year
  const getFounded = (story) => {
    // New Supabase schema uses 'founded_year'
    // Old Base44 schema used 'founded'
    return story.founded_year || story.founded || '';
  };

  // Helper to get primary power/moat
  const getPrimaryPower = (story) => {
    // New Supabase schema uses 'competitive_moat'
    // Old Base44 schema used 'primary_power'
    return story.competitive_moat || story.primary_power || '';
  };

  // Helper function to check if a company is a unicorn
  const isUnicorn = (story) => {
    if (story.is_unicorn) return true;

    const valuation = (story.valuation || story.exit_value || '').toLowerCase();

    return valuation.includes("unicorn") ||
           valuation.includes("$1b") ||
           valuation.includes("$2b") ||
           valuation.includes("$3b") ||
           valuation.includes("$4b") ||
           valuation.includes("$5b") ||
           valuation.includes("$6b") ||
           valuation.includes("billion");
  };

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const category = getCategory(story);
      if (sectorFilter !== "all" && category !== sectorFilter) {
        return false;
      }

      if (moatFilter !== "all") {
        const primaryPower = getPrimaryPower(story).toLowerCase();
        const secondaryPower = (story.secondary_power || story.moat_description || '').toLowerCase();
        const moatLower = moatFilter.toLowerCase();

        if (!primaryPower.includes(moatLower) && !secondaryPower.includes(moatLower)) {
          return false;
        }
      }

      if (unicornFilter && !isUnicorn(story)) {
        return false;
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const companyMatch = (story.company_name || '').toLowerCase().includes(searchLower);
        const founderMatch = getFounderName(story).toLowerCase().includes(searchLower);
        const categoryMatch = category.toLowerCase().includes(searchLower);
        const summaryMatch = getJourneySummary(story).toLowerCase().includes(searchLower);

        if (!companyMatch && !founderMatch && !categoryMatch && !summaryMatch) {
          return false;
        }
      }

      return true;
    });
  }, [stories, sectorFilter, moatFilter, unicornFilter, searchQuery]);

  // Paginate filtered stories
  const paginatedStories = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredStories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStories, page]);

  const totalPages = Math.ceil(filteredStories.length / ITEMS_PER_PAGE);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, sectorFilter, moatFilter, unicornFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setSectorFilter("all");
    setMoatFilter("all");
    setUnicornFilter(false);
  };

  const activeFilterCount = useMemo(() => {
    return [
      searchQuery !== "",
      sectorFilter !== "all",
      moatFilter !== "all",
      unicornFilter
    ].filter(Boolean).length;
  }, [searchQuery, sectorFilter, moatFilter, unicornFilter]);

  const featuredStory = useMemo(() => {
    const featured = filteredStories.filter(s => s.featured);
    return featured.length > 0 ? featured[0] : null;
  }, [filteredStories]);

  const getHeadlineSummary = (story) => {
    const fullSummary = getJourneySummary(story);
    if (!fullSummary) return "No summary available";
    const firstSentence = fullSummary.split('→')[0].trim();
    return firstSentence.length > 150 ? firstSentence.substring(0, 150) + '...' : firstSentence;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Loading stories...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-white/70 text-lg">Error loading stories. Please try again later.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Chicago Blueprints: Startup Success Stories"
        description="How Groupon, ShipBob, and Cameo built billion-dollar companies. Deconstructed playbooks showing their competitive moats and paths to success."
        keywords="Chicago startups, founder playbooks, success blueprints, competitive moats, how they did it, startup strategy"
      />
      <div className="max-w-7xl mx-auto">
        <PageHero
          label="Learn from the Best"
          title="Chicago Blueprints"
          description="How Groupon, ShipBob, and Cameo actually did it. Deconstructed."
          stat={stories.length}
          statLabel="success stories"
          backgroundImage="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80"
        />

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="sticky top-24 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 mb-8 md:mb-12"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Search companies, founders, moats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border-white/[0.06] focus:border-white/20 text-white placeholder:text-white/30 h-11 rounded-xl transition-all duration-300"
              />
            </div>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/[0.03] hover:bg-white/[0.08] text-white/90 border border-white/[0.06] hover:border-white/20 h-11 px-5 rounded-xl transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <Badge className="ml-1.5 bg-white/10 text-white hover:bg-white/20 border-none px-1.5 py-0 h-5 text-[10px]">{activeFilterCount}</Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Sector</label>
                <div className="flex flex-wrap gap-1.5">
                  {sectors.map((sector) => (
                    <Button
                      key={sector.id}
                      onClick={() => setSectorFilter(sector.id)}
                      className={`text-xs px-2 py-1 h-auto ${
                        sectorFilter === sector.id
                          ? 'glass-button'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {sector.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Competitive Moat
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {moats.map((moat) => (
                    <Button
                      key={moat.id}
                      onClick={() => setMoatFilter(moat.id)}
                      className={`text-xs px-2 py-1 h-auto ${
                        moatFilter === moat.id
                          ? 'glass-button'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {moat.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Special Filters</label>
                <Button
                  onClick={() => setUnicornFilter(!unicornFilter)}
                  className={`text-xs px-2 py-1 h-auto flex items-center gap-2 ${
                    unicornFilter
                      ? 'glass-button'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Unicorns ($1B+)
                </Button>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-white/70 text-xs">Active filters:</span>
                  {searchQuery && (
                    <Badge className="bg-white/10 text-white border-white/20 text-xs">
                      Search: "{searchQuery.slice(0, 15)}..."
                    </Badge>
                  )}
                  {sectorFilter !== "all" && (
                    <Badge className="bg-white/10 text-white border-white/20 text-xs">
                      {sectors.find(s => s.id === sectorFilter)?.label}
                    </Badge>
                  )}
                  {moatFilter !== "all" && (
                    <Badge className="bg-white/10 text-white border-white/20 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {moats.find(m => m.id === moatFilter)?.label}
                    </Badge>
                  )}
                  {unicornFilter && (
                    <Badge className="bg-white/10 text-white border-white/20 text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Unicorns
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-white/70 hover:text-white text-xs h-auto py-1"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <div className="mb-4 md:mb-8 flex items-center justify-between">
          <p className="text-white/70 text-sm md:text-base">
            Showing <span className="font-bold text-white">{paginatedStories.length}</span> of {filteredStories.length} stories
            {filteredStories.length !== stories.length && ` (${stories.length} total)`}
          </p>
          {totalPages > 1 && (
            <p className="text-white/60 text-sm">
              Page {page + 1} of {totalPages}
            </p>
          )}
        </div>

        {/* Featured Story - Simplified for Mobile */}
        <AnimatePresence mode="wait">
          {featuredStory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="glass-card p-6 md:p-12 rounded-3xl border border-white/10 mb-8 md:mb-16 overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="accent-badge text-xs">
                      Featured Story
                    </Badge>
                    {isUnicorn(featuredStory) && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Unicorn
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{featuredStory.company_name}</h2>
                  <p className="text-lg md:text-xl text-white/80 mb-2">{getFounderName(featuredStory)}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <Badge className="bg-white/10 text-white border-white/20 text-xs">{getCategory(featuredStory)}</Badge>
                    {getFounded(featuredStory) && <Badge className="bg-white/10 text-white border-white/20 text-xs">Founded {getFounded(featuredStory)}</Badge>}
                    {getExitValue(featuredStory) && <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">{getExitValue(featuredStory)}</Badge>}
                  </div>

                  <p className="text-white/70 text-base md:text-lg leading-relaxed mb-4 md:mb-6">{getHeadlineSummary(featuredStory)}</p>

                  {getPrimaryPower(featuredStory) && (
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                      <Award className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                      <span className="text-white/80 text-sm md:text-base">Primary Moat: <strong className="text-white">{getPrimaryPower(featuredStory)}</strong></span>
                    </div>
                  )}
                  
                  <Link to={`/stories/${generateSlug(featuredStory.company_name)}`}>
                    <Button className="accent-button text-base md:text-lg w-full md:w-auto">
                      Read Full Story
                      <BookOpen className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
                
                <div className="order-first md:order-last">
                  <StoryCard story={featuredStory} size="large" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Stories Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-6 md:mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">All Stories</h2>
          <p className="text-white/70 text-sm md:text-base">Explore inspiring journeys and competitive moats from Chicago's startup ecosystem</p>
        </motion.div>

        {filteredStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg mb-4">No stories match your current filters</p>
            <Button onClick={clearFilters} className="glass-button">
              Clear all filters
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedStories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: Math.min(index * 0.05, 0.3)
                    }}
                    className="group relative bg-[#0F0F0F] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60"
                  >
                    <div className="overflow-hidden relative">
                      <StoryCard story={story} size="default" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent opacity-90" />
                    </div>

                    <div className="p-6 flex flex-col flex-grow relative -mt-6">
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors duration-300 tracking-tight">
                            {story.company_name}
                          </h3>
                          {isUnicorn(story) && (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex-shrink-0 text-[10px] px-1.5 py-0.5">
                              <Sparkles className="w-2.5 h-2.5 mr-1" />
                              <span className="hidden sm:inline">Unicorn</span>
                            </Badge>
                          )}
                        </div>
                        <p className="text-white/40 text-xs font-medium mb-4 uppercase tracking-wider">{getFounderName(story)}</p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <Badge className="bg-white/[0.04] text-white/60 border-white/[0.06] text-[10px] font-medium px-2 py-0.5">{getCategory(story)}</Badge>
                          {getFounded(story) && <Badge className="bg-white/[0.04] text-white/60 border-white/[0.06] text-[10px] font-medium px-2 py-0.5">{getFounded(story)}</Badge>}
                          {getExitValue(story) && <Badge className="bg-emerald-900/20 text-emerald-400/80 border-emerald-500/20 text-[10px] font-medium px-2 py-0.5">{getExitValue(story)}</Badge>}
                        </div>

                        <p className="text-white/50 leading-relaxed mb-5 flex-grow text-sm font-light line-clamp-3">
                          {getHeadlineSummary(story)}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.04]">
                          {getPrimaryPower(story) && (
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-3 h-3 text-blue-500/60" />
                              <span className="text-white/40 text-xs font-medium">{getPrimaryPower(story)}</span>
                            </div>
                          )}
                          <Link to={`/stories/${generateSlug(story.company_name)}`}>
                            <div className="flex items-center gap-1 text-white/40 hover:text-white text-xs font-medium transition-colors group/link">
                              Read Story
                              <ChevronRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-4 mt-12"
              >
                <Button
                  onClick={() => setPage(p => p - 1)}
                  disabled={!hasPrevPage}
                  className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 ${
                          page === pageNum 
                            ? 'accent-button' 
                            : 'glass-button'
                        }`}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasNextPage}
                  className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}