import { useMemo, useState, useEffect } from "react";
import { entities, listBrowseInvestors } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { FundingPageContent } from "@/components/funding-v2";
import { STALE_TIMES } from "@/lib/query-client";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

export default function Funding() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: opportunities = [], isLoading: opportunitiesLoading, error: opportunitiesError } = useQuery({
    queryKey: ['funding-opportunities'],
    queryFn: () => entities.FundingOpportunity.list('-created_date'),
    staleTime: STALE_TIMES.fundingOpportunities,
  });

  const { data: upcomingOpportunities = [], isLoading: upcomingLoading, error: upcomingError } = useQuery({
    queryKey: ['upcoming-opportunities'],
    queryFn: () => entities.UpcomingOpportunity.list('-deadline'),
    staleTime: STALE_TIMES.upcomingOpportunities,
  });

  // Fetch investors for comprehensive funding view
  const { data: investors = [] } = useQuery({
    queryKey: ['investors', 'browse'],
    queryFn: listBrowseInvestors,
    staleTime: STALE_TIMES.investors,
  });

  // Filter out closed opportunities for accurate counts
  const activeOpportunities = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return opportunities.filter(opp => {
      if (!opp.deadline) return true;
      const deadline = new Date(opp.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline >= now;
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
      <div className="min-h-screen flex items-center justify-center relative">
        <BureauAtmosphere />
        <div className="relative z-10 text-center">
          <div className="font-mono text-4xl text-white mb-4 animate-pulse">
            <span className="inline-block">LOADING</span>
          </div>
          <div className="w-48 h-[2px] bg-white/20 mx-auto">
            <div className="h-full bg-white/60 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
          <p className="font-mono text-xs text-white/40 mt-4 uppercase tracking-[0.2em]">
            Fetching funding data...
          </p>
        </div>
      </div>
    );
  }

  if (opportunitiesError || upcomingError) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <BureauAtmosphere />
        <div className="relative z-10 text-center border border-white/10 p-12">
          <span className="bureau-label block mb-4">[ERROR: CONNECTION_FAILED]</span>
          <p className="text-white/60">Unable to load funding data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" data-page="funding">
      <SEO
        title="Chicago Startup Funding Opportunities"
        description="Apply to grants, accelerators, and competitions with active deadlines. Filter by type, amount, and sector to find funding that fits your startup."
        keywords="startup grants, accelerator programs, pitch competitions, Chicago funding, startup capital"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-5xl mx-auto text-center">
            {/* System Label */}
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="font-mono text-[10px] text-chi-dim uppercase tracking-[0.3em] block mb-6">
                [CHISTARTUPHUB: FUNDING]
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`font-editorial text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05] mb-4 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Find Your Funding
            </h1>

            {/* Tagline */}
            <p
              className={`font-editorial italic text-lg md:text-xl text-chi-muted max-w-2xl mx-auto ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              "Capital for the bold ones building in the shadows of the Midwest."
            </p>
          </div>
        </section>

        {/* Funding Content - New Noir Zine Design */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <FundingPageContent
              opportunities={activeOpportunities}
              upcomingOpportunities={activeUpcoming}
              investors={investors}
            />
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
