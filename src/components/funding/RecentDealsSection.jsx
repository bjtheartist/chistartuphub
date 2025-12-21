import React from "react";
import { TrendingUp, DollarSign, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function RecentDealsSection() {
  const majorDeals = [
    {
      company: "ElectronX",
      amount: "$30M",
      stage: "Series A",
      lead: "DCVC",
      description: "Energy trading platform building the first U.S.-regulated derivatives exchange for electricity.",
      category: "CleanTech"
    },
    {
      company: "BiomeSense",
      amount: "$7.1M",
      stage: "Seed",
      lead: "Labcorp Venture Fund",
      description: "AI-powered microbiome analytics platform for clinical diagnostics.",
      category: "HealthTech"
    },
    {
      company: "Appetronix",
      amount: "$6M",
      stage: "Seed Plus",
      lead: "AlleyCorp",
      description: "Robotic kitchen automation for high-traffic food service locations. Graduate of 1871's FoodTech Lab.",
      category: "FoodTech"
    },
    {
      company: "Switched Source",
      amount: "$2.6M",
      stage: "Strategic",
      lead: "DOE GRIP + Private",
      description: "Grid resilience technology company leveraging dual-capital strategy.",
      category: "DeepTech"
    },
    {
      company: "GrayMatter Labs",
      amount: "$1.3M",
      stage: "Seed",
      lead: "Venrex",
      description: "Consumer wellness company producing nootropic drink mixes.",
      category: "Consumer"
    }
  ];

  const fundActivity = {
    company: "CMT Digital",
    amount: "$136M",
    type: "Fund IV",
    description: "Chicago-based crypto venture firm closed its fourth venture fund, targeting early-stage blockchain infrastructure and DeFi protocols."
  };

  const maActivity = {
    company: "Duravant",
    amount: "$230M",
    target: "Matthews Automation Solutions",
    description: "Strategic consolidation in industrial automation and logistics technology, reinforcing Chicago's position in industrial tech M&A."
  };

  return (
    <div className="mt-16 space-y-12">
      {/* Section Header */}
      <div>
        <h3 className="text-3xl font-bold text-white mb-3">November 2025 Recent Deals</h3>
        <p className="text-white/60 text-lg">First half of November saw $47M in confirmed funding rounds, plus major M&A and fund activity</p>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-6 rounded-xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">8</p>
              <p className="text-white/60 text-sm">Funding Rounds</p>
            </div>
          </div>
          <p className="text-white/50 text-xs">Confirmed November deals</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card p-6 rounded-xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">$47M</p>
              <p className="text-white/60 text-sm">Total Raised</p>
            </div>
          </div>
          <p className="text-white/50 text-xs">Across all November rounds</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card p-6 rounded-xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">$3B+</p>
              <p className="text-white/60 text-sm">YTD 2025</p>
            </div>
          </div>
          <p className="text-white/50 text-xs">100+ transactions in 2025</p>
        </motion.div>
      </div>

      {/* Major Funding Rounds */}
      <div>
        <h4 className="text-2xl font-bold text-white mb-6">Major Funding Rounds</h4>
        <div className="space-y-4">
          {majorDeals.map((deal, index) => (
            <motion.div
              key={deal.company}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h5 className="text-xl font-bold text-white">{deal.company}</h5>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                      {deal.category}
                    </Badge>
                  </div>
                  <p className="text-white/70 leading-relaxed mb-3">
                    {deal.description}
                  </p>
                  <p className="text-white/50 text-sm">Led by {deal.lead}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-white">{deal.amount}</p>
                  <p className="text-white/60">{deal.stage}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fund Activity */}
      <div>
        <h4 className="text-2xl font-bold text-white mb-6">New Funds Deployed</h4>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-6 rounded-xl border border-white/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h5 className="text-xl font-bold text-white">{fundActivity.company}</h5>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                  {fundActivity.type}
                </Badge>
              </div>
              <p className="text-white/70 leading-relaxed mb-3">
                {fundActivity.description}
              </p>
              <div className="inline-block px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm">
                  <strong className="text-white">Why This Matters:</strong> Fund closes represent future deployment capacity—$136M of fresh capital ready to support Chicago's blockchain ecosystem over the next 3-5 years.
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-white">{fundActivity.amount}</p>
              <p className="text-white/60">Fund Size</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* M&A Activity */}
      <div>
        <h4 className="text-2xl font-bold text-white mb-6">Major M&A Activity</h4>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-6 rounded-xl border border-white/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h5 className="text-xl font-bold text-white mb-3">
                {maActivity.company} <span className="text-white/60 font-normal">acquires</span> {maActivity.target}
              </h5>
              <p className="text-white/70 leading-relaxed">
                {maActivity.description}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-white">{maActivity.amount}</p>
              <p className="text-white/60">Acquisition</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}