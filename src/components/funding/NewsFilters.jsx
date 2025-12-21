
import React from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export default function NewsFilters({
  searchQuery,
  setSearchQuery,
  newsStageFilter,
  setNewsStageFilter,
  newsDateFilter,
  setNewsDateFilter,
  showFilters,
  setShowFilters,
  clearNewsFilters,
  activeNewsFilterCount
}) {
  const newsStages = [
    { value: "all", label: "All Stages" },
    { value: "Pre-Seed", label: "Pre-Seed" },
    { value: "Seed", label: "Seed" },
    { value: "Series A", label: "Series A" },
    { value: "Series B", label: "Series B" },
    { value: "Series C", label: "Series C" },
    { value: "Series D", label: "Series D" },
    { value: "Venture Round", label: "Venture Round" },
    { value: "Private Equity", label: "Private Equity" }
  ];

  const dateFilters = [
    { value: "all", label: "All Time" },
    { value: "this_month", label: "This Month" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "last_90_days", label: "Last 90 Days" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-4 md:p-6 rounded-2xl border border-white/10 mb-6 md:mb-8"
    >
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/50" />
          <Input
            type="text"
            placeholder="Search company or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 md:pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 text-sm md:text-base"
          />
        </div>

        <Button
          onClick={() => setShowFilters(!showFilters)}
          className="glass-button flex items-center gap-2 justify-center text-sm md:text-base"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeNewsFilterCount > 0 && (
            <Badge className="ml-2 bg-white/20 text-white">{activeNewsFilterCount}</Badge>
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
            className="space-y-4 pt-4 border-t border-white/10 overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Funding Stage</label>
                <Select value={newsStageFilter} onValueChange={setNewsStageFilter}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {newsStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Time Period</label>
                <Select value={newsDateFilter} onValueChange={setNewsDateFilter}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFilters.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeNewsFilterCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-4">
                <span className="text-white/70 text-sm">Active filters:</span>
                {newsStageFilter !== "all" && (
                  <Badge className="bg-white/10 text-white border-white/20">
                    {newsStages.find((s) => s.value === newsStageFilter)?.label}
                  </Badge>
                )}
                {newsDateFilter !== "all" && (
                  <Badge className="bg-white/10 text-white border-white/20">
                    {dateFilters.find((d) => d.value === newsDateFilter)?.label}
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
                  onClick={clearNewsFilters}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
