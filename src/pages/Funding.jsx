import React, { useState } from "react";
import { DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import CapitalDashboardContent from "../components/funding/CapitalDashboardContent";
import FundingOpportunitiesContent from "../components/funding/FundingOpportunitiesContent";
import SEO from "@/components/SEO";
import PageHero from "@/components/ui/page-hero";

export default function Funding() {
  const [activeTab, setActiveTab] = useState("news");

  const { data: opportunities, isLoading: opportunitiesLoading, error: opportunitiesError } = useQuery({
    queryKey: ['funding-opportunities'],
    queryFn: () => entities.FundingOpportunity.list('-created_date'),
    initialData: []
  });

  const { data: news, isLoading: newsLoading, error: newsError } = useQuery({
    queryKey: ['funding-news'],
    queryFn: () => entities.FundingNews.list('-date'),
    initialData: []
  });

  const { data: upcomingOpportunities, isLoading: upcomingLoading, error: upcomingError } = useQuery({
    queryKey: ['upcoming-opportunities'],
    queryFn: () => entities.UpcomingOpportunity.list('-deadline'),
    initialData: []
  });

  if (opportunitiesLoading || newsLoading || upcomingLoading) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Loading funding data...</p>
        </motion.div>
      </div>
    );
  }

  if (opportunitiesError || newsError || upcomingError) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-white/70 text-lg">Error loading funding data. Please try again later.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Chicago Startup Funding & Investors"
        description="Build faster with direct access to 90+ active Chicago investors. No warm intros required—filter by stage, check size, and focus area to find your funding match."
        keywords="Chicago venture capital, angel investors, startup funding, pre-seed, seed funding, Series A"
      />
      <div className="max-w-7xl mx-auto">
        <PageHero
          label="Funding"
          title="Capital Resources"
          description="Your comprehensive guide to funding opportunities in Chicago's startup ecosystem"
          stat={opportunities.length + news.length}
          statLabel="resources available"
          backgroundImage="https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1600&q=80"
        />

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-10 md:mb-12 px-2"
        >
          <div className="bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.08] inline-flex gap-1 backdrop-blur-md flex-col sm:flex-row w-full sm:w-auto">
            <Button
              onClick={() => setActiveTab("news")}
              className={`rounded-lg px-5 py-2.5 text-sm transition-all duration-300 justify-center ${
                activeTab === "news" 
                  ? "bg-white/[0.1] text-white shadow-sm" 
                  : "bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Capital Insights</span>
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">{news.length}</span>
            </Button>
            <Button
              onClick={() => setActiveTab("opportunities")}
              className={`rounded-lg px-5 py-2.5 text-sm transition-all duration-300 justify-center ${
                activeTab === "opportunities" 
                  ? "bg-white/[0.1] text-white shadow-sm" 
                  : "bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Opportunities</span>
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">{opportunities.length + upcomingOpportunities.length}</span>
            </Button>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "news" && (
            <CapitalDashboardContent news={news} />
          )}

          {activeTab === "opportunities" && (
            <FundingOpportunitiesContent 
              opportunities={opportunities}
              upcomingOpportunities={upcomingOpportunities}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}