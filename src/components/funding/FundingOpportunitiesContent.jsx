import { useState, useMemo } from "react";
import { DollarSign, Calendar, Search, Filter, X, Flame, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import ShareActions from "@/components/ShareActions";
import FundingDetailModal from "./FundingDetailModal";

const ITEMS_PER_PAGE = 12;

export default function FundingOpportunitiesContent({ opportunities = [] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [focusFilter, setFocusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  const quickTabs = [
    { id: "all", label: "All" },
    { id: "hot", label: "Hot" },
    { id: "Grant", label: "Grants" },
    { id: "VC", label: "VC" },
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

  // Helper functions
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
      if (activeTab === "hot") {
        const days = getDaysUntilDeadline(item.deadline);
        if (days === null || days < 0 || days > 30) return false;
      } else if (activeTab !== "all") {
        const type = getOpportunityType(item);
        if (type !== activeTab) return false;
      }
      if (focusFilter !== "all") {
        const sectors = getOpportunitySectors(item);
        if (!sectors.some((f) => f.toLowerCase() === focusFilter.toLowerCase() || f === "All sectors" || f === "All")) {
          return false;
        }
      }
      if (stageFilter !== "all") {
        const stageArr = Array.isArray(item.stage) ? item.stage : [item.stage];
        if (!stageArr.some(s => s?.toLowerCase().includes(stageFilter.toLowerCase()))) {
          return false;
        }
      }
      if (regionFilter !== "all") {
        const region = getRegion(item);
        if (region !== regionFilter) return false;
      }
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(searchLower);
        const descMatch = getOpportunityDescription(item).toLowerCase().includes(searchLower);
        const orgMatch = item.organization?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch && !orgMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      const daysA = getDaysUntilDeadline(a.deadline);
      const daysB = getDaysUntilDeadline(b.deadline);
      if (daysA !== null && daysB !== null) return daysA - daysB;
      if (daysA !== null) return -1;
      if (daysB !== null) return 1;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities, activeTab, focusFilter, stageFilter, regionFilter, searchQuery]);

  const tabCounts = useMemo(() => {
    const counts = { all: 0, hot: 0, Grant: 0, VC: 0, Accelerator: 0, Competition: 0 };
    opportunities.forEach(opp => {
      if (!opp) return;
      const status = getDeadlineStatus(opp);
      if (status === 'closed') return;
      counts.all++;
      const type = getOpportunityType(opp);
      if (counts[type] !== undefined) counts[type]++;
      const days = getDaysUntilDeadline(opp.deadline);
      if (days !== null && days >= 0 && days <= 30) counts.hot++;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities]);

  const totalPages = Math.ceil(filteredOpportunities.length / ITEMS_PER_PAGE);
  const paginatedOpportunities = filteredOpportunities.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  const clearFilters = () => {
    setActiveTab("all");
    setFocusFilter("all");
    setStageFilter("all");
    setRegionFilter("all");
    setSearchQuery("");
    setPage(0);
  };

  const activeFilterCount = useMemo(() => [
    focusFilter !== "all",
    stageFilter !== "all",
    regionFilter !== "all",
    searchQuery !== ""
  ].filter(Boolean).length, [focusFilter, stageFilter, regionFilter, searchQuery]);

  return (
    <div>
      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-0 border border-white/20 w-fit mb-8">
        {quickTabs.map((tab) => {
          const count = tabCounts[tab.id] || 0;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(0); }}
              className={`font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 flex items-center gap-2 transition-colors cursor-crosshair border-r border-white/20 last:border-r-0 ${
                isActive
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              {tab.id === "hot" && <Flame className="w-3 h-3" strokeWidth={1.5} />}
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 ${isActive ? 'bg-black/20' : 'bg-white/10'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="border border-white/20 mb-8">
        <div className="p-4 flex items-center gap-4 border-b border-white/20">
          <Search className="w-4 h-4 text-white/50" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="SEARCH_OPPORTUNITIES..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/50 focus:outline-none uppercase tracking-[0.1em]"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center gap-2 cursor-crosshair"
          >
            <Filter className="w-3 h-3" strokeWidth={1.5} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-black px-1.5 py-0.5 text-[10px]">{activeFilterCount}</span>
            )}
          </button>
          <span className="font-mono text-xs text-white/50">
            {filteredOpportunities.length} RESULTS
          </span>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-white/20">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 mb-2 block">Sector</label>
                <select
                  value={focusFilter}
                  onChange={(e) => { setFocusFilter(e.target.value); setPage(0); }}
                  className="w-full bg-transparent border border-white/10 font-mono text-xs text-white p-2 focus:outline-none focus:border-white/30 cursor-crosshair"
                >
                  {focusAreas.map((area) => (
                    <option key={area} value={area} className="bg-[#0a0a0a]">
                      {area === "all" ? "All Sectors" : area}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 mb-2 block">Stage</label>
                <select
                  value={stageFilter}
                  onChange={(e) => { setStageFilter(e.target.value); setPage(0); }}
                  className="w-full bg-transparent border border-white/10 font-mono text-xs text-white p-2 focus:outline-none focus:border-white/30 cursor-crosshair"
                >
                  {stages.map((stage) => (
                    <option key={stage.value} value={stage.value} className="bg-[#0a0a0a]">
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 mb-2 block">Region</label>
                <select
                  value={regionFilter}
                  onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
                  className="w-full bg-transparent border border-white/10 font-mono text-xs text-white p-2 focus:outline-none focus:border-white/30 cursor-crosshair"
                >
                  {regions.map((region) => (
                    <option key={region.value} value={region.value} className="bg-[#0a0a0a]">
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors flex items-center gap-2 cursor-crosshair"
              >
                <X className="w-3 h-3" strokeWidth={1.5} />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Opportunities Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="border border-white/10 p-16 text-center">
          <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
          <span className="bureau-label block mb-4">[NO_RESULTS]</span>
          <p className="text-white/40 mb-6">No opportunities match your filters.</p>
          <button
            onClick={clearFilters}
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10 bg-black/40 backdrop-blur-sm">
            {paginatedOpportunities.map((opp, index) => {
              const type = getOpportunityType(opp);
              const days = getDaysUntilDeadline(opp.deadline);
              const isHot = days !== null && days >= 0 && days <= 30;
              const url = getOpportunityUrl(opp);
              const description = getOpportunityDescription(opp);
              const sectors = getOpportunitySectors(opp);

              return (
                <div
                  key={opp.id || index}
                  onClick={(e) => {
                    setModalPosition({ x: e.clientX, y: e.clientY });
                    setSelectedOpportunity(opp);
                  }}
                  className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 bg-black/20 hover:bg-black/40 transition-colors group flex flex-col cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs text-white/20">
                      {String(page * ITEMS_PER_PAGE + index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-2">
                      {isHot && (
                        <span className="font-mono text-[10px] text-orange-400 uppercase tracking-[0.15em] px-2 py-1 border border-orange-400/30 flex items-center gap-1">
                          <Flame className="w-3 h-3" strokeWidth={1.5} />
                          {days === 0 ? "Today" : `${days}d`}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.15em] px-2 py-1 border border-white/20">
                        {type}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-2 group-hover:text-white transition-colors line-clamp-2">
                    {opp.name}
                  </h3>

                  <p className="text-white/60 text-sm leading-relaxed mb-4 flex-grow line-clamp-2">
                    {description || opp.check_size || opp.organization || 'Funding opportunity'}
                  </p>

                  {sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {sectors.slice(0, 3).map((sector, idx) => (
                        <span key={idx} className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] px-2 py-1 border border-white/20">
                          {sector}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/20">
                    <div className="flex items-center gap-3">
                      {opp.check_size && (
                        <span className="font-mono text-xs text-white/60">{opp.check_size}</span>
                      )}
                      {opp.deadline && !isHot && (
                        <span className="font-mono text-xs text-white/50 flex items-center gap-1">
                          <Calendar className="w-3 h-3" strokeWidth={1.5} />
                          {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <ShareActions
                        resourceType="funding_opportunity"
                        resourceId={opp.id}
                        resourceName={opp.name}
                        resourceDescription={description}
                        resourceUrl={url}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalPosition({ x: e.clientX, y: e.clientY });
                          setSelectedOpportunity(opp);
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-1 cursor-crosshair"
                      >
                        Details
                        <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!hasPrevPage}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-crosshair flex items-center gap-2"
              >
                <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
                Prev
              </button>
              <span className="font-mono text-xs text-white/40 px-4">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNextPage}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-crosshair flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Additional Resources */}
      <section className="mt-16">
        <span className="bureau-label block mb-6">[ADDITIONAL_RESOURCES]</span>
        <div className="grid md:grid-cols-3 gap-0 border border-white/10">
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
            <a
              key={index}
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 border-r border-white/20 last:border-r-0 hover:bg-white/[0.02] transition-colors group flex flex-col"
            >
              <span className="font-mono text-xs text-white/20 mb-3">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-2 group-hover:text-white transition-colors">
                {resource.name}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4 flex-grow">
                {resource.description}
              </p>
              <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 group-hover:text-white transition-colors">
                Visit
                <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Detail Modal */}
      <FundingDetailModal
        opportunity={selectedOpportunity}
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        position={modalPosition}
      />
    </div>
  );
}
