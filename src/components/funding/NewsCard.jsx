import React from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function NewsCard({ newsItem, index }) {
  return (
    <motion.a
      href={newsItem.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ scale: 1.01 }}
      className="glass-card p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 block"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h5 className="text-xl font-bold text-white">{newsItem.company_or_fund}</h5>
            {newsItem.industry && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                {newsItem.industry}
              </Badge>
            )}
          </div>
          <p className="text-white/70 leading-relaxed mb-3">
            {newsItem.description}
          </p>
          {(newsItem.stage || newsItem.location || newsItem.date) && (
            <p className="text-white/50 text-sm">
              {newsItem.stage && `Led by ${newsItem.stage}`}
              {newsItem.location && ` • ${newsItem.location}`}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-white">{newsItem.amount}</p>
          {newsItem.stage && (
            <p className="text-white/60">{newsItem.stage}</p>
          )}
        </div>
      </div>
    </motion.a>
  );
}