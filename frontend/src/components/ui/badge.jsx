import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  positive: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  negative: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  neutral: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

function Badge({ variant = "neutral", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
