import { useState, useEffect } from 'react';
import { Check, Lock, Zap, ArrowRight } from 'lucide-react';
import { BureauAtmosphere, BureauFooter } from '@/components/bureau';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

const FREE_FEATURES = [
  'Browse 68,000+ investors',
  'Filter by stage, sector, and type',
  'Search with boolean operators',
  'View investor names and descriptions',
  'Save favorites (with account)',
  'Funding opportunities browser',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Verified business websites',
  'Business phone numbers',
  'Verified business addresses',
  'Export to CSV and PDF',
  'AI-powered semantic search',
  'Priority data enrichment',
];

export default function Pricing() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, openSignup } = useAuth();
  const { isPro, startCheckout, openPortal, loading } = useSubscription();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleProClick = () => {
    if (!user) {
      openSignup();
      return;
    }
    if (isPro) {
      openPortal();
      return;
    }
    startCheckout();
  };

  return (
    <div className="min-h-screen relative" data-page="pricing">
      <SEO
        title="Pricing | ChiStartup Hub"
        description="Access verified investor contact data with ChiStartup Hub Pro. Browse 68,000+ investors for free or upgrade for full contact details."
        keywords="startup investor database, investor contact info, venture capital directory, pricing"
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Hero */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="font-mono text-[10px] text-chi-dim uppercase tracking-[0.3em] block mb-6">
                [CHISTARTUPHUB: PRICING]
              </span>
            </div>

            <h1
              className={`font-editorial text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              <span className="italic">Research Smarter</span>
            </h1>

            <p
              className={`font-editorial italic text-lg md:text-xl text-chi-muted max-w-2xl mx-auto ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              "Free to explore. Pro to connect."
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <div
              className={`border border-chi-grid p-8 bg-black/30 backdrop-blur-sm ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              <span className="font-mono text-[9px] text-chi-dim uppercase tracking-[0.2em] block mb-4">
                [FREE]
              </span>

              <h2 className="font-editorial text-3xl text-white mb-2">Explorer</h2>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-display text-5xl text-white">$0</span>
                <span className="text-chi-muted font-mono text-sm">/forever</span>
              </div>

              <p className="text-chi-muted text-sm mb-8 leading-relaxed">
                Full access to our investor directory. Browse, search, and filter 68,000+ investors across every stage and sector.
              </p>

              <div className="space-y-3 mb-8">
                {FREE_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-chi-signal mt-0.5 flex-shrink-0" />
                    <span className="text-chi-silver text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href="/Investors"
                className="block w-full text-center px-6 py-3 border border-chi-ghost text-chi-muted font-mono text-sm uppercase tracking-[0.1em] hover:border-white hover:text-white transition-colors"
              >
                Browse Investors
              </a>
            </div>

            {/* Pro Tier */}
            <div
              className={`border-2 border-white p-8 bg-black/50 backdrop-blur-sm relative ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '500ms' }}
            >
              {/* Badge */}
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-1 bg-white text-chi-navy font-mono text-[9px] uppercase tracking-[0.15em]">
                  Recommended
                </span>
              </div>

              <span className="font-mono text-[9px] text-chi-signal uppercase tracking-[0.2em] block mb-4">
                [PRO]
              </span>

              <h2 className="font-editorial text-3xl text-white mb-2">Researcher</h2>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-display text-5xl text-white">$29</span>
                <span className="text-chi-muted font-mono text-sm">/month</span>
              </div>

              <p className="text-chi-muted text-sm mb-8 leading-relaxed">
                Verified business contact data for every enriched investor. Websites, phone numbers, addresses — everything you need to reach out.
              </p>

              <div className="space-y-3 mb-8">
                {PRO_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-chi-signal mt-0.5 flex-shrink-0" />
                    <span className="text-chi-silver text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleProClick}
                disabled={loading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] transition-colors",
                  isPro
                    ? "bg-chi-signal/20 text-chi-signal border border-chi-signal/50 hover:bg-chi-signal/30"
                    : "bg-white text-chi-navy hover:bg-chi-silver"
                )}
              >
                {isPro ? (
                  <>Manage Subscription</>
                ) : (
                  <>
                    {user ? 'Upgrade to Pro' : 'Sign Up & Upgrade'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Trust Note */}
          <div className="max-w-4xl mx-auto mt-12 text-center">
            <p className="text-chi-dim font-mono text-xs leading-relaxed max-w-lg mx-auto">
              All contact data is business-level public information only — company websites, office phone numbers, and business addresses. We never share personal emails or personal contact information.
            </p>
          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}
