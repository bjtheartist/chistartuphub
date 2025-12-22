import { useState, useMemo, useEffect } from "react";
import { DollarSign, ExternalLink, Calendar, TrendingUp, Rocket, Award, Search, Filter, X, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 12;

export default function FundingOpportunitiesContent({ opportunities = [], upcomingOpportunities = [] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [focusFilter, setFocusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const quickTabs = [
    { id: "all", label: "All", icon: null },
    { id: "hot", label: "Hot Deadlines", icon: Flame, color: "text-orange-400" },
    { id: "Grant", label: "Grants", icon: DollarSign, color: "text-green-400" },
    { id: "Accelerator", label: "Accelerators", icon: Rocket, color: "text-orange-400" },
    { id: "Competition", label: "Competitions", icon: Award, color: "text-yellow-400" },
    { id: "VC", label: "Venture Capital", icon: TrendingUp, color: "text-blue-400" },
  ];

  const focusAreas = [
    "all", "AI", "B2B", "CleanTech", "Consumer", "EdTech", "FinTech",
    "FoodTech", "Healthcare", "HealthTech", "SaaS", "Social Impact", "Technology"
  ];

  const stages = [
    { value: "all", label: "All Stages" },
    { value: "Pre-Seed", label: "Pre-Seed" },
    { value: "Seed", label: "Seed" },
    { value: "Early Stage", label: "Early Stage" },
    { value: "Growth", label: "Growth" },
    { value: "Series A+", label: "Series A+" }
  ];

  const regions = [
    { value: "all", label: "All Regions" },
    { value: "chicago", label: "Chicago/Illinois" },
    { value: "us-national", label: "US National" },
    { value: "europe", label: "Europe" },
    { value: "asia", label: "Asia Pacific" },
    { value: "africa", label: "Africa" }
  ];

  // Helper functions with null safety
  const getOpportunityUrl = (opp) => opp?.website || opp?.link || '';
  const getOpportunityDescription = (opp) => opp?.description || opp?.note || opp?.subtitle || '';
  const getOpportunitySectors = (opp) => opp?.sectors || opp?.focus_areas || [];

  const getOpportunityType = (opp) => {
    if (!opp) return 'VC';
    const type = (opp.opportunity_type || '').toLowerCase();
    if (type === 'grant') return 'Grant';
    if (type === 'accelerator' || type === 'accelerator_application') return 'Accelerator';
    if (type === 'competition' || type === 'pitch_competition') return 'Competition';
    if (type === 'vc') return 'VC';
    if (type === 'standard' || type === 'underrepresented') return 'VC';
    const stageArr = Array.isArray(opp.stage) ? opp.stage : [opp.stage];
    if (stageArr.some(s => s?.toLowerCase() === 'accelerator')) return 'Accelerator';
    if (stageArr.some(s => s?.toLowerCase() === 'competition')) return 'Competition';
    return 'VC';
  };

  const getRegion = (opp) => {
    if (!opp) return 'us-national';
    const name = (opp.name || '').toLowerCase();
    const org = (opp.organization || '').toLowerCase();
    const desc = getOpportunityDescription(opp).toLowerCase();
    const location = (opp.location || '').toLowerCase();
    const combined = `${name} ${org} ${desc} ${location}`;

    if (combined.includes('chicago') || combined.includes('illinois') || combined.includes('midwest')) return 'chicago';
    if (combined.includes('europe') || combined.includes('eic') || combined.includes(' eu ') || combined.includes(' uk ')) return 'europe';
    if (combined.includes('africa') || combined.includes('nigeria') || combined.includes('kenya')) return 'africa';
    if (combined.includes('asia') || combined.includes('singapore') || combined.includes('korea')) return 'asia';
    return 'us-national';
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineStatus = (opp) => {
    if (!opp) return 'rolling';
    const days = getDaysUntilDeadline(opp.deadline);
    if (days === null) return 'rolling';
    if (days < 0) return 'closed';
    if (days <= 30) return 'closing-soon';
    return 'open';
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      if (!item) return false;
      const status = getDeadlineStatus(item);
      if (status === 'closed') return false;

      // Quick tab filter
      if (activeTab === "hot") {
        const days = getDaysUntilDeadline(item.deadline);
        if (days === null || days < 0 || days > 30) return false;
      } else if (activeTab !== "all") {
        const type = getOpportunityType(item);
        if (type !== activeTab) return false;
      }

      // Focus area filter
      if (focusFilter !== "all") {
        const sectors = getOpportunitySectors(item);
        if (!sectors.some((f) => f.toLowerCase() === focusFilter.toLowerCase() || f === "All sectors" || f === "All")) {
          return false;
        }
      }

      // Stage filter
      if (stageFilter !== "all") {
        const stageArr = Array.isArray(item.stage) ? item.stage : [item.stage];
        if (!stageArr.some(s => s?.toLowerCase().includes(stageFilter.toLowerCase()))) {
          return false;
        }
      }

      // Region filter
      if (regionFilter !== "all") {
        const region = getRegion(item);
        if (region !== regionFilter) return false;
      }

      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(searchLower);
        const descMatch = getOpportunityDescription(item).toLowerCase().includes(searchLower);
        const orgMatch = item.organization?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch && !orgMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by featured first, then by deadline (closest first)
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const daysA = getDaysUntilDeadline(a.deadline);
      const daysB = getDaysUntilDeadline(b.deadline);
      if (daysA !== null && daysB !== null) return daysA - daysB;
      if (daysA !== null) return -1;
      if (daysB !== null) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [opportunities, activeTab, focusFilter, stageFilter, regionFilter, searchQuery]);

  // Pagination
  const paginatedOpportunities = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredOpportunities.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOpportunities, page]);

  const totalPages = Math.ceil(filteredOpportunities.length / ITEMS_PER_PAGE);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeTab, focusFilter, stageFilter, regionFilter, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { all: 0, hot: 0, Grant: 0, Accelerator: 0, Competition: 0, VC: 0 };
    opportunities.filter(Boolean).forEach((item) => {
      const status = getDeadlineStatus(item);
      if (status === 'closed') return;

      counts.all++;
      const type = getOpportunityType(item);
      if (counts[type] !== undefined) counts[type]++;

      const days = getDaysUntilDeadline(item.deadline);
      if (days !== null && days >= 0 && days <= 30) counts.hot++;
    });
    return counts;
  }, [opportunities]);

  const clearFilters = () => {
    setFocusFilter("all");
    setStageFilter("all");
    setRegionFilter("all");
    setSearchQuery("");
  };

  const activeFilterCount = useMemo(() => [
    focusFilter !== "all",
    stageFilter !== "all",
    regionFilter !== "all",
    searchQuery !== ""
  ].filter(Boolean).length, [focusFilter, stageFilter, regionFilter, searchQuery]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Grant': return <DollarSign className="w-4 h-4 text-green-400" />;
      case 'Competition': return <Award className="w-4 h-4 text-yellow-400" />;
      case 'Accelerator': return <Rocket className="w-4 h-4 text-orange-400" />;
      default: return <TrendingUp className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div>
      {/* Quick Filter Tabs */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-2">
          {quickTabs.map((tab) => {
            const Icon = tab.icon;
            const count = tabCounts[tab.id] || 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/[0.03] text-white/60 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/80'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-white/40'}`} />}
                <span>{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-white/[0.06]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#0A0A0A]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] shadow-xl mb-8"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors" />
            <Input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border-white/[0.06] focus:border-white/20 text-white placeholder:text-white/30 h-11 rounded-xl text-sm"
            />
          </div>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/[0.03] hover:bg-white/[0.08] text-white/90 border border-white/[0.06] hover:border-white/20 h-11 px-5 rounded-xl flex items-center gap-2.5 justify-center"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="ml-1.5 bg-white/10 text-white hover:bg-white/20 border-none px-1.5 py-0 h-5 text-[10px]">{activeFilterCount}</Badge>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pt-4 mt-4 border-t border-white/[0.06] overflow-hidden"
            >
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">Sector</label>
                  <Select value={focusFilter} onValueChange={setFocusFilter}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {focusAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area === "all" ? "All Sectors" : area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">Stage</label>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">Region</label>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/40 text-xs font-medium">Active:</span>
                  {focusFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px]">{focusFilter}</Badge>
                  )}
                  {stageFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px]">{stageFilter}</Badge>
                  )}
                  {regionFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px]">
                      {regions.find(r => r.value === regionFilter)?.label}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px]">Search: "{searchQuery}"</Badge>
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-white/60 text-sm">
          Showing <span className="font-semibold text-white">{paginatedOpportunities.length}</span> of {filteredOpportunities.length} opportunities
        </p>
        {totalPages > 1 && (
          <p className="text-white/50 text-sm">
            Page {page + 1} of {totalPages}
          </p>
        )}
      </div>

      {/* Opportunities Grid */}
      {filteredOpportunities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <DollarSign className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 text-lg mb-4">No opportunities match your filters</p>
          <Button onClick={clearFilters} className="glass-button">
            Clear all filters
          </Button>
        </motion.div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedOpportunities.map((opp, index) => {
              const type = getOpportunityType(opp);
              const days = getDaysUntilDeadline(opp.deadline);
              const isHot = days !== null && days >= 0 && days <= 30;
              const url = getOpportunityUrl(opp);
              const description = getOpportunityDescription(opp);
              const sectors = getOpportunitySectors(opp);

              return (
                <motion.a
                  key={opp.id || index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
                  className="group relative bg-[#0F0F0F] rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.15] transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  {/* Hot badge */}
                  {isHot && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Flame className="w-3 h-3" />
                      {days === 0 ? "Today!" : `${days}d left`}
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      type === 'Grant' ? 'bg-green-500/10' :
                      type === 'Competition' ? 'bg-yellow-500/10' :
                      type === 'Accelerator' ? 'bg-orange-500/10' :
                      'bg-blue-500/10'
                    }`}>
                      {getTypeIcon(type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {opp.name}
                      </h3>
                      <p className="text-white/40 text-xs mt-0.5">{type}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/50 text-sm leading-relaxed mb-4 flex-grow line-clamp-2">
                    {description || `${opp.check_size || opp.organization || 'Funding opportunity'}`}
                  </p>

                  {/* Tags */}
                  {sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {sectors.slice(0, 3).map((sector, idx) => (
                        <Badge key={idx} className="bg-white/[0.04] text-white/60 border-white/[0.06] text-[10px] px-2 py-0.5">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto">
                    {opp.check_size && (
                      <span className="text-white/40 text-xs">{opp.check_size}</span>
                    )}
                    {opp.deadline && !isHot && (
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-white/40 group-hover:text-white text-xs ml-auto">
                      Learn More
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>

          {/* Pagination */}
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

      {/* Additional Resources */}
      <section className="mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-white/20 to-transparent" />
            <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/40">Resources</h2>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">Additional Resources</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              name: "NFX Signal Investor Database",
              description: "Comprehensive database of investors and their investment preferences",
              link: "https://signal.nfx.com/investors"
            },
            {
              name: "List of 50+ Chicago Investors",
              description: "Curated list of venture capital firms and investors in Chicago",
              link: "https://www.openvc.app/investor-lists/venture-capital-firm-investors-chicago"
            },
            {
              name: "Chicago Startup/Small Business Funding Resources",
              description: "Wiki of funding resources for Chicago-based startups and small businesses",
              link: "https://s3gadvisors.notion.site/Chicago-Small-Business-Funding-Wiki-42081a119ab24aa0b18084a15485e320"
            }
          ].map((resource, index) => (
            <motion.a
              key={index}
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group relative bg-white/[0.02] rounded-xl border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 p-5 flex flex-col"
            >
              <h3 className="text-base font-medium text-white mb-2 group-hover:text-white/90 transition-colors">{resource.name}</h3>
              <p className="text-white/40 text-sm leading-relaxed mb-4 flex-grow font-light group-hover:text-white/50 transition-colors">{resource.description}</p>
              <div className="flex items-center gap-1 text-white/40 text-xs font-medium group-hover:text-white/60 transition-colors">
                Visit Resource
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.a>
          ))}
        </div>
      </section>
    </div>
  );
}
