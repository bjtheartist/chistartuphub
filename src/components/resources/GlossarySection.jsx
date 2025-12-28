import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const glossarySections = [
  {
    stage: "Business Legal Structures",
    subtitle: "Understanding the foundational legal frameworks for your startup",
    color: "bg-blue-400",
    icon: "B",
    definitions: [
      { term: "Sole Proprietorship", definition: "An unincorporated business owned by one individual. Easiest and least expensive to set up with minimal paperwork. However, there is no legal distinction between owner and business, meaning unlimited personal liability for business debts and obligations." },
      { term: "LLC (Limited Liability Company)", definition: "A hybrid legal entity offering liability protection like a corporation, but simpler operation. Pros: Limited personal liability, flexible taxation (pass-through or corporate), less complex than C-Corp. Cons: More expensive than sole proprietorship, some states have annual fees, potential for self-employment taxes." },
      { term: "C-Corp (C Corporation)", definition: "Standard corporation structure offering the strongest liability protection. It's a separate legal entity with unlimited shareholders. Most venture-backed startups are C-Corps. Subject to double taxation (corporate profits are taxed, then dividends are taxed again at individual level). Pros: Unlimited growth potential, can issue stock options, preferred by VCs. Cons: More complex compliance and reporting requirements, double taxation." },
      { term: "S-Corp (S Corporation)", definition: "An elective tax status (not a legal entity type) that passes income/losses directly to owners' personal income without corporate tax rates. Avoids double taxation. Pros: Pass-through taxation, limited liability. Cons: Stricter ownership rules (max 100 shareholders, all must be U.S. citizens/residents), not venture-fundable, no stock option flexibility." },
      { term: "Delaware C-Corp", definition: "Most venture-backed startups incorporate as Delaware C-Corps due to well-established corporate law, business-friendly courts, and investor familiarity. Even if your startup is in Chicago, you can incorporate in Delaware (though you'll need to register as a 'foreign entity' in Illinois if doing business there)." },
    ],
  },
  {
    stage: "Stage 1: Idea → Validation",
    subtitle: "Finding real evidence that you're solving a real problem for a specific group",
    color: "bg-purple-400",
    icon: "S",
    definitions: [
      { term: "Problem–Solution Fit", definition: "The first step. This is the evidence—from interviews and experiments—that a specific customer group agrees you are solving a painful, real-world problem for them." },
      { term: "ICP (Ideal Customer Profile)", definition: "A clear, specific description of the exact person or company that gets the most value from your solution and is easiest to sell to. At this stage, your ICP is a hypothesis you are testing." },
      { term: "Value Proposition", definition: "A short, clear statement on why your ideal customer should choose your solution. What is the specific value you promise to deliver?" },
      { term: "Bias Toward Action", definition: "The habit of running small, fast experiments (like interviews or a simple landing page) to get real-world answers instead of just debating theory." },
    ],
  },
  {
    stage: "Stage 2: Create → Refine",
    subtitle: "Building the solution (MVP) and looking for proof that people will actually use it",
    color: "bg-green-400",
    icon: "S",
    definitions: [
      { term: "Product/Market Fit (PMF)", definition: "The magic moment when you've built a product that a large group of people actively uses and would be very disappointed to lose. The market is pulling the product from you, not you pushing it on them." },
      { term: "Activation", definition: "The 'Aha!' moment. This is the first time a new user experiences the core value you promised. For a music app, it's not signing up; it's successfully playing their first song." },
      { term: "Retention Curve", definition: "A chart showing what percentage of your users (by start date) are still active over time. A curve that 'flattens' (doesn't go to zero) proves your product has durable, long-term value." },
      { term: "Growth Loop", definition: "A system where your own users create the 'fuel' for new growth. For example, a user shares a link (Referral), which brings in a new user (Acquisition), who then shares, starting the loop over." },
    ],
  },
  {
    stage: "Stage 3: Go-to-Market → Traction",
    subtitle: "Building a repeatable system for finding and keeping customers",
    color: "bg-yellow-400",
    icon: "S",
    definitions: [
      { term: "Positioning", definition: "Defining what 'box' your product fits in and how it's different from the competition, all in a way your Ideal Customer Profile (ICP) understands and cares about." },
      { term: "CAC (Customer Acquisition Cost)", definition: "The total amount you spend on sales and marketing (including salaries) to get one new paying customer." },
      { term: "LTV (or CLV)", definition: "'Lifetime Value.' The total profit you expect to make from an average customer over the entire time they stay with you." },
      { term: "CAC Payback", definition: "The number of months it takes for the profit from a new customer to 'pay back' the CAC you spent to get them. A healthy business has a short payback period (e.g., under 12 months)." },
    ],
  },
  {
    stage: "Stage 4: Fund → Scale",
    subtitle: "Fuel (capital) and efficiency to grow bigger, faster, and more sustainably",
    color: "bg-orange-400",
    icon: "S",
    definitions: [
      { term: "ARR / MRR", definition: "'Annual' or 'Monthly Recurring Revenue.' The standard, normalized way to measure the predictable revenue of a subscription business." },
      { term: "Gross Margin", definition: "The percentage of money left over from a sale after you subtract the direct costs of making/delivering the product (like server costs or raw materials)." },
      { term: "Runway", definition: "The number of months your company can stay in business before you run out of cash, based on your current spending rate (your 'burn')." },
      { term: "Cap Table", definition: "The official spreadsheet that lists every single owner (founders, investors, employees) of your company and what percentage they own." },
      { term: "Vesting & Cliff", definition: "The schedule for 'earning' stock options. A 1-year cliff means you get 0% of your options if you leave before one year. Vesting is the process of earning the rest in small pieces over time (e.g., 4 years)." },
    ],
  },
  {
    stage: "Legal & Compliance",
    subtitle: "Critical legal concepts throughout your journey",
    color: "bg-pink-400",
    icon: "L",
    definitions: [
      { term: "Trademark Search (USPTO TESS)", definition: "Checking the official government database to make sure your company or product name isn't already legally claimed by someone else. You do this before you spend money on branding." },
      { term: "83(b) Election", definition: "A critical, time-sensitive (30 days!) tax form. When you are granted founder stock (at a very low value), you file this to pay taxes on that low value now, so you don't pay massive taxes on its (hopefully huge) value later." },
      { term: "HIPAA", definition: "U.S. health data privacy & security standards. Absolutely mandatory if you handle healthcare data." },
      { term: "GDPR", definition: "EU personal-data regulation. Mandatory if you have European customers." },
    ],
  },
];

export default function GlossarySection() {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (stage) => {
    setExpandedSection(expandedSection === stage ? null : stage);
  };

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
          <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-orange-500/50 to-transparent" />
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Glossary</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">Startup Terms Decoded</h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          The language of fundraising and growth, decoded
        </p>
      </motion.div>

      <div className="space-y-4">
        {glossarySections.map((section, index) => (
          <motion.div
            key={section.stage}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-xl overflow-hidden transition-all"
          >
            <button
              onClick={() => toggleSection(section.stage)}
              className="w-full p-4 border-b border-white/[0.08] flex items-center justify-between hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${section.color} border border-white/10 rounded-lg flex items-center justify-center font-bold text-xl`}>
                  {section.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">{section.stage}</h3>
                  <p className="text-xs text-white/50">{section.subtitle}</p>
                </div>
              </div>
              <ChevronDown className={`w-6 h-6 text-white/40 transition-transform ${expandedSection === section.stage ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {expandedSection === section.stage && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {section.definitions.map((def) => (
                      <div key={def.term} className="border-l-2 border-white/20 pl-4">
                        <h4 className="font-semibold text-white text-base mb-1">{def.term}</h4>
                        <p className="text-sm text-white/60 leading-relaxed">{def.definition}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}