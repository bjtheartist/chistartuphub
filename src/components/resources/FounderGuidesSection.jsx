import { FileText, TrendingUp, Lightbulb, Rocket, Users, BarChart3, DollarSign, Briefcase, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const corePillars = [
  {
    title: "Storytelling & Design",
    icon: FileText,
    color: "bg-blue-400",
    description: "Master the art of communicating your vision through clear storytelling and compelling design that resonates with investors.",
    links: [
      { title: "Sequoia Capital - Writing a Business Plan", url: "https://www.sequoiacap.com/article/writing-a-business-plan/" },
      { title: "Y Combinator - How to Build a Pitch Deck", url: "https://www.ycombinator.com/library/2u-how-to-build-a-pitch-deck" },
      { title: "Slidebean - Pitch Deck Examples", url: "https://slidebean.com/blog/startups-pitch-deck-presentation-complete-guide" }
    ],
    attribution: "Sequoia Capital, Y Combinator, Slidebean",
    topics: ["Communication", "Design", "Presentation"]
  },
  {
    title: "The Art of the Pitch",
    icon: FileText,
    color: "bg-indigo-400",
    description: "Perfect your pitch delivery—learn to present confidently, answer tough questions, and persuade investors through storytelling.",
    links: [
      { title: "Y Combinator - How to Pitch Your Startup", url: "https://www.ycombinator.com/library/4D-how-to-pitch-your-startup" },
      { title: "First Round Review - Master the Art of Influence", url: "https://review.firstround.com/master-the-art-of-influence-persuasion-as-a-skill-and-habit/" }
    ],
    attribution: "Y Combinator, First Round Review",
    topics: ["Pitching", "Persuasion", "Communication"]
  },
  {
    title: "Fundraising Strategy",
    icon: TrendingUp,
    color: "bg-purple-400",
    description: "Navigate the fundraising landscape—from identifying the right investors to closing your round with optimal terms.",
    links: [
      { title: "Y Combinator - A Guide to Seed Fundraising", url: "https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising" },
      { title: "First Round Review - The Fundraising Wisdom of 30 Founders", url: "https://review.firstround.com/the-fundraising-wisdom-that-helped-our-founders-raise-18b-in-follow-on-capital/" },
      { title: "NFX - The Non-Obvious Guide to Fundraising", url: "https://www.nfx.com/post/fundraising-guide" }
    ],
    attribution: "Y Combinator, First Round Review, NFX",
    topics: ["Fundraising", "Investor Relations", "Term Sheets"]
  },
  {
    title: "Customer Discovery",
    icon: Users,
    color: "bg-rose-400",
    description: "Learn how to conduct meaningful customer conversations, validate your assumptions, and uncover real market needs.",
    links: [
      { title: "Rob Fitzpatrick (The Mom Test) - Workshop Video", url: "https://www.youtube.com/watch?v=_tl0vcJpbf8" },
      { title: "Y Combinator - How to Talk to Users", url: "https://www.ycombinator.com/library/Iq-how-to-talk-to-users" }
    ],
    attribution: "Rob Fitzpatrick, Y Combinator",
    topics: ["User Research", "Validation", "Customer Interviews"]
  },
  {
    title: "Product Development",
    icon: Lightbulb,
    color: "bg-amber-400",
    description: "Build products that users love by mastering product strategy, iterative development, and achieving product-market fit.",
    links: [
      { title: "First Round Review - The Superhuman Product/Market Fit Engine", url: "https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit/" },
      { title: "Basecamp - Shape Up (Free Book)", url: "https://basecamp.com/shapeup" }
    ],
    attribution: "First Round Review, Basecamp",
    topics: ["Product Strategy", "Iteration", "Market Fit"]
  },
  {
    title: "Go-to-Market (GTM)",
    icon: Rocket,
    color: "bg-pink-400",
    description: "Launch your product strategically with a proven go-to-market plan that drives early adoption and sustainable growth.",
    links: [
      { title: "First Round Review - The Go-to-Market Fit Framework", url: "https://review.firstround.com/the-founder-s-guide-to-generating-demand-the-go-to-market-fit-framework/" },
      { title: "Y Combinator - Startup Launch List", url: "https://www.ycombinator.com/launch" }
    ],
    attribution: "First Round Review, Y Combinator",
    topics: ["Launch", "Positioning", "Market Entry"]
  },
  {
    title: "Monetization & Pricing",
    icon: DollarSign,
    color: "bg-orange-400",
    description: "Develop a winning pricing strategy that maximizes revenue while delivering customer value in your market.",
    links: [
      { title: "Paddle - SaaS Pricing Strategy Guide", url: "https://www.paddle.com/resources/saas-pricing-models" },
      { title: "Y Combinator - Pricing Guide", url: "https://www.ycombinator.com/library/5x-pricing" }
    ],
    attribution: "Paddle, Y Combinator",
    topics: ["Pricing", "Revenue", "Unit Economics"]
  },
  {
    title: "Growth & Acquisition",
    icon: TrendingUp,
    color: "bg-green-400",
    description: "Master proven growth tactics and customer acquisition strategies that scale sustainably while managing unit economics.",
    links: [
      { title: "Growth Unhinged - The Emerging Startup Playbook", url: "https://www.growthunhinged.com/p/the-emerging-startup-playbook" },
      { title: "First Round Review - Growth Tactics (Facebook/Twitter/Wealthfront)", url: "https://review.firstround.com/indispensable-growth-frameworks-from-my-years-at-facebook-twitter-and-wealthfront/" }
    ],
    attribution: "Growth Unhinged, First Round Review",
    topics: ["Growth", "CAC", "Scaling"]
  },
  {
    title: "Metrics & Analytics",
    icon: BarChart3,
    color: "bg-cyan-400",
    description: "Track the metrics that matter most—learn how to measure growth, define KPIs, and make data-driven decisions.",
    links: [
      { title: "a16z - 16 Metrics for Growth", url: "https://a16z.com/16-metrics-guide/" },
      { title: "a16z - Guide to Growth Metrics", url: "https://a16z.com/introducing-a16z-growths-guide-to-growth-metrics/" }
    ],
    attribution: "Andreessen Horowitz",
    topics: ["Metrics", "Analytics", "KPIs"]
  },
  {
    title: "Team & Talent",
    icon: Users,
    color: "bg-violet-400",
    description: "Build a world-class founding team by recruiting top talent, structuring equity fairly, and fostering collaboration.",
    links: [
      { title: "Y Combinator - How to Set Up, Hire, and Scale a Growth Strategy and Team", url: "https://www.ycombinator.com/library/59-how-to-set-up-hire-and-scale-a-growth-strategy-and-team" },
      { title: "Holloway - The Guide to Equity Compensation", url: "https://www.holloway.com/g/equity-compensation" }
    ],
    attribution: "Y Combinator, Holloway",
    topics: ["Hiring", "Equity", "Team Building"]
  },
  {
    title: "Culture & Values",
    icon: Briefcase,
    color: "bg-teal-400",
    description: "Create a strong company culture that attracts talent, improves retention, and aligns your team around shared values.",
    links: [
      { title: "Netflix - Culture Deck", url: "https://jobs.netflix.com/culture" },
      { title: "First Round Review - Give Away Your Legos", url: "https://review.firstround.com/give-away-your-legos-and-other-commandments-for-scaling-startups/" }
    ],
    attribution: "Netflix, First Round Review",
    topics: ["Culture", "Values", "Team Dynamics"]
  },
];

export default function FounderGuidesSection({ searchQuery = "" }) {
  // Filter guides based on search query
  const filteredGuides = searchQuery.trim() === ""
    ? corePillars
    : corePillars.filter((guide) => {
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
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Core Pillars</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">
          Build Your Foundation
        </h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          Master the essential pillars of startup success—from communicating your vision and fundraising strategy to building products customers love
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
