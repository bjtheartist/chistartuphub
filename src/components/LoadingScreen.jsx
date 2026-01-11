import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

/**
 * LoadingScreen - Premium Bureau Loading Experience
 * Inspired by Area 17, Beaucoup Studios, Bureau of Visual Affairs
 * Sophisticated, bespoke, high-end design studio energy
 */
export default function LoadingScreen({ onComplete }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const width = useTransform(count, (latest) => `${latest}%`);
  const [phase, setPhase] = useState(0);

  // Status messages that appear during loading
  const statusMessages = [
    "INITIALIZING_SYSTEM",
    "LOADING_RESOURCES",
    "MAPPING_ECOSYSTEM",
    "READY"
  ];

  useEffect(() => {
    // Animate the counter
    const animation = animate(count, 100, {
      duration: 2.5,
      ease: [0.16, 1, 0.3, 1], // Custom easing for smooth deceleration
      onUpdate: (latest) => {
        // Update phase based on progress
        if (latest < 25) setPhase(0);
        else if (latest < 50) setPhase(1);
        else if (latest < 85) setPhase(2);
        else setPhase(3);
      },
      onComplete: () => {
        setTimeout(onComplete, 400);
      },
    });

    return animation.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { 
          duration: 0.6, 
          ease: [0.16, 1, 0.3, 1]
        } 
      }}
      className="fixed inset-0 z-[9999] bg-[#050A14] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Corner coordinates */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute top-8 left-8 font-mono text-[10px] text-white/20 tracking-[0.2em]"
      >
        41.8781° N
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute top-8 right-8 font-mono text-[10px] text-white/20 tracking-[0.2em]"
      >
        87.6298° W
      </motion.div>

      {/* Main content */}
      <div className="relative flex flex-col items-center">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="w-16 h-16 border border-white/20 flex items-center justify-center">
            <span className="font-mono text-xl text-white tracking-tight">CS</span>
          </div>
        </motion.div>

        {/* Counter - Large, dramatic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8"
        >
          <motion.span 
            className="font-serif text-[120px] md:text-[180px] lg:text-[220px] text-white leading-none tracking-tighter tabular-nums"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            <motion.span>{rounded}</motion.span>
            <span className="text-white/30">%</span>
          </motion.span>
        </motion.div>

        {/* Progress line - Minimal, elegant */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-48 md:w-64 h-[1px] bg-white/10 mb-8 origin-left"
        >
          <motion.div 
            className="h-full bg-white origin-left" 
            style={{ width }}
          />
        </motion.div>

        {/* Status message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="h-6 overflow-visible"
        >
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]"
          >
            [{statusMessages[phase]}]
          </motion.span>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-8 left-0 right-0 flex justify-between items-center px-8"
      >
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">
          ChiStartup Hub
        </span>
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">
          Chicago, IL
        </span>
      </motion.div>

      {/* Decorative corner elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-white/10"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-white/10"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute top-8 left-8 w-8 h-8 border-l border-t border-white/10 mt-6"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute top-8 right-8 w-8 h-8 border-r border-t border-white/10 mt-6"
      />
    </motion.div>
  );
}
