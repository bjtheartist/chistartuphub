import React from "react";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function DataSourcesSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="mt-20 glass-card p-8 rounded-2xl border border-white/10"
    >
      <div className="flex items-start gap-4 mb-6">
        <AlertCircle className="w-6 h-6 text-white/60 flex-shrink-0 mt-1" />
        <div>
          <h4 className="text-lg font-bold text-white mb-3">About This Data</h4>
          <p className="text-white/70 leading-relaxed mb-4">
            This page curates publicly reported funding data to provide a clear view of Chicago's venture ecosystem. Please note that this data is not exhaustive; not all deals are publicly announced, and some are reported with significant delays (e.g., SEC filing windows). This resource is intended to be a helpful guide, but it may not capture every transaction.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h5 className="text-white font-semibold mb-4">Data Sources</h5>
        <p className="text-white/50 text-sm mb-4">Updated 11/17/2025</p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">Growth List</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">SEC Form D</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">Built In Chicago</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">Crain's Chicago Business</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">Chicago Business Journal</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">PR Newswire</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">Yahoo Finance</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">X.com</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white/5">
            <span className="text-white/80">LinkedIn</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h5 className="text-white font-semibold mb-3">Recent Citations</h5>
          <div className="space-y-2 text-white/60 text-xs">
            <p>[1] Duravant to Acquire Matthews Automation Solutions. (November 13, 2025). Built In Chicago.</p>
            <p>[2] Energy Exchange ElectronX Raises $30M Series A Round. (November 14, 2025). PR Newswire.</p>
            <p>[3] GrayMatter Labs Raises $1.3 Million Seed Round. (November 6, 2025). Traded.</p>
            <p>[4] SEC Form D Filing for BiomeSense, Inc. (November 3, 2025).</p>
            <p>[5] SEC Form D Filing for Switched Source, LLC. (November 2025).</p>
            <p>[6] SEC Form D Filing for MODE MOBILE, LLC. (November 2025).</p>
            <p>[7] SEC Form D Filing for hostU, Inc. (November 2025).</p>
            <p>[8] Appetronix raises $10m to scale robotic kitchens for high-traffic sites. (November 7, 2025). Yahoo Finance.</p>
            <p>[9] CMT Digital Closes $136M Fund Four. (November 5-6, 2025). PR Newswire.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}