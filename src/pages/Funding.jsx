import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import FundingOpportunitiesContent from "../components/funding/FundingOpportunitiesContent";
import SEO from "@/components/SEO";
import PageHero from "@/components/ui/page-hero";

export default function Funding() {
  const { data: opportunities = [], isLoading: opportunitiesLoading, error: opportunitiesError } = useQuery({
    queryKey: ['funding-opportunities'],
    queryFn: () => entities.FundingOpportunity.list('-created_date'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: upcomingOpportunities = [], isLoading: upcomingLoading, error: upcomingError } = useQuery({
    queryKey: ['upcoming-opportunities'],
    queryFn: () => entities.UpcomingOpportunity.list('-deadline'),
    staleTime: 1000 * 60 * 5,
  });

  // Filter out closed opportunities for accurate counts
  const activeOpportunities = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return opportunities.filter(opp => {
      if (!opp.deadline) return true; // No deadline = still active
      const deadline = new Date(opp.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline >= now; // Only include if deadline hasn't passed
    });
  }, [opportunities]);

  const activeUpcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return upcomingOpportunities.filter(opp => {
      if (!opp.deadline) return true;
      const deadline = new Date(opp.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline >= now;
    });
  }, [upcomingOpportunities]);

  if (opportunitiesLoading || upcomingLoading) {
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

  if (opportunitiesError || upcomingError) {
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
          stat={activeOpportunities.length + activeUpcoming.length}
          statLabel="opportunities available"
          backgroundImage="https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1600&q=80"
        />

        <FundingOpportunitiesContent
          opportunities={opportunities}
          upcomingOpportunities={upcomingOpportunities}
        />
      </div>
    </div>
  );
}
