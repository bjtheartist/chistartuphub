import React from "react";
import { FileText, TrendingUp, Lightbulb, Rocket, Users, BarChart3, DollarSign, Heart, Briefcase, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const founderGuides = [
  {
    title: "How to Build a Pitch Deck",
    icon: FileText,
    color: "bg-blue-400",
    description: "Learn to design a compelling pitch deck that tells your story, attracts investor attention, and clearly communicates your value proposition.",
    links: [
      { title: "Y Combinator - How to Design a Pitch Deck", url: "https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck" },
      { title: "Y Combinator - Seed Round Pitch Deck", url: "https://www.ycombinator.com/library/2u-how-to-build-your-seed-round-pitch-deck" },
      { title: "Sequoia Capital - Business Plan & Pitch", url: "https://www.sequoiacap.com/article/writing-a-business-plan/" },
      { title: "DocSend - Pitch Deck Examples", url: "https://docsend.com/blog/startup-pitch-decks/" }
    ],
    attribution: "Y Combinator, Sequoia Capital",
    topics: ["Storytelling", "Design", "Investor Communication"]
  },
  {
    title: "How to Pitch Your Startup",
    icon: FileText,
    color: "bg-indigo-400",
    description: "Master the art of pitching—learn how to present your idea, answer tough questions, and convince investors in person.",
    links: [
      { title: "Y Combinator - How to Pitch Your Startup", url: "https://www.ycombinator.com/library/6q-how-to-pitch-your-startup" },
      { title: "First Round - The Art of the Pitch", url: "https://review.firstround.com/the-art-of-the-pitch-lessons-from-silicon-valleys-best" },
    ],
    attribution: "Y Combinator, First Round",
    topics: ["Presentation", "Communication", "Investor Relations"]
  },
  {
    title: "How to Fundraise",
    icon: TrendingUp,
    color: "bg-purple-400",
    description: "Navigate the complete fundraising process—from identifying the right investors to negotiating terms and closing your round.",
    links: [
      { title: "Y Combinator - Seed Fundraising Guide", url: "https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising" },
      { title: "First Round - Fundraising Tactics", url: "https://review.firstround.com/the-definitive-guide-to-startup-fundraising" },
      { title: "Fundraising Lore - Comprehensive Guide", url: "https://hajeonkamps.notion.site/Fundraising-Lore-9d6b8734cf8e4d0ba254b0e62574941c" },
      { title: "Holloway - Equity Compensation Guide", url: "https://www.holloway.com/g/equity-compensation" }
    ],
    attribution: "Y Combinator, First Round, Holloway",
    topics: ["Investor Outreach", "Term Sheets", "Due Diligence"]
  },
  {
    title: "Customer Research & Discovery",
    icon: Users,
    color: "bg-rose-400",
    description: "Learn how to talk to customers effectively, validate your assumptions, and discover what actually solves their problems.",
    links: [
      { title: "Y Combinator - How to Talk to Users", url: "https://www.ycombinator.com/library/Iq-how-to-talk-to-users" },
      { title: "First Round - The Power of Customer Interviews", url: "https://review.firstround.com/the-power-of-interviewing-customers-the-right-way-from-twitters-ex-vp-product" },
    ],
    attribution: "Y Combinator, First Round",
    topics: ["User Research", "Validation", "Discovery"]
  },
  {
    title: "Product Strategy",
    icon: Lightbulb,
    color: "bg-amber-400",
    description: "Build products customers love by understanding market needs, user feedback, and iterative development cycles.",
    links: [
      { title: "Y Combinator - Guide to Building Product", url: "https://www.ycombinator.com/library/5z-a-guide-to-building-product" },
      { title: "First Round - The Right Way to Ship Software", url: "https://review.firstround.com/the-right-way-to-ship-software" },
      { title: "Basecamp - Shape Up (Free Book)", url: "https://basecamp.com/shapeup" }
    ],
    attribution: "Y Combinator, First Round, Basecamp",
    topics: ["User Research", "Iteration", "Product-Market Fit"]
  },
  {
    title: "Go-to-Market Strategy",
    icon: Rocket,
    color: "bg-pink-400",
    description: "Launch your product effectively with a strategic go-to-market plan covering positioning, channels, and product-market fit.",
    links: [
      { title: "First Round - Go-to-Market Fit Framework", url: "https://review.firstround.com/forget-product-market-fit-focus-on-go-to-market-fit" },
      { title: "Y Combinator - Launch Strategy", url: "https://www.ycombinator.com/library/4D-a-guide-to-launching-on-product-hunt-hacker-news-and-reddit" }
    ],
    attribution: "First Round, Y Combinator",
    topics: ["Launch Planning", "Positioning", "Market Fit"]
  },
  {
    title: "Pricing Strategy",
    icon: DollarSign,
    color: "bg-orange-400",
    description: "Find the right pricing model, test pricing strategies, and optimize for revenue growth while maximizing customer value.",
    links: [
      { title: "Y Combinator - Pricing Guide", url: "https://www.ycombinator.com/library/6h-startup-pricing-101" },
      { title: "First Round - Pricing Framework", url: "https://review.firstround.com/the-price-is-right-essential-tips-for-nailing-your-pricing-strategy" },
      { title: "ProfitWell - Pricing Strategy Guide", url: "https://www.profitwell.com/recur/all/pricing-strategy-guide" }
    ],
    attribution: "Y Combinator, First Round, ProfitWell",
    topics: ["Monetization", "Revenue", "Unit Economics"]
  },
  {
    title: "Customer Acquisition",
    icon: TrendingUp,
    color: "bg-green-400",
    description: "Learn proven strategies for acquiring customers efficiently while managing unit economics and scaling growth sustainably.",
    links: [
      { title: "Y Combinator - Growth & Customer Acquisition", url: "https://www.ycombinator.com/library/6o-customer-acquisition" },
      { title: "First Round - Growth Tactics from Facebook & Twitter", url: "https://review.firstround.com/indispensable-growth-frameworks-from-my-years-at-facebook-twitter-and-wealthfront" },
      { title: "Traction Book", url: "https://www.tractionbook.com" }
    ],
    attribution: "Y Combinator, First Round, Traction Book",
    topics: ["CAC", "Growth Hacking", "Unit Economics"]
  },
  {
    title: "Customer Success & Retention",
    icon: Heart,
    color: "bg-red-400",
    description: "Keep customers happy and reduce churn by building exceptional support, engaging users, and continuously improving the product.",
    links: [
      { title: "Y Combinator - Retention is King", url: "https://www.ycombinator.com/library/5r-retention-is-king" },
      { title: "First Round - How Superhuman Built Product-Market Fit", url: "https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit" }
    ],
    attribution: "Y Combinator, First Round",
    topics: ["Churn", "Support", "Loyalty"]
  },
  {
    title: "Measuring What Matters",
    icon: BarChart3,
    color: "bg-cyan-400",
    description: "Define and track the metrics that drive your business using OKRs, performance dashboards, and data-driven decision-making.",
    links: [
      { title: "Y Combinator - Metrics & Analytics Guide", url: "https://www.ycombinator.com/library/5z-a-guide-to-metrics" },
      { title: "First Round - Measuring Product-Market Fit", url: "https://review.firstround.com/how-to-measure-product-market-fit" },
      { title: "What Matters - OKR Framework", url: "https://www.whatmatters.com/get-started" }
    ],
    attribution: "Y Combinator, First Round, What Matters",
    topics: ["OKRs", "Key Metrics", "Analytics"]
  },
  {
    title: "Hiring Your First Team",
    icon: Users,
    color: "bg-violet-400",
    description: "Build a strong founding team by recruiting talent, setting clear expectations, structuring equity, and creating shared vision.",
    links: [
      { title: "Y Combinator - How to Hire", url: "https://www.ycombinator.com/library/6m-how-to-hire" },
      { title: "First Round - Technical Interviewing from Amazon VP", url: "https://review.firstround.com/the-anatomy-of-the-perfect-technical-interview-from-a-former-amazon-vp" },
      { title: "Stripe Atlas - Equity Guide", url: "https://stripe.com/atlas/guides/equity" }
    ],
    attribution: "Y Combinator, First Round, Stripe",
    topics: ["Recruiting", "Culture", "Equity"]
  },
  {
    title: "Building Company Culture",
    icon: Briefcase,
    color: "bg-teal-400",
    description: "Create a values-driven culture that attracts talent, improves productivity, builds trust, and defines your company's identity.",
    links: [
      { title: "Y Combinator - Culture Building Guide", url: "https://www.ycombinator.com/library/5s-building-culture" },
      { title: "First Round - Finding Your Company's Aspiration", url: "https://review.firstround.com/the-best-startups-resonate-with-aspiration-heres-how-to-find-yours" },
      { title: "Netflix Culture Deck", url: "https://jobs.netflix.com/culture" }
    ],
    attribution: "Y Combinator, First Round, Netflix",
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

              {/* Footer with multiple links */}
              <div className="p-6 mt-auto">
                <p className="text-xs text-white/50 font-medium mb-3 uppercase tracking-wider">Recommended Resources</p>
                <div className="space-y-2">
                  {guide.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors group"
                    >
                      <span className="flex-1 truncate group-hover:underline">{link.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
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
