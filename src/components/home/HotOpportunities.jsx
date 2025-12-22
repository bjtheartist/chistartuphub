import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Flame, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";

export default function HotOpportunities() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hot-opportunities-count'],
    queryFn: async () => {
      const all = await entities.FundingOpportunity.list('-created_date');
      const now = new Date();

      // Count opportunities with deadlines in the next 60 days
      const timeSensitive = all.filter(opp => {
        if (opp.deadline) {
          const deadline = new Date(opp.deadline);
          const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          return daysUntil > 0 && daysUntil <= 60;
        }
        return false;
      });

      // Count urgent (within 14 days)
      const urgent = timeSensitive.filter(opp => {
        const deadline = new Date(opp.deadline);
        const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return daysUntil <= 14;
      });

      return {
        total: timeSensitive.length,
        urgent: urgent.length
      };
    },
    initialData: { total: 0, urgent: 0 },
  });

  if (isLoading || stats.total === 0) return null;

  return (
    <section className="py-6 px-4 md:px-6 relative z-20">
      <div className="max-w-7xl mx-auto">
        <Link to={`${createPageUrl("Funding")}?tab=opportunities`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-orange-500/40 bg-[#1a0a00] hover:border-orange-400/60 transition-all duration-300 group cursor-pointer shadow-xl shadow-orange-950/30"
          >
            {/* Solid gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-[#1a0805] to-red-950/80" />

            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
                               radial-gradient(circle at 80% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)`
            }} />

            {/* Animated glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Pulsing notification dot */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            </div>

            <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
              {/* Left side - Icon and text */}
              <div className="flex items-center gap-4 md:gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30 ring-2 ring-orange-500/20">
                    <Bell className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  {/* Notification badge */}
                  <div className="absolute -top-2 -right-2 min-w-[26px] h-[26px] px-1.5 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center border-2 border-[#1a0a00] shadow-lg">
                    <span className="text-xs font-bold text-white">{stats.total}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                      {stats.total} Time-Sensitive Opportunities
                    </h3>
                  </div>
                  <p className="text-white/70 text-sm md:text-base">
                    {stats.urgent > 0 ? (
                      <>
                        <span className="text-orange-300 font-semibold">{stats.urgent} closing within 2 weeks</span>
                        <span className="text-white/50"> — Don't miss these deadlines</span>
                      </>
                    ) : (
                      "Active funding opportunities with upcoming deadlines"
                    )}
                  </p>
                </div>
              </div>

              {/* Right side - CTA */}
              <div className="flex items-center gap-3 pl-[4.5rem] md:pl-0">
                <Button
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold px-6 py-2.5 h-auto rounded-full shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-all duration-300 ring-1 ring-orange-400/20"
                >
                  View Funding
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Bottom urgency bar */}
            {stats.urgent > 0 && (
              <div className="relative bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border-t border-red-500/30 px-6 py-2.5 flex items-center gap-2">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent" />
                <Clock className="w-4 h-4 text-red-400 relative" />
                <span className="text-red-300 text-sm font-medium relative">
                  {stats.urgent} opportunit{stats.urgent === 1 ? 'y' : 'ies'} closing soon — act fast!
                </span>
              </div>
            )}
          </motion.div>
        </Link>
      </div>
    </section>
  );
}
