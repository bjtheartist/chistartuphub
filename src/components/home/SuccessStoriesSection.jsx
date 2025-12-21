import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const successStories = [
  {
    companyName: "Groupon",
    founderName: "Andrew Mason",
    summary: "Northwestern music student → The Point (activism) → Groupon pivot → fastest company to $1B revenue → IPO",
    category: "Consumer Tech"
  },
  {
    companyName: "ShipBob",
    founderName: "Dhruv Saxena & Divey Gulati",
    summary: "Started fulfilling orders from apartment → built fulfillment tech → expanded network → raised $200M+ → logistics giant",
    category: "Logistics Tech"
  },
  {
    companyName: "project44",
    founderName: "Jett McCandless",
    summary: "Recognized fragmentation problem → built API layer for carrier visibility → raised $500M+ → supply chain connective tissue",
    category: "Logistics Tech"
  },
  {
    companyName: "Avant",
    founderName: "Al Goldstein",
    summary: "Saw opportunity in near-prime lending → data-driven underwriting → scaled to $4B+ in loans",
    category: "FinTech"
  },
  {
    companyName: "Basecamp",
    founderName: "Jason Fried",
    summary: "Web design agency → built internal tool → launched as product → grew to millions of users → profitable & independent",
    category: "SaaS"
  },
  {
    companyName: "OkCupid",
    founderName: "Sam Yagan",
    summary: "Founded SparkNotes in college → started OkCupid with data-driven matching → acquisition by Match.com",
    category: "Consumer Tech"
  },
  {
    companyName: "Tempus",
    founderName: "Eric Lefkofsky",
    summary: "Recognized lack of data in oncology → built world's largest molecular/clinical database → FDA partnerships → IPO",
    category: "HealthTech"
  },
  {
    companyName: "Uptake",
    founderName: "Brad Keywell",
    summary: "Groupon co-founder → saw industrial AI opportunity → raised at $2B+ valuation → partnered with Caterpillar/Boeing",
    category: "AI & IoT"
  },
  {
    companyName: "Grubhub",
    founderName: "Matt Maloney & Mike Evans",
    summary: "Restaurant menu aggregator → moved to ordering → built delivery network → IPO 2014 → acquired by Just Eat Takeaway",
    category: "FoodTech"
  },
  {
    companyName: "Morningstar",
    founderName: "Joe Mansueto",
    summary: "Started with $80K → published mutual fund research → built data empire → went public → taken private at $6.2B",
    category: "FinTech"
  },
  {
    companyName: "Relativity",
    founderName: "Andrew Sieja",
    summary: "Started bootstrapped → focused on e-discovery niche → deep law firm relationships → category-defining product",
    category: "LegalTech"
  },
  {
    companyName: "Braintree",
    founderName: "Bryan Johnson",
    summary: "Payments gateway → focused on developer experience → acquired Venmo → caught mobile payments wave → PayPal acquisition",
    category: "FinTech"
  },
  {
    companyName: "Sprout Social",
    founderName: "Justyn Howard",
    summary: "Social media management tool → focused on SMB market → evolved to social listening/analytics → IPO 2019",
    category: "SaaS"
  },
  {
    companyName: "Tock",
    founderName: "Nick Kokonas",
    summary: "Fine dining operator (Alinea) → built reservation system with deposits → expanded to hospitality → Squarespace acquisition",
    category: "Hospitality Tech"
  },
  {
    companyName: "G2",
    founderName: "Godard Abel",
    summary: "Saw need for software reviews → built B2B review platform → scaled to 2M+ reviews → unicorn status",
    category: "B2B SaaS"
  },
  {
    companyName: "ActiveCampaign",
    founderName: "Jason VandeBoom",
    summary: "Consulting firm → marketing automation tool → focused on SMB market → raised first capital in 2016 → unicorn status",
    category: "SaaS"
  },
  {
    companyName: "Vivid Seats",
    founderName: "Eric Vassilatos & Jerry Bednyak",
    summary: "Ticket marketplace → survived financial crisis → grew through secondary market → SPAC IPO",
    category: "E-commerce"
  },
  {
    companyName: "SpotHero",
    founderName: "Mark Lawrence & Jeremy Smith",
    summary: "Solved urban parking problem → built marketplace → expanded to 300+ cities → raised $70M+",
    category: "Consumer Tech"
  },
  {
    companyName: "Tovala",
    founderName: "David Rabie & Bryan Wilcox",
    summary: "Smart oven + meal subscription → vertical integration (appliance + food) → direct-to-consumer",
    category: "Consumer Tech"
  },
  {
    companyName: "Clearcover",
    founderName: "Kyle Nakatsuji",
    summary: "Frustrated with car insurance experience → built digital-first insurer → raised from investors including Fin VC Coalition",
    category: "InsurTech"
  },
  {
    companyName: "Kin Insurance",
    founderName: "Sean Harper",
    summary: "Home insurance in catastrophe-prone areas → data-driven underwriting → raised from QED and other fintech investors",
    category: "InsurTech"
  },
  {
    companyName: "Bonobos",
    founderName: "Andy Dunn",
    summary: "Better-fitting pants online → vertically integrated brand → built guideshops → Walmart acquisition",
    category: "E-commerce"
  },
  {
    companyName: "Cameo",
    founderName: "Steven Galanis & Devon Townsend",
    summary: "Marketplace for celebrity personalized videos → pandemic boom → reached $1B valuation",
    category: "Creator Economy"
  },
  {
    companyName: "Jellyvision",
    founderName: "Amanda Lannert & Harry Gottlieb",
    summary: "Trivia game company (You Don't Know Jack) → pivoted to benefits education (ALEX) → HR tech leader → PE investment",
    category: "HR Tech"
  },
  {
    companyName: "SMS Assist",
    founderName: "Michael Rothman",
    summary: "Connecting facilities managers with service providers → scaled to 250K+ locations → tech-driven facilities management",
    category: "Facilities Management"
  },
  {
    companyName: "Narrative Science",
    founderName: "Stuart Frankel & Kris Hammond",
    summary: "Northwestern research → natural language generation → automated insights from data → Salesforce acquisition",
    category: "AI/ML"
  }
];

