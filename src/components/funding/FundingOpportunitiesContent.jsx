import React, { useState, useMemo } from "react";
import { DollarSign, ExternalLink, Calendar, TrendingUp, Users, Building2, Rocket, Award, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { BentoGrid } from "@/components/ui/bento-grid";

export default function FundingOpportunitiesContent({ opportunities, upcomingOpportunities }) {
  const [focusFilter, setFocusFilter] = useState("all");
  const [checkSizeFilter, setCheckSizeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
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
    "Crypto", "DeepTech", "EdTech", "FinTech", "Food", "HealthTech", "InsurTech",
    "PropTech", "SaaS", "Software", "Web3"
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
    { value: "preseed", label: "Pre-Seed" },
    { value: "seed", label: "Seed" },
    { value: "accelerator", label: "Accelerator" },
    { value: "competition", label: "Competition" },
    { value: "Series A+", label: "Series A+" }
  ];

  const cities = useMemo(() =>
    ["all", ...new Set(opportunities.map((o) => o.location).filter(Boolean))].sort(),
    [opportunities]
  );

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      if (focusFilter !== "all") {
        if (!item.focus_areas || !item.focus_areas.some((f) => f.toLowerCase() === focusFilter.toLowerCase() || f === "All sectors")) {
          return false;
        }
      }

      if (checkSizeFilter !== "all" && item.check_size_range !== checkSizeFilter) {
        return false;
      }

      if (stageFilter !== "all") {
        if (!item.stage || (Array.isArray(item.stage) ? !item.stage.includes(stageFilter) : item.stage !== stageFilter)) {
          return false;
        }
      }

      if (cityFilter !== "all" && item.location !== cityFilter) {
        return false;
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(searchLower);
        const locationMatch = item.location?.toLowerCase().includes(searchLower);
        const focusMatch = item.focus_areas?.some((f) => f.toLowerCase().includes(searchLower));
        const noteMatch = item.note?.toLowerCase().includes(searchLower);

        if (!nameMatch && !locationMatch && !focusMatch && !noteMatch) {
          return false;
        }
      }

      return true;
    });
  }, [opportunities, focusFilter, checkSizeFilter, stageFilter, cityFilter, searchQuery]);

  const angelGroups = useMemo(() =>
    filteredOpportunities
      .filter((item) => item.name.toLowerCase().includes('angel'))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [filteredOpportunities]
  );

  const preseedInvestors = useMemo(() =>
    filteredOpportunities
      .filter((item) => Array.isArray(item.stage) ? item.stage.includes('preseed') : item.stage === 'preseed')
      .sort((a, b) => a.name.localeCompare(b.name)),
    [filteredOpportunities]
  );

  const seedInvestors = useMemo(() =>
    filteredOpportunities
      .filter((item) => {
        const hasSeeds = Array.isArray(item.stage) ? item.stage.includes('seed') : item.stage === 'seed';
        return hasSeeds && !item.name.toLowerCase().includes('angel');
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    [filteredOpportunities]
  );

  const seriesAInvestors = useMemo(() =>
    filteredOpportunities
      .filter((item) => Array.isArray(item.stage) ? item.stage.includes('Series A+') : item.stage === 'Series A+')
      .sort((a, b) => a.name.localeCompare(b.name)),
    [filteredOpportunities]
  );

  const accelerators = useMemo(() =>
    filteredOpportunities
      .filter((item) => Array.isArray(item.stage) ? item.stage.includes('accelerator') : item.stage === 'accelerator')
      .sort((a, b) => a.name.localeCompare(b.name)),
    [filteredOpportunities]
  );

  const competitions = useMemo(() =>
    filteredOpportunities
      .filter((item) => Array.isArray(item.stage) ? item.stage.includes('competition') : item.stage === 'competition')
      .sort((a, b) => a.name.localeCompare(b.name)),
    [filteredOpportunities]
  );

  const clearOpportunityFilters = () => {
    setFocusFilter("all");
    setCheckSizeFilter("all");
    setStageFilter("all");
    setCityFilter("all");
    setSearchQuery("");
  };

  const activeOpportunityFilterCount = useMemo(() => [
    focusFilter !== "all",
    checkSizeFilter !== "all",
    stageFilter !== "all",
    cityFilter !== "all",
    searchQuery !== ""
  ].filter(Boolean).length, [focusFilter, checkSizeFilter, stageFilter, cityFilter, searchQuery]);

  const convertToBentoItems = (fundingList) => {
    return fundingList.map((fund) => {
      const isMultiStage = Array.isArray(fund.stage) && fund.stage.length > 1;
      const stageIcon = isMultiStage ? <Rocket className="w-4 h-4 text-purple-400" /> :
        fund.stage?.[0] === 'preseed' || fund.stage === 'preseed' ? <Rocket className="w-4 h-4 text-blue-400" /> :
        fund.stage?.[0] === 'seed' || fund.stage === 'seed' ? <Building2 className="w-4 h-4 text-green-400" /> :
        fund.stage?.[0] === 'accelerator' || fund.stage === 'accelerator' ? <TrendingUp className="w-4 h-4 text-orange-400" /> :
        fund.stage?.[0] === 'competition' || fund.stage === 'competition' ? <Award className="w-4 h-4 text-yellow-400" /> :
        <DollarSign className="w-4 h-4 text-emerald-400" />;

      let description = fund.note || fund.subtitle || `${fund.check_size || 'Investment opportunities'} • ${fund.location || 'Multiple locations'}`;
      description = description.replace(/\b(Pre-Seed|Seed|Series [A-Z]\+?|Accelerator|Competition)\s*\(\d+\),?\s*/gi, '').trim();
      description = description.replace(/\|\s*Portfolio:\s*[\d.]+\s*companies/i, '').trim();
      description = description.replace(/Portfolio:\s*[\d.]+\s*companies/i, '').trim();
      description = description.replace(/^\|\s*/, '').replace(/\s*\|$/, '').trim();

      if (!description) {
        description = `${fund.check_size || 'Investment opportunities'} • ${fund.location || 'Multiple locations'}`;
      }

      return {
        title: fund.name,
        description: description,
        icon: stageIcon,
        status: isMultiStage ? "Multi-Stage" : (Array.isArray(fund.stage) ? fund.stage[0] : fund.stage) || "Active",
        meta: fund.check_size || "",
        tags: fund.focus_areas?.slice(0, 3) || [],
        cta: "Learn More →",
        colSpan: fund.featured ? 2 : 1,
        hasPersistentHover: fund.featured,
        link: fund.link
      };
    });
  };

  const convertUpcomingToBentoItems = (opportunitiesList) => {
    return opportunitiesList.map((opp) => {
      const typeIcon = opp.type === 'pitch_competition' ? <Award className="w-4 h-4 text-yellow-400" /> :
        opp.type === 'grant' ? <DollarSign className="w-4 h-4 text-green-400" /> :
        opp.type === 'accelerator_application' ? <Rocket className="w-4 h-4 text-orange-400" /> :
        <Calendar className="w-4 h-4 text-blue-400" />;

      const deadlineDate = new Date(opp.deadline);
      const formattedDeadline = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const deadlineDateOnly = new Date(deadlineDate);
      deadlineDateOnly.setHours(0, 0, 0, 0);

      const daysUntilDeadline = Math.ceil((deadlineDateOnly.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isClosingSoon = daysUntilDeadline <= 14 && daysUntilDeadline >= 0;
      const isPast = daysUntilDeadline < 0;

      const descriptionParts = [];
      if (opp.description) descriptionParts.push(opp.description);
      if (opp.location) descriptionParts.push(opp.location);
      const description = descriptionParts.join(' • ') || 'Details available';

      return {
        title: opp.name,
        description: description,
        icon: typeIcon,
        status: isPast ? "Closed" : isClosingSoon ? `Closes in ${daysUntilDeadline} days` : `Deadline: ${formattedDeadline}`,
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
              placeholder="Search funds or locations..."
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
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">Focus Area</label>
                  <Select value={focusFilter} onValueChange={setFocusFilter}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {focusAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area === "all" ? "All Focus Areas" : area}
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

                <div>
                  <label className="text-white/60 text-xs font-medium mb-2.5 block uppercase tracking-wider">City</label>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city === "all" ? "All Cities" : city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeOpportunityFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  <span className="text-white/40 text-xs font-medium">Active:</span>
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
                  {cityFilter !== "all" && (
                    <Badge className="bg-white/5 text-white/80 border-white/10 text-[10px] font-normal">
                      {cityFilter}
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

      {upcomingOpportunities.length > 0 && (
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
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{upcomingOpportunities.length}</span>
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
            <BentoGrid items={convertUpcomingToBentoItems(upcomingOpportunities).map((item, idx) => ({
              ...item,
              'data-link': upcomingOpportunities[idx].link
            }))} />
          </div>
        </section>
      )}

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
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">Accelerators & Incubators</h2>
            <p className="text-white/40 font-light text-sm">Program-based funding with mentorship and resources</p>
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
              'data-link': accelerators[idx].link
            }))} />
          </div>
        </section>
      )}

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
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Competitions</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{competitions.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">Ongoing Pitch Competitions</h2>
            <p className="text-white/40 font-light text-sm">Rolling competitions and ongoing opportunities</p>
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
              'data-link': competitions[idx].link
            }))} />
          </div>
        </section>
      )}

      {angelGroups.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-purple-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Angels</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{angelGroups.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">Angel Groups</h2>
            <p className="text-white/40 font-light text-sm">Early believers with flexible check sizes</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(angelGroups).map((item, idx) => ({
              ...item,
              'data-link': angelGroups[idx].link
            }))} />
          </div>
        </section>
      )}

      {preseedInvestors.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-blue-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Pre-Seed</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{preseedInvestors.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">Pre-Seed Investors</h2>
            <p className="text-white/40 font-light text-sm">For very early stage companies</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(preseedInvestors).map((item, idx) => ({
              ...item,
              'data-link': preseedInvestors[idx].link
            }))} />
          </div>
        </section>
      )}

      {seedInvestors.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-green-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Seed</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{seedInvestors.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">Seed Investors</h2>
            <p className="text-white/40 font-light text-sm">For companies with initial traction</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(seedInvestors).map((item, idx) => ({
              ...item,
              'data-link': seedInvestors[idx].link
            }))} />
          </div>
        </section>
      )}

      {seriesAInvestors.length > 0 && (
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-emerald-500/50 to-transparent" />
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Series A+</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50">{seriesAInvestors.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">Series A & Growth Equity</h2>
            <p className="text-white/40 font-light text-sm">For scaling companies</p>
          </motion.div>

          <div
            className="cursor-pointer"
            onClick={(e) => {
              const link = e.target.closest('[data-link]')?.getAttribute('data-link');
              if (link) window.open(link, '_blank');
            }}
          >
            <BentoGrid items={convertToBentoItems(seriesAInvestors).map((item, idx) => ({
              ...item,
              'data-link': seriesAInvestors[idx].link
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