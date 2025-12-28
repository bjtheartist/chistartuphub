import React from "react";
import { motion } from "framer-motion";

/**
 * Standardized Page Hero Component
 * Used for all inner pages to maintain design consistency
 */
export default function PageHero({
  label,           // Small uppercase label above title (e.g., "Funding", "Community")
  title,           // Main page title
  description,     // Subtitle/description text
  stat,            // Optional stat to display (e.g., "90+ investors")
  statLabel,       // Label for the stat (e.g., "resources available")
  backgroundImage, // URL for background image
  children         // Optional additional content (CTAs, etc.)
}) {
  return (
    <div className="relative">
      {/* Background with gradient overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[500px] -z-10 overflow-hidden mask-gradient-b pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 md:mb-16 pt-28 md:pt-32"
      >
        {/* Label */}
        {label && (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 mb-4">
            {label}
          </p>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-6 font-light leading-relaxed">
            {description}
          </p>
        )}

        {/* Stat badge */}
        {stat && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/50 text-sm font-light">
              <span className="text-white font-medium">{stat}</span> {statLabel}
            </span>
          </div>
        )}

        {/* Additional content (CTAs, etc.) */}
        {children && (
          <div className="mt-6">
            {children}
          </div>
        )}
      </motion.div>
    </div>
  );
}
