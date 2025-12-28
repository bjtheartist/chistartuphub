import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export default function LoadingScreen({ onComplete }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const width = useTransform(count, (latest) => `${latest}%`);

  useEffect(() => {
    const animation = animate(count, 100, {
      duration: 2,
      ease: "circOut",
      onComplete: () => {
        setTimeout(onComplete, 200);
      },
    });

    return animation.stop;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-8"
    >
      <motion.pre className="text-4xl md:text-6xl font-bold font-mono text-white tracking-tighter tabular-nums">
        <motion.span>{rounded}</motion.span>%
      </motion.pre>
      <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-white" 
          style={{ width }}
        />
      </div>
    </motion.div>
  );
}