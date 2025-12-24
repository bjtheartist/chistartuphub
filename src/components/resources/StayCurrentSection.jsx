import React from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const stayCurrentResources = [
  {
    category: "Founder Podcasts",
    color: "bg-purple-400",
    icon: "🎙",
    items: [
      { name: "Lenny's Podcast", desc: "Conversations with leaders and founders building companies", link: "https://www.lennyspodcast.com/" },
      { name: "20VC (20 Minute VC)", desc: "Interviews with founders, investors, and operators", link: "https://www.thetwentymincvc.com/" },
      { name: "My First Million", desc: "Entrepreneurship, business ideas, and startup lessons", link: "https://myfirstmillion.com/" },
      { name: "Founded", desc: "Stories of iconic company founders and their journeys", link: "https://www.foundedbyvcs.com/" },
      { name: "The Full Ratchet", desc: "Venture capital, fundraising, and startup insights", link: "https://www.fullratchet.net/" },
      { name: "Y Combinator Podcast", desc: "Founders and experts discussing building companies", link: "https://www.ycombinator.com/podcast" },
    ],
  },
  {
    category: "Newsletters",
    color: "bg-blue-400",
    icon: "📧",
    items: [
      { name: "Ben's Bites", desc: "Daily AI news and trends in artificial intelligence", link: "https://www.bensbites.co/" },
      { name: "The Diff", desc: "Curated analysis of technology and business trends", link: "https://diff.substack.com/" },
      { name: "The Gradient", desc: "Deep dives into AI research and applications", link: "https://thegradient.pub/" },
      { name: "Founder's Journal", desc: "Lessons and insights for founders building companies", link: "https://www.foundersjournal.co/" },
    ],
  },
  {
    category: "AI & Tools Directory",
    color: "bg-cyan-400",
    icon: "🛠",
    items: [
      { name: "Future Tools", desc: "Curated directory of AI tools and software for productivity", link: "https://www.futuretools.io/" },
      { name: "There's an AI", desc: "Comprehensive AI tools directory organized by category", link: "https://theresanai.com/" },
      { name: "Product Hunt", desc: "Discover and discuss new tech products and tools", link: "https://www.producthunt.com/" },
      { name: "AngelList", desc: "Jobs, investments, and insights in the startup world", link: "https://www.angellist.com/" },
    ],
  },
  {
    category: "YouTube & Video",
    color: "bg-red-400",
    icon: "📺",
    items: [
      { name: "Ali Abdaal", desc: "Productivity, entrepreneurship, and tech insights", link: "https://www.youtube.com/@AliAbdaal" },
      { name: "Y Combinator", desc: "Startup advice, founder interviews, and lessons", link: "https://www.youtube.com/@ycombinator" },
      { name: "Shark Tank", desc: "Real-world pitching and investment decisions", link: "https://www.abc.com/shows/shark-tank" },
    ],
  },
  {
    category: "Chicago Ecosystem",
    color: "bg-orange-400",
    icon: "🏙",
    items: [
      { name: "Built In Chicago", desc: "Jobs, news, and resources for the Chicago tech community", link: "https://www.builtinchicago.org/" },
      { name: "Technori", desc: "News, events, and connections for Chicago startups", link: "https://technori.com/" },
      { name: "Chicago:Blend", desc: "Diversity and inclusion resources for Chicago founders", link: "https://chicagoblend.org/" },
    ],
  },
];

export default function StayCurrentSection() {
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
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Stay Current</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">
          Stay Current with Innovation
        </h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          Podcasts, newsletters, and communities to keep up with the latest trends, tools, and insights in the startup ecosystem
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stayCurrentResources.map((category, index) => (
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
