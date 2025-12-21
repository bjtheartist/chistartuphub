import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import OptimizedImage from "@/components/OptimizedImage";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

function BentoCard({ item, index }) {
  const cardRef = useRef(null);
  const imageRef = useRef(null);

  // Support href, link (external), or to (internal router)
  const externalUrl = item.href || item.link;
  const Container = externalUrl ? 'a' : (item.to ? Link : 'div');
  const props = externalUrl
    ? { href: externalUrl, target: "_blank", rel: "noopener noreferrer" }
    : (item.to ? { to: item.to } : {});
  
  // Vary speeds for depth effect
  const speeds = [0.8, 1.2, 1.0, 1.5, 0.9, 1.3]; 
  const speed = speeds[index % speeds.length];

  useEffect(() => {
    if (!cardRef.current || !imageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current, 
        { yPercent: -10 * speed },
        {
          yPercent: 10 * speed,
          ease: "none",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [speed]);

  const isClickable = externalUrl || item.to;

  return (
    <Container
      ref={cardRef}
      {...props}
      className={cn(
        "group relative p-6 rounded-3xl overflow-hidden transition-all duration-500",
        "border border-white/10 bg-black/40 backdrop-blur-md",
        "hover:border-white/20 hover:shadow-2xl",
        "hover:-translate-y-1 will-change-transform flex flex-col",
        item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
        item.rowSpan === 2 ? "md:row-span-2" : "row-span-1",
        "min-h-[240px]",
        isClickable && "cursor-pointer"
      )}
    >
      {/* Background Image if provided */}
      {item.image && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div 
            ref={imageRef}
            className="absolute inset-[-20%] w-[140%] h-[140%]"
          >
            <OptimizedImage 
              src={item.image} 
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-60"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
        </div>
      )}
      <div
        className={`absolute inset-0 ${
          item.hasPersistentHover
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        } transition-opacity duration-300 pointer-events-none`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="flex items-start justify-between mb-auto">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
            "bg-white/10 text-white"
          )}>
            {item.icon}
          </div>
          {item.status && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/10 backdrop-blur-sm">
              {item.status}
            </span>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight drop-shadow-sm">
            {item.title}
          </h3>
          <p className="text-white/70 text-sm md:text-base leading-relaxed font-medium drop-shadow-sm line-clamp-2">
            {item.description}
          </p>
        </div>

        {(item.tags || item.cta || item.meta || externalUrl) && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
                {item.meta && <span className="text-xs text-white/60 font-medium">{item.meta}</span>}
            </div>
            {(item.cta || externalUrl) && (
              <span className="text-sm font-medium text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                {item.cta || "View Details"}
                {externalUrl ? <ExternalLink className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              </span>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

export function BentoGrid({ items = [], columns = 3 }) {
  return (
    <div className={cn(
      "grid gap-4 max-w-7xl mx-auto",
      "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "lg:grid-cols-3",
      columns === 2 && "lg:grid-cols-2"
    )}>
      {items.map((item, index) => (
        <BentoCard key={index} item={item} index={index} />
      ))}
    </div>
  );
}