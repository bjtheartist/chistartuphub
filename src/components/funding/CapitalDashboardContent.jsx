import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import QuarterlyDashboard from "../QuarterlyDashboard";
import NewsFilters from "./NewsFilters";
import NewsList from "./NewsList";
import RecentDealsSection from "./RecentDealsSection";
import DataSourcesSection from "./DataSourcesSection";

export default function CapitalDashboardContent({ news }) {
  const [newsStageFilter, setNewsStageFilter] = useState("all");
  const [newsDateFilter, setNewsDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      if (newsStageFilter !== "all" && item.stage !== newsStageFilter) {
        return false;
      }

      if (newsDateFilter !== "all") {
        const newsDate = new Date(item.date);
        const now = new Date();
        if (isNaN(newsDate.getTime())) return false;

        const daysDiff = Math.floor((now.getTime() - newsDate.getTime()) / (1000 * 60 * 60 * 24));

        if (newsDateFilter === "this_month") {
          if (newsDate.getMonth() !== now.getMonth() || newsDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (newsDateFilter === "last_30_days" && daysDiff > 30) {
          return false;
        } else if (newsDateFilter === "last_90_days" && daysDiff > 90) {
          return false;
        }
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(searchLower);
        const companyMatch = item.company_or_fund?.toLowerCase().includes(searchLower);
        const descriptionMatch = item.description?.toLowerCase().includes(searchLower);

        if (!titleMatch && !companyMatch && !descriptionMatch) {
          return false;
        }
      }

      return true;
    });
  }, [news, newsStageFilter, newsDateFilter, searchQuery]);

  const fundsClosed = useMemo(() =>
  filteredNews.filter((item) => item.news_type === 'fund_closed').sort((a, b) => b.featured - a.featured),
  [filteredNews]
  );

  const roundsClosed = useMemo(() =>
  filteredNews.filter((item) => item.news_type === 'round_closed').sort((a, b) => b.featured - a.featured),
  [filteredNews]
  );

  const groupByMonth = (newsItems) => {
    const grouped = {};
    newsItems.forEach((item) => {
      if (!item.date) return;
      const date = new Date(item.date);
      if (isNaN(date.getTime())) return;

      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(item);
    });

    return Object.entries(grouped).sort((a, b) => {
      const dateA = new Date(`1 ${a[0]}`);
      const dateB = new Date(`1 ${b[0]}`);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const groupedStartupRounds = useMemo(() => groupByMonth(roundsClosed), [roundsClosed]);
  const groupedFundCloses = useMemo(() => groupByMonth(fundsClosed), [fundsClosed]);

  const clearNewsFilters = () => {
    setNewsStageFilter("all");
    setNewsDateFilter("all");
    setSearchQuery("");
  };

  const activeNewsFilterCount = useMemo(() => [
  newsStageFilter !== "all",
  newsDateFilter !== "all",
  searchQuery !== ""].
  filter(Boolean).length, [newsStageFilter, newsDateFilter, searchQuery]);

  return (
    <motion.section
      key="news"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}>

      {/* Filters for News */}
      <NewsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        newsStageFilter={newsStageFilter}
        setNewsStageFilter={setNewsStageFilter}
        newsDateFilter={newsDateFilter}
        setNewsDateFilter={setNewsDateFilter}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        clearNewsFilters={clearNewsFilters}
        activeNewsFilterCount={activeNewsFilterCount} />


      {/* Dashboard Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-blue-500/50 to-transparent" />
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Overview</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">Chicago Capital Insights</h2>
        <p className="text-white/50 font-light">Tracking the trends, deals, and funds shaping the ecosystem</p>
      </div>

      {/* Trends Section Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 max-w-[30px] bg-gradient-to-r from-white/20 to-transparent" />
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-white/40">Trends</h3>
        </div>
      </div>

      {/* Q3 2025 Quarterly Dashboard */}
      <QuarterlyDashboard />

      {/* Recent Deals Section */}
      <RecentDealsSection />

      {/* News Lists */}
      <NewsList
        fundsClosed={fundsClosed}
        roundsClosed={roundsClosed}
        groupedStartupRounds={groupedStartupRounds}
        groupedFundCloses={groupedFundCloses}
        clearNewsFilters={clearNewsFilters}
        hasNoResults={filteredNews.length === 0} />


      {/* Disclaimer & Data Sources */}
      <DataSourcesSection />
    </motion.section>);

}