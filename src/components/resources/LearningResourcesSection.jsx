import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const knowledgeBase = [
  {
    category: "Founder Voices (Podcasts)",
    color: "bg-purple-400",
    icon: "🎙",
    items: [
      { name: "Lenny's Podcast", desc: "In-depth conversations with founders and leaders building innovative companies", link: "https://www.lennysnewsletter.com/podcast" },
      { name: "20VC (The Twenty Minute VC)", desc: "Interviews with top founders, investors, and operators on building billion-dollar companies", link: "https://www.thetwentyminutevc.com/" },
      { name: "Acquired", desc: "Deep dives into the strategies, stories, and lessons from iconic acquisitions and companies", link: "https://www.acquired.fm/" },
    ],
  },
  {
    category: "Market Briefs (Newsletters/Articles)",
    color: "bg-blue-400",
    icon: "📧",
    items: [
      { name: "Ben's Bites", desc: "Daily curated AI news, trends, and insights from the forefront of artificial intelligence", link: "https://bensbites.co/" },
      { name: "The Diff", desc: "Strategic analysis of technology trends and their business implications", link: "https://thediff.co/" },
      { name: "Founder's Journal", desc: "Practical lessons, frameworks, and wisdom from experienced founders and operators", link: "https://podcasts.apple.com/us/podcast/founders-journal/id1509276485" },
      { name: "Paul Graham Essays", desc: "Influential essays on startups, entrepreneurship, and the technology landscape", link: "http://paulgraham.com/articles.html" },
    ],
  },
  {
    category: "Chicago Tech News",
    color: "bg-orange-400",
    icon: "🏙",
    items: [
      { name: "Built In Chicago", desc: "Jobs, news, and resources for the Chicago tech and startup community", link: "https://www.builtinchicago.org/" },
      { name: "Technori", desc: "Chicago startup news, events, and connections for founders and entrepreneurs", link: "https://technori.com/" },
      { name: "Chicago Innovation", desc: "Driving innovation and economic growth across Chicago's startup and technology ecosystem", link: "https://chicagoinnovation.com/" },
      { name: "Chicago Business Journal", desc: "Business news, insights, and events covering Chicago's entrepreneurial and corporate landscape", link: "https://www.bizjournals.com/chicago" },
    ],
  },
];

export default function LearningResourcesSection() {
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
          <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-purple-500/50 to-transparent" />
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Knowledge Base</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">Stay Informed & Connected</h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          Founder voices, market insights, and Chicago community resources to stay current on trends and connect with the startup ecosystem
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {knowledgeBase.map((category, index) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all overflow-hidden"
          >
            <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
              <div className={`w-12 h-12 ${category.color} border border-white/10 rounded-lg flex items-center justify-center font-bold text-xl`}>
                {category.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{category.category}</h3>
            </div>
            <div className="p-4 space-y-2">
              {category.items.map((item) => (
                <a
                  key={item.name}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-l-2 border-white/20 pl-3 hover:bg-white/[0.04] hover:border-blue-400/50 py-2 rounded-r transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-white text-sm group-hover:text-blue-300 transition-colors">{item.name}</h4>
                      <p className="text-xs text-white/50">{item.desc}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 mt-1 text-white/30 group-hover:text-blue-400 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}