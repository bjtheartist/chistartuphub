import React from 'react';
import { cn } from '@/lib/utils';

// Bespoke SVG Icons for investor categories
const icons = {
  // All - Grid icon
  all: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  // VC - Briefcase
  vc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="2" y="7" width="20" height="14" rx="0" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  // Angel - Wings/Star
  angel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
    </svg>
  ),
  // Family Office - Building with heart
  family: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  ),
  // CVC - Corporate building with gear
  cvc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="4" y="4" width="16" height="16" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
      <line x1="4" y1="15" x2="20" y2="15" />
    </svg>
  ),
  // Midwest - Star with M
  midwest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 16V8l4 4 4-4v8" />
    </svg>
  )
};

const categories = [
  { id: 'all', label: 'All', icon: icons.all },
  { id: 'vc', label: 'Venture Capital', icon: icons.vc },
  { id: 'angel', label: 'Angel', icon: icons.angel },
  { id: 'family_office', label: 'Family Office', icon: icons.family },
  { id: 'cvc', label: 'Corporate VC', icon: icons.cvc },
  { id: 'midwest', label: 'Midwest', icon: icons.midwest, special: true }
];

export function InvestorStrip({ 
  activeCategory, 
  onCategoryChange,
  counts = {}
}) {
  return (
    <div className="border border-chi-ghost bg-black/40 backdrop-blur-sm">
      {/* Strip Header */}
      <div className="px-4 py-2 border-b border-chi-ghost/50 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.2em] text-chi-dim font-mono">
          Investor Type
        </span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-chi-dim font-mono">
          {counts.total || '60,000+'}
        </span>
      </div>
      
      {/* Categories */}
      <div className="grid grid-cols-3 md:grid-cols-6">
        {categories.map((cat, index) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "relative flex flex-col items-center justify-center py-5 px-3 transition-all duration-200",
              "border-r border-chi-ghost/50 last:border-r-0",
              "hover:bg-white/5",
              activeCategory === cat.id && "bg-white/10",
              cat.special && "text-chi-signal"
            )}
          >
            {/* Active indicator */}
            {activeCategory === cat.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
            )}
            
            {/* Icon */}
            <div className={cn(
              "mb-2 transition-colors",
              activeCategory === cat.id ? "text-white" : "text-chi-muted",
              cat.special && activeCategory !== cat.id && "text-chi-signal/60"
            )}>
              {cat.icon}
            </div>
            
            {/* Label */}
            <span className={cn(
              "text-[10px] uppercase tracking-[0.1em] font-mono transition-colors text-center",
              activeCategory === cat.id ? "text-white" : "text-chi-muted",
              cat.special && activeCategory !== cat.id && "text-chi-signal/80"
            )}>
              {cat.label}
            </span>
            
            {/* Count */}
            <span className={cn(
              "text-[11px] font-mono mt-1",
              activeCategory === cat.id ? "text-white/80" : "text-chi-dim"
            )}>
              {counts[cat.id] || '—'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default InvestorStrip;
