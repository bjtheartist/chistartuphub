import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Animated counter that counts up from 0 to target value.
 */
function AnimatedCounter({ target, duration = 2000, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!target || started.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();

          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));

            if (progress < 1) requestAnimationFrame(animate);
            else setCount(target);
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/**
 * Database stats banner showing the scale of the investor/funding database.
 * Fits the noir/bureau aesthetic of ChiStartupHub.
 */
export function DatabaseStats({ investorCount = 0, fundingCount = 0, className }) {
  const totalRecords = investorCount + fundingCount;

  const stats = [
    {
      label: 'Investor Profiles',
      value: investorCount,
      suffix: '+',
    },
    {
      label: 'Funding Records',
      value: fundingCount,
      suffix: '+',
    },
    {
      label: 'Total Database',
      value: totalRecords,
      suffix: '+',
    },
  ];

  return (
    <div className={cn(
      "border border-chi-ghost/40 bg-black/60 backdrop-blur-sm",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-2 border-b border-chi-ghost/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-chi-dim font-mono">
            Live Database
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] text-chi-dim font-mono">
          Updated Daily
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 divide-x divide-chi-ghost/30">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-5 text-center">
            <div className="font-mono text-2xl md:text-3xl text-white font-light tracking-tight">
              <AnimatedCounter
                target={stat.value}
                duration={2200}
                suffix={stat.suffix}
              />
            </div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-chi-muted font-mono mt-1.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer tagline */}
      <div className="px-4 py-2 border-t border-chi-ghost/30 text-center">
        <span className="text-[10px] text-chi-dim font-mono tracking-[0.1em]">
          Sourced from SEC EDGAR, GLEIF, ProPublica, Wikidata & proprietary research
        </span>
      </div>
    </div>
  );
}

export default DatabaseStats;
