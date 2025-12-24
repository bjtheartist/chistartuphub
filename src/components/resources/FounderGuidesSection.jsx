import React from "react";
import { FileText, TrendingUp, Lightbulb, Rocket, Users, BarChart3, DollarSign, Heart, Briefcase, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const founderGuides = [
  {
    title: "How to Build a Pitch Deck",
    icon: FileText,
    color: "bg-blue-400",
    description: "Step-by-step guide to creating a compelling pitch deck that tells your story and gets investor meetings.",
    link: "https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck",
    attribution: "Y Combinator",
    topics: ["Storytelling", "Design", "Content Strategy"]
  },
  {
    title: "How to Fundraise",
    icon: TrendingUp,
    color: "bg-purple-400",
    description: "Navigate the fundraising process from identifying the right investors to closing your round.",
    link: "https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising",
    attribution: "Y Combinator",
    topics: ["Investor Outreach", "Term Sheets", "Due Diligence"]
  },
  {
    title: "Product Strategy",
    icon: Lightbulb,
    color: "bg-amber-400",
    description: "Build products customers love by understanding market needs, user feedback, and iterative development.",
    link: "https://www.ycombinator.com/library/8e-how-to-talk-to-users",
    attribution: "Y Combinator",
    topics: ["User Research", "Iteration", "Product-Market Fit"]
  },
  {
    title: "Go-to-Market Strategy",
    icon: Rocket,
    color: "bg-pink-400",
    description: "Launch your product effectively with a strategic go-to-market plan covering positioning, channels, and tactics.",
    link: "https://firstround.com/review/go-to-market-strategy/",
    attribution: "First Round Review",
    topics: ["Launch Planning", "Positioning", "Market Fit"]
  },
  {
    title: "Customer Acquisition",
    icon: TrendingUp,
    color: "bg-green-400",
    description: "Learn proven strategies for acquiring customers efficiently while managing unit economics and growth.",
    link: "https://www.ycombinator.com/library/6o-customer-acquisition",
    attribution: "Y Combinator",
    topics: ["CAC", "Growth Hacking", "Unit Economics"]
  },
  {
    title: "Measuring What Matters",
    icon: BarChart3,
    color: "bg-cyan-400",
    description: "Define and track the metrics that matter most to your business using OKRs and performance dashboards.",
    link: "https://www.ycombinator.com/library/90-measuring-what-matters",
    attribution: "Y Combinator",
    topics: ["OKRs", "Key Metrics", "Analytics"]
  },
  {
    title: "Hiring Your First Team",
    icon: Users,
    color: "bg-indigo-400",
    description: "Build a strong founding team by recruiting talent, setting expectations, and creating company culture early.",
    link: "https://www.ycombinator.com/library/6b-the-right-people-part-1",
    attribution: "Y Combinator",
    topics: ["Recruiting", "Culture", "Equity"]
  },
  {
    title: "Pricing Strategy",
    icon: DollarSign,
    color: "bg-orange-400",
    description: "Find the right pricing model, test pricing strategies, and optimize for revenue growth and customer value.",
    link: "https://www.ycombinator.com/library/6n-pricing-strategy",
    attribution: "Y Combinator",
    topics: ["Monetization", "Revenue", "Unit Economics"]
  },
  {
    title: "Customer Success & Retention",
    icon: Heart,
    color: "bg-red-400",
    description: "Keep customers happy and reduce churn by building exceptional support and continuously improving the product.",
    link: "https://www.ycombinator.com/library/6q-customer-retention",
    attribution: "Y Combinator",
    topics: ["Churn", "Support", "Loyalty"]
  },
  {
    title: "Building Company Culture",
    icon: Briefcase,
    color: "bg-teal-400",
    description: "Create a values-driven culture that attracts talent, improves productivity, and defines your company's identity.",
    link: "https://www.ycombinator.com/library/6c-building-company-culture",
    attribution: "Y Combinator",
    topics: ["Values", "Team Dynamics", "Remote Work"]
  },
];

export default function FounderGuidesSection({ searchQuery = "" }) {
  // Filter guides based on search query
  const filteredGuides = searchQuery.trim() === ""
    ? founderGuides
    : founderGuides.filter((guide) => {
        const query = searchQuery.toLowerCase();
        return (
          guide.title.toLowerCase().includes(query) ||
          guide.description.toLowerCase().includes(query) ||
          guide.topics.some(topic => topic.toLowerCase().includes(query))
        );
      });

  // Don't render section if no results match search
  if (searchQuery.trim() !== "" && filteredGuides.length === 0) {
    return null;
  }

  return (
    <section className="mb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-yellow-500/50 to-transparent" />
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Founder Guides</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">
          Essential Founder Knowledge
        </h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          Comprehensive guides on critical founder activities—from product strategy and go-to-market planning to hiring and growth metrics
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredGuides.map((guide, index) => {
          const Icon = guide.icon;
          return (
            <motion.div
              key={guide.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all overflow-hidden group flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/[0.08] flex items-start gap-4">
                <div className={`w-14 h-14 ${guide.color} border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed mt-2">
                    {guide.description}
                  </p>
                  <p className="text-xs text-white/40 mt-3">
                    Source: {guide.attribution}
                  </p>
                </div>
              </div>

              {/* Topics */}
              <div className="px-6 py-4 border-b border-white/[0.08]">
                <div className="flex flex-wrap gap-2">
                  {guide.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs px-2.5 py-1 bg-white/[0.04] border border-white/[0.1] rounded text-white/60"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer with CTA */}
              <div className="p-6 mt-auto">
                <a href={guide.link} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Read Full Guide
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resource submission caveat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-8 bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center"
      >
        <p className="text-white/50 text-sm">
          This is just a starting place. Have a guide or resource that's helped you? <a href="/submit-resource" className="text-blue-400 hover:text-blue-300 underline">Submit it</a> to help other Chicago founders.
        </p>
      </motion.div>
    </section>
  );
}
