import React from 'react';

// ===================== HERO COMPONENT =====================
const AuroraHero = ({
  title,
  description,
  badgeText,
  badgeLabel,
  badgeHref,
  ctaButtons = [],
  microDetails = []
}) => {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 pb-12 pt-28 sm:gap-8 sm:pt-44 md:px-10 lg:px-16 md:pb-20">
        {badgeText && badgeLabel && (
           <a
             href={badgeHref || "#"}
             className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
           >
             <span className="text-[10px] font-light uppercase tracking-[0.08em] text-white/70">{badgeLabel}</span>
             <span className="h-1 w-1 rounded-full bg-white/40" />
             <span className="text-xs font-light tracking-tight text-white/80">{badgeText}</span>
           </a>
        )}

        <div className="max-w-2xl">
          {title}
        </div>

        <p className="max-w-xl text-left text-base font-light leading-relaxed tracking-tight text-white/75 sm:text-lg">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {ctaButtons.map((button, index) => (
            <a
              key={index}
              href={button.href}
              onClick={button.onClick}
              className={`rounded-2xl border border-white/10 px-5 py-3 text-sm font-light tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 duration-300 ${
                button.primary
                  ? "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  : "text-white/80 hover:bg-white/5"
              }`}
            >
              {button.text}
            </a>
          ))}
        </div>

        {microDetails.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-6 text-sm font-light tracking-tight text-white/70">
            {microDetails.map((detail, index) => (
               <li key={index} className="flex items-center gap-2">
                 <span className="h-1 w-1 rounded-full bg-white/40" /> {detail}
               </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
    </section>
  );
};

// Simple gradient background replacement for ShaderBackground
export const ShaderBackground = ({ className = "absolute inset-0 -z-10 w-full h-full" }) => (
  <div className={className} aria-hidden="true">
    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-950 via-black to-purple-950" />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
  </div>
);

export default AuroraHero;