const StoryCard = ({ story }) => (
  <div className="w-[400px] flex-shrink-0 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 mx-3 h-full flex flex-col group">
    <div className="flex justify-between items-start mb-3">
      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-colors">
        {story.category}
      </Badge>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40">
        <TrendingUp className="w-4 h-4" />
      </div>
    </div>
    
    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
      {story.companyName}
    </h3>
    <p className="text-white/60 text-sm font-medium mb-4">
      {story.founderName}
    </p>
    
    <div className="mt-auto pt-4 border-t border-white/5">
      <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
        {story.summary}
      </p>
    </div>
  </div>
);

export default function SuccessStoriesSection() {
  const containerRef = useRef(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !sliderRef.current) return;

    const ctx = gsap.context(() => {
      const totalWidth = sliderRef.current.scrollWidth;
      const windowWidth = window.innerWidth;
      const amountToScroll = totalWidth - windowWidth + 100; // Extra buffer

      gsap.to(sliderRef.current, {
        x: -amountToScroll,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${amountToScroll}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="bg-black overflow-hidden relative">
      {/* Background Glow - Blue only, no purple */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 text-center relative z-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium uppercase tracking-wider mb-6">
            <Sparkles className="w-3 h-3 text-blue-400" />
            Learn from the Best
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Chicago Blueprints
          </h2>
          <p className="text-white/60 text-xl max-w-2xl mx-auto font-light leading-relaxed">
            From bootstrapped beginnings to billion-dollar exits. Discover the journeys that define our ecosystem.
          </p>
      </div>

      <div className="relative w-full h-full pb-32">
        <div ref={sliderRef} className="flex gap-4 px-6 w-max">
          {successStories.slice(0, 5).map((story, idx) => (
            <StoryCard key={`${story.companyName}-${idx}`} story={story} />
          ))}
          {/* Add a "See All" card at the end */}
          <div className="w-[300px] flex-shrink-0 flex items-center justify-center">
            <Link to={createPageUrl("Stories")}>
              <Button className="h-16 px-10 rounded-full bg-white text-black hover:bg-gray-200 text-lg font-bold transition-all hover:scale-110 shadow-xl">
                Explore All Stories <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}