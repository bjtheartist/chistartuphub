import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import OptimizedImage from "@/components/OptimizedImage";

export function ExpandingCards({ items }) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <div className="flex flex-col lg:flex-row gap-3 w-full max-w-7xl mx-auto min-h-[400px] lg:min-h-[500px]">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isExpanded = expandedIndex === index;

        return (
          <motion.div
            key={index}
            onClick={() => setExpandedIndex(index)}
            className={cn(
              "relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ease-out",
              "border border-white/10 hover:border-white/20",
              isExpanded
                ? "lg:flex-[5] flex-1"
                : "lg:flex-[1.2] lg:min-w-[120px] h-20 lg:h-auto"
            )}
            layout
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              {item.image && (
                <OptimizedImage
                  src={item.image}
                  alt={item.title}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-700",
                    isExpanded ? "opacity-60 scale-100" : "opacity-40 scale-110"
                  )}
                />
              )}
              {/* Dark overlay */}
              <div className={cn(
                "absolute inset-0 transition-all duration-500",
                isExpanded
                  ? "bg-gradient-to-t from-black via-black/70 to-black/30"
                  : "bg-black/60"
              )} />

              {/* Color accent on hover/expand */}
              <div className={cn(
                "absolute inset-0 transition-opacity duration-500",
                isExpanded ? "opacity-20" : "opacity-0",
                item.gradient ? `bg-gradient-to-br ${item.gradient}` : "bg-blue-500/20"
              )} />
            </div>

            {/* Content */}
            <div className={cn(
              "relative z-10 h-full flex",
              isExpanded ? "p-6 lg:p-8 flex-col" : "p-4 lg:p-6 flex-row lg:flex-col items-center lg:items-start"
            )}>
              {/* Header with icon and title */}
              <div className={cn(
                "flex transition-all duration-300",
                isExpanded
                  ? "items-center gap-4 lg:mb-auto flex-row"
                  : "items-center lg:items-start gap-3 lg:gap-4 flex-row lg:flex-col lg:h-full"
              )}>
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-all duration-500",
                  isExpanded ? "w-14 h-14" : "w-10 h-10",
                  item.gradient ? `bg-gradient-to-br ${item.gradient} bg-opacity-30` : "bg-white/10"
                )}>
                  <Icon className={cn(
                    "text-white transition-all duration-300",
                    isExpanded ? "w-7 h-7" : "w-5 h-5"
                  )} />
                </div>

                {/* Title - rotated on desktop collapsed state */}
                <h3 className={cn(
                  "font-bold text-white tracking-tight transition-all duration-300",
                  isExpanded
                    ? "text-2xl lg:text-3xl"
                    : "text-base lg:text-lg lg:[writing-mode:vertical-lr] lg:rotate-180 lg:mt-auto lg:mb-2"
                )}>
                  {item.title}
                </h3>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-auto pt-6"
                  >
                    <p className="text-white/70 text-base lg:text-lg leading-relaxed max-w-md">
                      {item.description}
                    </p>

                    {/* Optional stats or tags */}
                    {item.stats && (
                      <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
                        {item.stats.map((stat, i) => (
                          <div key={i} className="text-center">
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom accent bar */}
            <div className={cn(
              "absolute bottom-0 left-0 h-1 transition-all duration-500",
              isExpanded ? "w-full" : "w-0",
              item.gradient ? `bg-gradient-to-r ${item.gradient}` : "bg-blue-500"
            )} />
          </motion.div>
        );
      })}
    </div>
  );
}

export default ExpandingCards;
