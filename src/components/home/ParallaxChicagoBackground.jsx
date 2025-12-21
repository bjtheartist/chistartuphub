import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chicagoImages = [
  {
    src: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80",
    alt: "Chicago River",
    speed: 1.5,
    position: { top: "-10%", left: "5%" },
    size: "w-48 md:w-64",
    rotation: -5,
    opacity: 0.6
  },
  {
    src: "https://images.unsplash.com/photo-1581373449483-37449f962b6c?w=800&q=80",
    alt: "Chicago Bean",
    speed: 2.5,
    position: { top: "5%", right: "8%" },
    size: "w-40 md:w-56",
    rotation: 3,
    opacity: 0.5
  },
  {
    src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
    alt: "Chicago Skyline",
    speed: 1.2,
    position: { top: "30%", left: "2%" },
    size: "w-56 md:w-72",
    rotation: 2,
    opacity: 0.4
  },
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fad57ce6a6914f0fbc124a/63820d2b3_blake-guidry-Cisl86aU2n4-unsplash.jpg",
    alt: "Wrigley Field",
    speed: 3.0,
    position: { top: "60%", right: "3%" },
    size: "w-44 md:w-60",
    rotation: -3,
    opacity: 0.5
  },
  {
    src: "https://images.unsplash.com/photo-1596276020587-8044fe049813?w=800&q=80",
    alt: "Chicago L Train",
    speed: 1.8,
    position: { top: "80%", left: "8%" },
    size: "w-40 md:w-52",
    rotation: 4,
    opacity: 0.55
  },
  {
    src: "https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=800&q=80",
    alt: "Chicago Theatre",
    speed: 2.2,
    position: { top: "90%", right: "10%" },
    size: "w-48 md:w-64",
    rotation: -2,
    opacity: 0.6
  }
];

export default function ParallaxChicagoBackground() {
  const containerRef = useRef(null);
  const imageRefs = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      imageRefs.current.forEach((img, index) => {
        if (!img) return;
        
        const speed = chicagoImages[index].speed;
        
        // Use fromTo for more robust positioning
        gsap.fromTo(img,
          { y: 0 },
          {
            y: -200 * speed, // Move up significantly to create floating effect against scroll
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top bottom", // Start when section hits bottom of viewport
              end: "bottom top",   // End when section leaves top
              scrub: 1             // Smooth scrubbing (1s catchup)
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-visible pointer-events-none z-0"
    >
      {chicagoImages.map((image, index) => (
        <div
          key={index}
          ref={el => imageRefs.current[index] = el}
          className={`absolute ${image.size} aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl`}
          style={{
            ...image.position,
            transform: `rotate(${image.rotation}deg)`,
            opacity: image.opacity
          }}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ))}
    </div>
  );
}