import React from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const learningResources = [
  {
    category: "Educational",
    color: "bg-pink-400",
    icon: "E",
    items: [
      { name: "Y Combinator Startup School", desc: "Free online course covering the fundamentals of starting a company", link: "https://www.startupschool.org/" },
      { name: "How to Start a Startup (Stanford)", desc: "Free video series from Stanford featuring successful founders", link: "https://startupclass.samaltman.com/" },
      { name: "Coursera - Machine Learning", desc: "Andrew Ng's famous course on machine learning fundamentals", link: "https://www.coursera.org/learn/machine-learning" },
      { name: "The Mom Test", desc: "Learn how to talk to customers and validate your business idea", link: "http://momtestbook.com/" },
    ],
  },
  {
    category: "Thought Leadership",
    color: "bg-teal-400",
    icon: "T",
    items: [
      { name: "Paul Graham Essays", desc: "Influential essays on startups, technology, and entrepreneurship", link: "http://www.paulgraham.com/articles.html" },
      { name: "First Round Review", desc: "In-depth articles and advice covering every aspect of building startups", link: "https://review.firstround.com/" },
      { name: "NFX Growth Handbook", desc: "Tactical advice on growth strategies and network effects", link: "https://www.nfx.com/growth-handbook" },
      { name: "Stripe Atlas Guides", desc: "Comprehensive guides on incorporating, fundraising, and growing", link: "https://stripe.com/guides" },
    ],
  },
  {
    category: "Fundraising",
    color: "bg-indigo-400",
    icon: "F",
    items: [
      { name: "NFX Signal - Investor Database", desc: "Comprehensive database to find aligned investors for your startup", link: "https://signal.nfx.com/investors" },
      { name: "Venture Deals by Brad Feld", desc: "Essential reading for understanding venture capital and term sheets", link: "https://www.feld.com/archives/2011/07/announcing-venture-deals.html" },
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
          <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-green-500/50 to-transparent" />
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Learning Resources</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">Essential Reading & Courses</h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          Curated courses, articles, and thought leadership to accelerate your startup journey
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {learningResources.map((category, index) => (
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