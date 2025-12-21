import React from "react";
import { cn } from "@/lib/utils";

const mockupVariants = {
  mobile: "rounded-[48px] max-w-[350px]",
  responsive: "rounded-md",
};

export const Mockup = React.forwardRef(({ className, type = "responsive", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex relative z-10 overflow-hidden shadow-2xl border border-white/5",
      mockupVariants[type],
      className
    )}
    {...props}
  />
));
Mockup.displayName = "Mockup";

const frameVariants = {
  small: "p-2",
  large: "p-4",
};

export const MockupFrame = React.forwardRef(({ className, size = "small", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white/5 flex relative z-10 overflow-hidden rounded-2xl",
      frameVariants[size],
      className
    )}
    {...props}
  />
));
MockupFrame.displayName = "MockupFrame";