import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OptimizedImage from "@/components/OptimizedImage";

export const FeatureGrid = ({ children, columns = 4 }) => {
  return (
    <div className={cn(
      "grid grid-cols-1 gap-6 relative z-10 max-w-7xl mx-auto",
      "md:grid-cols-2",
      columns === 3 && "lg:grid-cols-3",
      columns === 4 && "lg:grid-cols-4",
    )}>
      {children}
    </div>
  );
};

export const FeatureCard = ({
  title,
  description,
  icon: Icon,
  index = 0,
  gradient,
  image
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group relative h-full min-h-[320px] overflow-hidden rounded-[32px] bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-all duration-500"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {image && (
          <OptimizedImage 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-80"
          />
        )}
        {/* Gradient Overlays - Lighter to show image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Color Tint - Reduced opacity */}
        <div className={cn(
          "absolute inset-0 opacity-20 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-30",
          gradient ? `bg-gradient-to-br ${gradient}` : "bg-blue-500"
        )} />
        
        {/* Hover Glow */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        )} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 flex flex-col h-full">
        {/* Icon */}
        <div className="mb-auto">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
            gradient ? `bg-gradient-to-br ${gradient} bg-opacity-20` : "bg-white/10"
          )}>
             <Icon className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="mt-8 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
          <h3 className="text-2xl font-bold text-white mb-3 tracking-tight drop-shadow-sm">
            {title}
          </h3>
          
          <p className="text-white/70 text-base leading-relaxed font-medium drop-shadow-sm">
            {description}
          </p>
        </div>

        {/* Hover Indicator */}
        <div className={cn(
          "absolute bottom-0 left-0 h-1.5 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left",
          gradient ? `bg-gradient-to-r ${gradient}` : "bg-blue-500"
        )} />
      </div>
    </motion.div>
  );
};