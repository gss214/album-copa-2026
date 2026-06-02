import { useEffect, useRef } from "react";
import { motion, animate } from "framer-motion";

// ── Paleta ──────────────────────────────────────────────────────────────────
export const SURFACE   = "#132030";
export const SURFACE_2 = "#1a2d42";
export const GOLD      = "#d4a853";
export const COPPER    = "#b87333";

// ── Variantes de animação ────────────────────────────────────────────────────
export const PAGE_VARIANTS = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
};

export const FADE_UP = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" } },
};

export const STAGGER_GRID = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ── AnimatedNumber ───────────────────────────────────────────────────────────
export function AnimatedNumber({ to, style, className, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (to == null) return;
    const numeric = parseFloat(String(to).replace(/[^0-9.]/g, ""));
    const controls = animate(0, numeric, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate(val) {
        if (!ref.current) return;
        const rounded = Number.isInteger(numeric) ? Math.round(val) : val.toFixed(1);
        ref.current.textContent = `${prefix}${rounded}${suffix}`;
      },
    });
    return controls.stop;
  }, [to, prefix, suffix]);
  return (
    <span ref={ref} style={style} className={className}>
      {prefix}{to}{suffix}
    </span>
  );
}

// ── SurfaceCard ───────────────────────────────────────────────────────────────
export function SurfaceCard({ children, className = "", style = {} }) {
  return (
    <motion.div
      variants={FADE_UP}
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: SURFACE,
        border: `1px solid ${COPPER}20`,
        boxShadow: `inset 0 2px 8px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)`,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

export function SectionLabel({ children }) {
  return (
    <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: COPPER }}>
      {children}
    </span>
  );
}
