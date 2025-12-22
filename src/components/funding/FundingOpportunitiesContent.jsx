import React, { useState, useMemo } from "react";
import { DollarSign, ExternalLink, Calendar, TrendingUp, Users, Building2, Rocket, Award, Search, Filter, X, Globe, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { BentoGrid } from "@/components/ui/bento-grid";

export default function FundingOpportunitiesContent({ opportunities = [], upcomingOpportunities = [] }) {
  const [focusFilter, setFocusFilter] = useState("all");
  const [checkSizeFilter, setCheckSizeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [opportunityTypeFilter, setOpportunityTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [deadlineStatusFilter, setDeadlineStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const additionalResources = [
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
  ];

  const focusAreas = [
    "all", "AI", "AgTech", "B2B", "Blockchain", "CleanTech", "Commerce", "Consumer",
    "Crypto", "DeepTech", "EdTech", "FinTech", "Food", "FoodTech", "Healthcare", "HealthTech",
    "InsurTech", "IoT", "PropTech", "Research", "SaaS", "Social Impact", "Software", "Technology", "Web3"
  ];

  const checkSizeRanges = [
    { value: "all", label: "All Check Sizes" },
    { value: "under250k", label: "Under $250K" },
    { value: "250k-1m", label: "$250K - $1M" },
    { value: "1m-5m", label: "$1M - $5M" },
    { value: "5m+", label: "$5M+" }
  ];

  const stages = [
    { value: "all", label: "All Stages" },
    { value: "Pre-Seed", label: "Pre-Seed" },
    { value: "Seed", label: "Seed" },
    { value: "Early Stage", label: "Early Stage" },
    { value: "Growth", label: "Growth" },
    { value: "Series A+", label: "Series A+" }
  ];

  const opportunityTypes = [
    { value: "all", label: "All Types" },
    { value: "Grant", label: "Grants" },
    { value: "Accelerator", label: "Accelerators" },
    { value: "Competition", label: "Competitions" },
    { value: "VC", label: "Venture Capital" }
  ];

  const regions = [
    { value: "all", label: "All Regions" },
    { value: "chicago", label: "Chicago/Illinois" },
    { value: "us-national", label: "US National" },
    { value: "europe", label: "Europe" },
    { value: "asia", label: "Asia Pacific" },
    { value: "africa", label: "Africa" },
    { value: "latam", label: "Latin America" },
    { value: "canada", label: "Canada" },
    { value: "middle-east", label: "Middle East" }
  ];

  const deadlineStatuses = [
    { value: "all", label: "All Deadlines" },
    { value: "closing-soon", label: "Closing Soon (< 30 days)" },
    { value: "open", label: "Open" },
    { value: "rolling", label: "Rolling/No Deadline" }
  ];

  // Helper functions for field normalization
  const getOpportunityUrl = (opp) => opp?.website || opp?.link || '';
  const getOpportunityDescription = (opp) => opp?.description || opp?.note || opp?.subtitle || '';
  const getOpportunitySectors = (opp) => opp?.sectors || opp?.focus_areas || [];
  const getOpportunityType = (opp) => {
    if (!opp) return 'VC';
    const type = (opp.opportunity_type || '').toLowerCase();

    // Map various type values to standardized categories
    if (type === 'grant') return 'Grant';
    if (type === 'accelerator' || type === 'accelerator_application') return 'Accelerator';
    if (type === 'competition' || type === 'pitch_competition') return 'Competition';
    if (type === 'vc') return 'VC';

    // "standard" and "underrepresented" are typically VC/investor entries
    if (type === 'standard' || type === 'underrepresented') return 'VC';

    // Fallback: check stage array for hints
    const stageArr = Array.isArray(opp.stage) ? opp.stage : [opp.stage];
    if (stageArr.some(s => s?.toLowerCase() === 'accelerator')) return 'Accelerator';
    if (stageArr.some(s => s?.toLowerCase() === 'competition')) return 'Competition';

    return 'VC';
  };

  // Region detection helper
  const getRegion = (opp) => {
    if (!opp) return 'us-national';
    const name = (opp.name || '').toLowerCase();
    const org = (opp.organization || '').toLowerCase();
    const desc = getOpportunityDescription(opp).toLowerCase();
    const location = (opp.location || '').toLowerCase();
    const combined = `${name} ${org} ${desc} ${location}`;

    if (combined.includes('chicago') || combined.includes('illinois') || combined.includes('midwest') || combined.includes('techrise') || combined.includes('workbox')) return 'chicago';
    if (combined.includes('europe') || combined.includes('eic') || combined.includes(' eu ') || combined.includes(' uk ') || combined.includes('innovate uk') || combined.includes('european')) return 'europe';
    if (combined.includes('africa') || combined.includes('nigeria') || combined.includes('kenya') || combined.includes('south africa') || combined.includes('mtn ')) return 'africa';
    if (combined.includes('asia') || combined.includes('singapore') || combined.includes('korea') || combined.includes('japan') || combined.includes('sparklabs')) return 'asia';
    if (combined.includes('latin') || combined.includes('brazil') || combined.includes('chile') || combined.includes('mexico') || combined.includes('latam') || combined.includes('wayra')) return 'latam';
    if (combined.includes('canada') || combined.includes('irap') || combined.includes('mitacs') || combined.includes('sr&ed')) return 'canada';
    if (combined.includes('uae') || combined.includes('saudi') || combined.includes('emirates') || combined.includes('middle east') || combined.includes('khalifa') || combined.includes('monsha')) return 'middle-east';
    return 'us-national';
  };

  // Deadline helper
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
      // Filter out null/undefined items
      if (!item) return false;

      // Always filter out closed opportunities (deadline has passed)
      const status = getDeadlineStatus(item);
      if (status === 'closed') return false;

      // Focus area filter
      if (focusFilter !== "all") {
        const sectors = getOpportunitySectors(item);
        if (!sectors.some((f) => f.toLowerCase() === focusFilter.toLowerCase() || f === "All sectors" || f === "All")) {
          return false;
        }
      }

      // Check size filter
      if (checkSizeFilter !== "all" && item.check_size_range !== checkSizeFilter) {
        return false;
      }

      // Stage filter
      if (stageFilter !== "all") {
        const stageArr = Array.isArray(item.stage) ? item.stage : [item.stage];
        if (!stageArr.some(s => s?.toLowerCase().includes(stageFilter.toLowerCase()))) {
          return false;
        }
      }

      // Opportunity type filter
      if (opportunityTypeFilter !== "all") {
        const type = getOpportunityType(item);
        if (type !== opportunityTypeFilter) {
          return false;
        }
      }

      // Region filter
      if (regionFilter !== "all") {
        const region = getRegion(item);
        if (region !== regionFilter) {
          return false;
        }
      }

      // Deadline status filter
      if (deadlineStatusFilter !== "all") {
        const itemStatus = getDeadlineStatus(item);
        if (deadlineStatusFilter !== itemStatus) {
          return false;
        }
      }

      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(searchLower);
        const locationMatch = item.location?.toLowerCase().includes(searchLower);
        const focusMatch = getOpportunitySectors(item).some((f) => f.toLowerCase().includes(searchLower));
        const descMatch = getOpportunityDescription(item).toLowerCase().includes(searchLower);
        const orgMatch = item.organization?.toLowerCase().includes(searchLower);

        if (!nameMatch && !locationMatch && !focusMatch && !descMatch && !orgMatch) {
          return false;
        }
      }

      return true;
    });
  }, [opportunities, focusFilter, checkSizeFilter, stageFilter, opportunityTypeFilter, regionFilter, deadlineStatusFilter, searchQuery]);

  // Section groupings
  const hotDeadlines = useMemo(() =>
    filteredOpportunities
      .filter((item) => {
        const days = getDaysUntilDeadline(item.deadline);
        return days !== null && days >= 0 && days <= 30;
      })
      .sort((a, b) => getDaysUntilDeadline(a.deadline) - getDaysUntilDeadline(b.deadline)),
    [filteredOpportunities]
  );

  const grants = useMemo(() =>
    filteredOpportunities
      .filter((item) => {
        const type = getOpportunityType(item);
        return type === 'Grant';
      })
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (a.name || '').localeCompare(b.name || '');
      }),
    [filteredOpportunities]
  );

  const competitions = useMemo(() =>
    filteredOpportunities
      .filter((item) => {
        const type = getOpportunityType(item);
        return type === 'Competition';
      })
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (a.name || '').localeCompare(b.name || '');
      }),
    [filteredOpportunities]
  );

  const accelerators = useMemo(() =>
    filteredOpportunities
      .filter((item) => {
        const type = getOpportunityType(item);
        return type === 'Accelerator';
      })
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (a.name || '').localeCompare(b.name || '');
      }),
    [filteredOpportunities]
  );

  const vcInvestors = useMemo(() =>
    filteredOpportunities
      .filter((item) => {
        const type = getOpportunityType(item);
        return type === 'VC';
      })
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (a.name || '').localeCompare(b.name || '');
      }),
    [filteredOpportunities]
  );

  const clearOpportunityFilters = () => {
    setFocusFilter("all");
    setCheckSizeFilter("all");
    setStageFilter("all");
    setOpportunityTypeFilter("all");
    setRegionFilter("all");
    setDeadlineStatusFilter("all");
    setSearchQuery("");
  };

  const activeOpportunityFilterCount = useMemo(() => [
    focusFilter !== "all",
    checkSizeFilter !== "all",
    stageFilter !== "all",
    opportunityTypeFilter !== "all",
    regionFilter !== "all",
    deadlineStatusFilter !== "all",
    searchQuery !== ""
  ].filter(Boolean).length, [focusFilter, checkSizeFilter, stageFilter, opportunityTypeFilter, regionFilter, deadlineStatusFilter, searchQuery]);

  const convertToBentoItems = (fundingList = [], showDeadline = false) => {
    return fundingList.filter(Boolean).map((fund) => {
      const type = getOpportunityType(fund);
      const typeIcon = type === 'Grant' ? <DollarSign className="w-4 h-4 text-green-400" /> :
        type === 'Competition' ? <Award className="w-4 h-4 text-yellow-400" /> :
        type === 'Accelerator' ? <Rocket className="w-4 h-4 text-orange-400" /> :
        <TrendingUp className="w-4 h-4 text-blue-400" />;

      let description = getOpportunityDescription(fund);
      description = description.replace(/\b(Pre-Seed|Seed|Series [A-Z]\+?|Accelerator|Competition)\s*\(\d+\),?\s*/gi, '').trim();
      description = description.replace(/\|\s*Portfolio:\s*[\d.]+\s*companies/i, '').trim();
      description = description.replace(/Portfolio:\s*[\d.]+\s*companies/i, '').trim();
      description = description.replace(/^\|\s*/, '').replace(/\s*\|$/, '').trim();

      if (!description) {
        description = `${fund.check_size || fund.organization || 'Funding opportunity'} • ${fund.location || getRegion(fund)}`;
      }

      let status = type;
      if (showDeadline && fund.deadline) {
        const days = getDaysUntilDeadline(fund.deadline);
        if (days !== null && days >= 0) {
          status = days === 0 ? "Today!" : days === 1 ? "1 day left" : `${days} days left`;
        }
      }

      return {
        title: fund.name,
        description: description,
        icon: typeIcon,
        status: status,
        meta: fund.check_size || fund.organization || "",
        tags: getOpportunitySectors(fund).slice(0, 3),
        cta: "Learn More →",
        colSpan: fund.featured ? 2 : 1,
        hasPersistentHover: fund.featured,
        link: getOpportunityUrl(fund)
      };
    });
  };

  const convertUpcomingToBentoItems = (opportunitiesList = []) => {
    return opportunitiesList.filter(Boolean).map((opp) => {
      const typeIcon = opp.type === 'pitch_competition' ? <Award className="w-4 h-4 text-yellow-400" /> :
        opp.type === 'grant' ? <DollarSign className="w-4 h-4 text-green-400" /> :
        opp.type === 'accelerator_application' ? <Rocket className="w-4 h-4 text-orange-400" /> :
        <Calendar className="w-4 h-4 text-blue-400" />;

      let status = "Rolling";
      let isPast = false;

      if (opp.deadline) {
        const deadlineDate = new Date(opp.deadline);
        const formattedDeadline = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const deadlineDateOnly = new Date(deadlineDate);
        deadlineDateOnly.setHours(0, 0, 0, 0);

        const daysUntilDeadline = Math.ceil((deadlineDateOnly.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isClosingSoon = daysUntilDeadline <= 14 && daysUntilDeadline >= 0;
        isPast = daysUntilDeadline < 0;

        status = isPast ? "Closed" : isClosingSoon ? `Closes in ${daysUntilDeadline} days` : `Deadline: ${formattedDeadline}`;
      }

      const descriptionParts = [];
      if (opp.description) descriptionParts.push(opp.description);
      if (opp.location) descriptionParts.push(opp.location);
      const description = descriptionParts.join(' • ') || 'Details available';

      return {
        title: opp.name,
        description: description,
        icon: typeIcon,
        status: status,
        meta: opp.prize_amount || opp.eligibility || "",
        tags: opp.focus_areas?.slice(0, 3) || [],
        cta: "Learn More →",
        colSpan: opp.featured ? 2 : 1,
        hasPersistentHover: opp.featured,
        link: opp.link
      };
    });
  };

  return (
    <motion.div
      key="opportunities"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-20 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 mb-8 md:mb-10"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors duration-300" />
            <Input
              type="text"
              placeholder="Search opportunities, organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border-white/[0.06] focus:border-white/20 text-white placeholder:text-white/30 h-11 rounded-xl transition-all duration-300 text-sm"
            />
          </div>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/[0.03] hover:bg-white/[0.08] text-white/90 border border-white/[0.06] hover:border-white/20 h-11 px-5 rounded-xl transition-all duration-300 flex items-center gap-2.5 justify-center"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">Filters</span>
            {activeOpportunityFilterCount > 0 && (
              <Badge className="ml-1.5 bg-white/10 text-white hover:bg-white/20 border-none px-1.5 py-0 h-5 text-[10px]">{activeOpportunityFilterCount}</Badge>
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
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">Type</label>
                  <Select value={opportunityTypeFilter} onValueChange={setOpportunityTypeFilter}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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

                <div>
                  <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">Deadline</label>
                  <Select value={deadlineStatusFilter} onValueChange={setDeadlineStatusFilter}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deadlineStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
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
                  <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">Check Size</label>
                  <Select value={checkSizeFilter} onValueChange={setCheckSizeFilter}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {checkSizeRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeOpportunityFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  <span className="text-white/40 text-xs font-medium">Active:</span>
                  {opportunityTypeFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      {opportunityTypes.find((t) => t.value === opportunityTypeFilter)?.label}
                    </Badge>
                  )}
                  {regionFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      {regions.find((r) => r.value === regionFilter)?.label}
                    </Badge>
                  )}
                  {deadlineStatusFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      {deadlineStatuses.find((d) => d.value === deadlineStatusFilter)?.label}
                    </Badge>
                  )}
                  {stageFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      {stages.find((s) => s.value === stageFilter)?.label}
                    </Badge>
                  )}
                  {focusFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      {focusFilter}
                    </Badge>
                  )}
                  {checkSizeFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      {checkSizeRanges.find((r) => r.value === checkSizeFilter)?.label}
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
                    onClick={clearOpportunityFilters}
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

      {/* Hot Deadlines Section */}
      {hotDeadlines.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-red-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-red-400/70">Urgent</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{hotDeadlines.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Hot Deadlines
            </h2>
            <p className="text-white/40 font-light text-sm">Opportunities closing within 30 days — act fast!</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(hotDeadlines, true).map((item, idx) => ({
              ...item,
              'data-link': getOpportunityUrl(hotDeadlines[idx])
            }))} />
          </div>
        </section>
      )}

      {/* Upcoming Opportunities (from separate table) - filter out closed ones */}
      {(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const activeUpcoming = upcomingOpportunities.filter(opp => {
          if (!opp.deadline) return true;
          const deadline = new Date(opp.deadline);
          deadline.setHours(0, 0, 0, 0);
          return deadline >= now;
        });

        if (activeUpcoming.length === 0) return null;

        return (
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-yellow-500/50 to-transparent" />
                <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Deadlines</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{activeUpcoming.length}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">Upcoming Opportunities</h2>
              <p className="text-white/40 font-light text-sm">Time-sensitive pitch competitions, grants, and accelerator applications</p>
            </motion.div>

            <div
              className="cursor-pointer"
              onClick={(e) => {
                const link = e.target.closest('[data-link]')?.getAttribute('data-link');
                if (link) window.open(link, '_blank');
              }}
            >
              <BentoGrid items={convertUpcomingToBentoItems(activeUpcoming).map((item, idx) => ({
                ...item,
                'data-link': activeUpcoming[idx].link
              }))} />
            </div>
          </section>
        );
      })()}

      {/* Grants Section */}
      {grants.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-green-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Non-Dilutive</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{grants.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-500" />
              Grants
            </h2>
            <p className="text-white/40 font-light text-sm">Non-dilutive funding — keep your equity</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(grants).map((item, idx) => ({
              ...item,
              'data-link': getOpportunityUrl(grants[idx])
            }))} />
          </div>
        </section>
      )}

      {/* Competitions Section */}
      {competitions.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-yellow-400/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Pitch & Win</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{competitions.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Pitch Competitions
            </h2>
            <p className="text-white/40 font-light text-sm">Compete for prizes and investment</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(competitions).map((item, idx) => ({
              ...item,
              'data-link': getOpportunityUrl(competitions[idx])
            }))} />
          </div>
        </section>
      )}

      {/* Accelerators Section */}
      {accelerators.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-orange-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Programs</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{accelerators.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight flex items-center gap-2">
              <Rocket className="w-6 h-6 text-orange-500" />
              Accelerators & Programs
            </h2>
            <p className="text-white/40 font-light text-sm">Structured programs with mentorship and resources</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(accelerators).map((item, idx) => ({
              ...item,
              'data-link': getOpportunityUrl(accelerators[idx])
            }))} />
          </div>
        </section>
      )}

      {/* Venture Capital Section */}
      {vcInvestors.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-blue-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Investment</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{vcInvestors.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              Venture Capital & Investors
            </h2>
            <p className="text-white/40 font-light text-sm">Equity investment from VCs and angel groups</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(vcInvestors).map((item, idx) => ({
              ...item,
              'data-link': getOpportunityUrl(vcInvestors[idx])
            }))} />
          </div>
        </section>
      )}

      {filteredOpportunities.length === 0 && upcomingOpportunities.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <DollarSign className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 text-lg mb-4">No opportunities found matching your filters</p>
          <Button onClick={clearOpportunityFilters} className="glass-button">
            Clear all filters
          </Button>
        </motion.div>
      )}

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
          {additionalResources.map((resource, index) => (
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
    </motion.div>
  );
}
