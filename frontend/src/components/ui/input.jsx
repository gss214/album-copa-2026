import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-700",
        className
      )}
      {...props}
    />
  );
}

export { Input };
