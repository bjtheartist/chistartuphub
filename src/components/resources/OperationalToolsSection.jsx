import React from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const operationalTools = [
  {
    category: "Business Formation",
    color: "bg-blue-400",
    icon: "B",
    items: [
      { name: "Stripe Atlas", desc: "Incorporate a Delaware C-corp and open a business bank account", link: "https://stripe.com/atlas" },
      { name: "Illinois Secretary of State", desc: "Official portal for registering your business in Illinois", link: "https://www.ilsos.gov" },
      { name: "Chicago BACP", desc: "City-level business licenses and permits", link: "https://www.chicago.gov/bacp" },
      { name: "SBA Chicago District Office", desc: "Small Business Administration resources", link: "https://www.sba.gov/offices/district/il/chicago" },
      { name: "SCORE Chicago", desc: "Free mentoring and workshops", link: "https://chicago.score.org" },
      { name: "Illinois SBDC", desc: "Free business consulting and training", link: "https://www.ilsbdc.biz" },
    ],
  },
  {
    category: "Legal & Compliance",
    color: "bg-purple-400",
    icon: "L",
    items: [
      { name: "Clerky", desc: "Incorporation, equity management, and legal documents for startups", link: "https://www.clerky.com" },
      { name: "Cooley GO", desc: "Free legal documents for startups", link: "https://www.cooleygo.com" },
      { name: "Orrick Startup Forms", desc: "Free startup legal document library", link: "https://www.orrick.com/en/Total-Access/Tool-Kit" },
      { name: "SAFE Agreements (YC)", desc: "Simple Agreement for Future Equity", link: "https://www.ycombinator.com/documents" },
      { name: "Termsfeed", desc: "Privacy policy and terms generators", link: "https://www.termsfeed.com" },
    ],
  },
  {
    category: "Finance & Accounting",
    color: "bg-green-400",
    icon: "F",
    items: [
      { name: "Pilot", desc: "Bookkeeping, tax prep, and CFO services for startups", link: "https://pilot.com" },
      { name: "QuickBooks", desc: "Accounting software for small businesses and startups", link: "https://quickbooks.intuit.com" },
      { name: "Bench", desc: "Online bookkeeping service", link: "https://bench.co" },
      { name: "Brex", desc: "Corporate cards and expense management", link: "https://www.brex.com" },
      { name: "Mercury", desc: "Banking built for startups", link: "https://mercury.com" },
      { name: "Stripe", desc: "Payment processing infrastructure", link: "https://stripe.com" },
    ],
  },
  {
    category: "HR & People Ops",
    color: "bg-yellow-400",
    icon: "H",
    items: [
      { name: "Gusto", desc: "Payroll, benefits, and HR management platform", link: "https://gusto.com" },
      { name: "Rippling", desc: "All-in-one HR, IT, and Finance platform", link: "https://www.rippling.com" },
      { name: "Justworks", desc: "All-in-one HR and payroll", link: "https://justworks.com" },
      { name: "Lever", desc: "Applicant tracking software", link: "https://www.lever.co" },
      { name: "Greenhouse", desc: "Hiring and onboarding platform", link: "https://www.greenhouse.io" },
      { name: "Lattice", desc: "Performance management", link: "https://lattice.com" },
    ],
  },
  {
    category: "Operations & Productivity",
    color: "bg-orange-400",
    icon: "O",
    items: [
      { name: "Notion", desc: "All-in-one workspace for notes, docs, projects, and wikis", link: "https://www.notion.so" },
      { name: "Slack", desc: "Team communication and collaboration platform", link: "https://slack.com" },
      { name: "Airtable", desc: "Spreadsheet-database hybrid", link: "https://airtable.com" },
      { name: "Zapier", desc: "Automate workflows between your apps and services without coding", link: "https://zapier.com" },
      { name: "Asana", desc: "Project management", link: "https://asana.com" },
      { name: "Linear", desc: "Issue tracking for software teams", link: "https://linear.app" },
    ],
  },
];

export default function OperationalToolsSection() {
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
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Operational Tools</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">Chicago-Specific Resources</h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          Illinois compliance, local legal guides, and essential tools—your unfair advantage over generic startup advice
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operationalTools.map((category, index) => (
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