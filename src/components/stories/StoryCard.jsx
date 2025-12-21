import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";

const StoryCard = memo(function StoryCard({ story, size = "default" }) {
  const sizeClasses = {
    small: "h-48",
    default: "h-64",
    large: "h-96"
  };

  // Helper to get category/sector
  const getCategory = () => story.category || story.sector || 'Technology';

  // Helper to get founder name(s)
  const getFounderName = () => {
    if (story.founder_name) return story.founder_name;
    if (story.founders && Array.isArray(story.founders)) {
      return story.founders.join(', ');
    }
    return 'Unknown Founder';
  };

  const categoryColors = {
    "Consumer Tech": "from-violet-600 via-purple-500 to-fuchsia-500",
    "FoodTech": "from-orange-500 via-amber-500 to-yellow-400",
    "HealthTech": "from-emerald-500 via-teal-500 to-cyan-400",
    "Logistics Tech": "from-blue-600 via-indigo-500 to-cyan-400",
    "FinTech": "from-blue-600 via-blue-500 to-indigo-400",
    "SaaS": "from-indigo-600 via-purple-600 to-violet-500",
    "AI & IoT": "from-fuchsia-600 via-purple-600 to-indigo-600",
    "Deep Tech": "from-slate-800 via-slate-700 to-gray-600",
    "LegalTech": "from-blue-800 via-blue-700 to-indigo-700",
    "Marketplace": "from-rose-500 via-pink-500 to-fuchsia-500",
    "E-commerce": "from-teal-500 via-emerald-500 to-green-400",
    "Logistics": "from-sky-600 via-blue-600 to-indigo-500"
  };

  const category = getCategory();
  const gradientClass = categoryColors[category] || "from-slate-800 via-zinc-800 to-neutral-800";

  return (
    <div className={`${sizeClasses[size]} relative overflow-hidden bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center p-8 text-center group`}>
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />
      
      {/* Animated shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

      {/* Decorative blobs */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[80px] transform translate-x-1/3 -translate-y-1/3 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black rounded-full blur-[80px] transform -translate-x-1/3 translate-y-1/3 mix-blend-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 transform transition-transform duration-300 group-hover:scale-105">
        <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-md tracking-tight">
          {story.company_name}
        </h3>

        <p className="text-lg md:text-xl text-white/90 mb-5 font-medium tracking-wide">
          {getFounderName()}
        </p>

        <Badge className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs px-3 py-1 uppercase tracking-wider shadow-lg">
          {category}
        </Badge>
      </div>
    </div>
  );
});

export default StoryCard;