import { motion } from "framer-motion";
import { LOGOS } from "@/lib/logos";
import { SURFACE_2, FADE_UP } from "./primitives";

// ── GroupProgressBar ─────────────────────────────────────────────────────────
export function progressBarColor(pct) {
  if (pct >= 70) return "#10b981";
  if (pct >= 30) return "#f59e0b";
  return "#ef4444";
}

export function GroupProgressBar({ group, coladas, total, pct }) {
  return (
    <motion.div variants={FADE_UP} className="flex items-center gap-3">
      <span className="text-xs w-16 shrink-0 truncate" style={{ color: "#7a9bb5" }}>{group}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: SURFACE_2 }}>
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: progressBarColor(pct) }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      <span className="text-xs tabular-nums w-16 text-right shrink-0" style={{ color: "#4a6785" }}>
        {coladas}/{total}
      </span>
    </motion.div>
  );
}

// ── TeamRankList — ranking de times (mais perto / mais longe) ────────────────
export function TeamRankList({ teams, accent = "#34d399" }) {
  return (
    <motion.div className="flex flex-col gap-2" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="visible">
      {teams.map((t, i) => (
        <motion.div key={`${t.section_code}-${t.section_name}`} variants={FADE_UP} className="flex items-center gap-3">
          <span className="text-xs tabular-nums w-4 text-right shrink-0" style={{ color: "#4a6785" }}>{i + 1}</span>
          {LOGOS[t.section_code] ? (
            <img src={LOGOS[t.section_code]} className="w-6 h-6 object-contain shrink-0" alt="" />
          ) : (
            <div className="w-6 h-6 shrink-0" />
          )}
          <span className="text-xs truncate shrink-0 w-24" style={{ color: "#e8d5b0" }} title={t.section_name}>{t.section_name}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: SURFACE_2 }}>
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: accent }}
              initial={{ width: 0 }}
              animate={{ width: `${t.pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          <span className="text-xs tabular-nums w-14 text-right shrink-0" style={{ color: "#7a9bb5" }}>{t.coladas}/{t.total}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── HighlightCard — cada card com cor própria ────────────────────────────────
export const HIGHLIGHT_THEMES = {
  repeated: {
    bg: "rgba(6,182,212,0.12)",
    border: "rgba(6,182,212,0.35)",
    glow: "rgba(6,182,212,0.15)",
    iconBg: "rgba(6,182,212,0.2)",
  },
  closest_team: {
    bg: "rgba(212,168,83,0.12)",
    border: "rgba(212,168,83,0.35)",
    glow: "rgba(212,168,83,0.15)",
    iconBg: "rgba(212,168,83,0.2)",
  },
  closest_group: {
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.35)",
    glow: "rgba(139,92,246,0.15)",
    iconBg: "rgba(139,92,246,0.2)",
  },
  lagging: {
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
    glow: "rgba(239,68,68,0.15)",
    iconBg: "rgba(239,68,68,0.2)",
  },
};

export function HighlightCard({ theme = "repeated", label, logo, icon, iconColor, name, stat, statColor = "#34d399" }) {
  const t = HIGHLIGHT_THEMES[theme];
  return (
    <motion.div
      variants={FADE_UP}
      whileHover={{ y: -5, boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 22px ${t.glow}` }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="rounded-xl p-4 flex gap-3 items-center relative overflow-hidden cursor-default"
      style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        boxShadow: `inset 0 1px 4px rgba(0,0,0,0.35)`,
      }}
    >
      <div className="shrink-0">
        {logo ? (
          <img src={logo} className="w-12 h-12 object-contain drop-shadow-md" alt="" />
        ) : (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: t.iconBg }}
          >
            <i className={`bi ${icon} text-xl`} style={{ color: iconColor }} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] uppercase tracking-wider leading-tight" style={{ color: "#7a9bb5" }}>{label}</span>
        <span className="text-sm font-semibold leading-snug truncate" style={{ color: "#e8d5b0" }}>{name}</span>
        {stat && <span className="text-xs font-medium" style={{ color: statColor }}>{stat}</span>}
      </div>
    </motion.div>
  );
}
