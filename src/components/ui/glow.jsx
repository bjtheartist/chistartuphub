import React from "react";
import { cn } from "@/lib/utils";

const glowVariants = {
  top: "top-0",
  above: "-top-[128px]",
  bottom: "bottom-0",
  below: "-bottom-[128px]",
  center: "top-[50%]",
};

export const Glow = React.forwardRef(({ className, variant = "top", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute w-full", glowVariants[variant], className)}
    {...props}
  >
    <div
      className={cn(
        "absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_rgba(96,165,250,.5)_10%,_rgba(96,165,250,0)_60%)] sm:h-[512px]",
        variant === "center" && "-translate-y-1/2",
      )}
    />
    <div
      className={cn(
        "absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-[2] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,.3)_10%,_rgba(96,165,250,0)_60%)] sm:h-[256px]",
        variant === "center" && "-translate-y-1/2",
      )}
    />
  </div>
));
Glow.displayName = "Glow";