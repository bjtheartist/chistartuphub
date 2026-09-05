import { useState, useEffect } from "react";
import { InvestorPageContent } from "@/components/investors-v2";
import { useInvestorCounts } from "@/hooks/useFilteredInvestors";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

export default function Investors() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: counts } = useInvestorCounts();
  const totalCount = counts?.total || 0;

  return (
    <div className="min-h-screen relative" data-page="investors">
      <SEO
        title="Investor Directory | ChiStartup Hub"
        description="Browse 55,000+ verified venture capital firms and angel investors. Filter by stage, sector, and location to find the right fit for your startup."
        keywords="startup investors, venture capital, angel investors, Chicago VCs, seed funding, Series A investors"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            {/* System Label */}
            <div className={`${isLoaded ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "100ms" }}>
              <span className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em] block mb-8">
                [CHISTARTUPHUB: INVESTORS]
              </span>
            </div>

            {/* Headline - Noir Zine Style */}
            <h1
              className={`font-editorial text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[0.95] mb-6 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "200ms" }}
            >
              <span className="italic">Find Your Investors</span>
            </h1>

            <p
              className={`font-editorial italic text-white/50 text-lg max-w-xl mb-6 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "300ms" }}
            >
              "Capital for the bold ones building in the shadows of the Midwest."
            </p>

            {/* Stat */}
            <div
              className={`inline-flex items-center gap-3 border border-white/10 px-5 py-3 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "400ms" }}
            >
              <span className="font-mono text-2xl text-white tracking-tight">
                {totalCount > 1000 ? `${Math.floor(totalCount / 1000).toLocaleString()}K+` : totalCount.toLocaleString()}
              </span>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">
                Investor Profiles in Database
              </span>
            </div>
          </div>
        </section>

        {/* Investors Content — server-side filtered */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <InvestorPageContent />
          </div>
        </section>

        {/* Data Disclaimer */}
        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto border-t border-white/10 pt-8">
            <p className="font-mono text-[11px] text-white/30 leading-relaxed max-w-3xl">
              We aggregate publicly available SEC data (Form D, Form ADV, EDGAR) to help founders discover and research potential investors. Data is sourced from government filings and may contain errors, duplicates, or outdated information. Always verify independently before making decisions. These represent a significant but incomplete subset of the investor market — many smaller rounds and international investors don't appear in public filings.
            </p>
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
