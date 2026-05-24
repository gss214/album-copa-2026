import { useState, useEffect, useMemo, useRef } from "react";
import { motion, animate } from "framer-motion";
import { api } from "@/api";
import { LOGOS } from "@/lib/logos";

// ── Paleta ──────────────────────────────────────────────────────────────────
const SURFACE   = "#132030";
const SURFACE_2 = "#1a2d42";
const GOLD      = "#d4a853";
const COPPER    = "#b87333";

// ── Variantes de animação ────────────────────────────────────────────────────
const PAGE_VARIANTS = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const FADE_UP = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" } },
};

const STAGGER_GRID = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ── AnimatedNumber ───────────────────────────────────────────────────────────
function AnimatedNumber({ to, style, className, prefix = "", suffix = "" }) {
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

// ── MetricsBar — 5 cards individuais ────────────────────────────────────────
function MetricsBar({ summary }) {
  const metrics = [
    { icon: "bi-collection",    label: "Total do Álbum",  value: summary.total,      color: "#e8d5b0", suffix: ""  },
    { icon: "bi-check2-square", label: "Coladas",          value: summary.coladas,    color: "#34d399", suffix: ""  },
    { icon: "bi-x-square",      label: "Faltam",           value: summary.faltam,     color: "#f87171", suffix: ""  },
    { icon: "bi-layers",        label: "Repetidas",        value: summary.repetidas,  color: "#38bdf8", suffix: "" },
  ];

  return (
    <motion.div variants={FADE_UP} className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <motion.div
          key={m.label}
          variants={FADE_UP}
          className="rounded-2xl flex flex-col items-center justify-center gap-1 py-5 px-4 text-center"
          style={{
            background: SURFACE,
            border: `1px solid ${m.color}22`,
            boxShadow: `inset 0 2px 10px rgba(0,0,0,0.5), 0 0 18px ${m.color}10`,
          }}
        >
          <span className="text-[10px] uppercase tracking-widest flex items-center gap-1.5" style={{ color: "#7a9bb5" }}>
            <i className={`bi ${m.icon}`} style={{ color: m.color }} />
            {m.label}
          </span>
          <AnimatedNumber
            to={m.value}
            suffix={m.suffix}
            className="text-3xl tabular-nums leading-none"
            style={{ color: m.color, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          />
          {m.sub && <span className="text-[10px]" style={{ color: "#4a6785" }}>{m.sub}</span>}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── DoughnutRing ─────────────────────────────────────────────────────────────
function DoughnutRing({ pct }) {
  const r    = 84;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="210" height="210" viewBox="0 0 210 210">
      <defs>
        <linearGradient id="doughnut-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id="glow-blur">
          <feGaussianBlur stdDeviation="3" result="blur" />
        </filter>
      </defs>
      {/* track */}
      <circle cx="105" cy="105" r={r} fill="none" stroke={SURFACE_2} strokeWidth="18" />
      {/* glow arc */}
      <motion.circle
        cx="105" cy="105" r={r}
        fill="none" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round"
        strokeDashoffset={circ / 4}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
        transition={{ duration: 1.6, ease: "easeOut", delay: 0.5 }}
        opacity={0.4} filter="url(#glow-blur)"
      />
      {/* progress arc */}
      <motion.circle
        cx="105" cy="105" r={r}
        fill="none" stroke="url(#doughnut-grad)" strokeWidth="18" strokeLinecap="round"
        strokeDashoffset={circ / 4}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
        transition={{ duration: 1.6, ease: "easeOut", delay: 0.5 }}
      />
      <text x="105" y="98" textAnchor="middle" fill={GOLD} fontSize="34" fontWeight="700"
        fontFamily="'Playfair Display', Georgia, serif">{pct}%</text>
      <text x="105" y="118" textAnchor="middle" fill="#4a6785" fontSize="11" letterSpacing="2">COMPLETO</text>
    </svg>
  );
}

// ── GroupProgressBar ─────────────────────────────────────────────────────────
function progressBarColor(pct) {
  if (pct >= 70) return "#10b981";
  if (pct >= 30) return "#f59e0b";
  return "#ef4444";
}

function GroupProgressBar({ group, coladas, total, pct }) {
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

// ── HighlightCard — cada card com cor própria ────────────────────────────────
const HIGHLIGHT_THEMES = {
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

function HighlightCard({ theme = "repeated", label, logo, icon, iconColor, name, stat, statColor = "#34d399" }) {
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

// ── CostCard ─────────────────────────────────────────────────────────────────
const ALBUM_TYPES = [
  { key: "brochura", label: "Brochura",  price: 24.90 },
  { key: "capadura", label: "Capa Dura", price: 77.40 },
];
const PACKET_PRICE = 7.00;
const PACKET_SIZE  = 7;
const STICKER_UNIT = PACKET_PRICE / PACKET_SIZE;
const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CostCard({ summary }) {
  const [albumType, setAlbumType] = useState("brochura");
  const album = ALBUM_TYPES.find((a) => a.key === albumType);

  const cost = useMemo(() => {
    const totalOwned  = summary.coladas + summary.repetidas;
    const packets     = Math.ceil(totalOwned / PACKET_SIZE);
    const packetsCost = packets * PACKET_PRICE;
    const total       = album.price + packetsCost;
    const tradeValue  = summary.repetidas * STICKER_UNIT;
    return { totalOwned, packets, packetsCost, total, tradeValue };
  }, [summary, album]);

  const parchmentBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

  const fields = [
    { label: "Figurinhas em mãos",    value: cost.totalOwned,       sub: `${summary.coladas} únicas + ${summary.repetidas} extras` },
    { label: "Pacotinhos",            value: `~${cost.packets}`,    sub: `${fmt(PACKET_PRICE)} cada · ${PACKET_SIZE} fig.` },
    { label: "Gasto em pacotinhos",   value: fmt(cost.packetsCost), sub: "estimativa mínima",                                        money: true },
    { label: `Total (álbum + pacs.)`, value: fmt(cost.total),       sub: `álbum ${album.label}: ${fmt(album.price)}`,                money: true },
    { label: "Valor em Repetidas",    value: fmt(cost.tradeValue),  sub: `${summary.repetidas} extras × ${fmt(STICKER_UNIT)}`,       money: true },
  ];

  return (
    <motion.div
      variants={FADE_UP}
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{
        background: `${parchmentBg}, #f0e4c4`,
        backgroundBlendMode: "multiply",
        border: "1px solid #c4a96d",
        boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2" style={{ color: "#7a5c30" }}>
          <i className="bi bi-calculator" />
          Estimativa de Gastos
        </span>
        <div className="flex gap-1">
          {ALBUM_TYPES.map((a) => (
            <button
              key={a.key}
              onClick={() => setAlbumType(a.key)}
              className="px-3 py-1 text-xs rounded-full font-medium transition-all"
              style={
                albumType === a.key
                  ? { background: "#c4a96d", color: "#3b2f1e", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.25)" }
                  : { background: "#e8d5a8", color: "#7a5c30" }
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {fields.map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <span className="text-[11px]" style={{ color: "#8a6d4e" }}>{f.label}</span>
            <span
              className="text-xl tabular-nums font-bold leading-tight"
              style={{
                color: f.money ? "#7a3020" : "#3b2f1e",
                fontFamily: f.money ? "'Playfair Display', Georgia, serif" : "inherit",
              }}
            >
              {f.value}
            </span>
            <span className="text-[10px]" style={{ color: "#a08060" }}>{f.sub}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── SurfaceCard ───────────────────────────────────────────────────────────────
function SurfaceCard({ children, className = "", style = {} }) {
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

function SectionLabel({ children }) {
  return (
    <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: COPPER }}>
      {children}
    </span>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stats,   setStats]   = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([api.getSummary(), api.getStats()])
      .then(([s, st]) => { setSummary(s); setStats(st); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-rose-400 text-sm">{error}</p>;

  if (!summary || !stats) return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-10 w-56 rounded-lg" style={{ background: SURFACE }} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: SURFACE }} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl" style={{ background: SURFACE }} />
        <div className="h-72 rounded-2xl" style={{ background: SURFACE }} />
      </div>
      <div className="h-56 rounded-2xl" style={{ background: SURFACE }} />
    </div>
  );

  const sortedGroups = [...stats.group_progress].sort((a, b) => b.pct - a.pct);
  const laggingGroup = stats.group_progress
    .filter((g) => g.pct > 0)
    .reduce((min, g) => (!min || g.pct < min.pct) ? g : min, null);

  return (
    <motion.div
      className="flex flex-col gap-8 relative z-10"
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={FADE_UP} className="flex items-center gap-3">
        <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-10 h-10 object-contain drop-shadow-lg" />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GOLD, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#4a6785" }}>Visão geral do álbum Copa 2026</p>
        </div>
      </motion.div>

      {/* 5 metric cards */}
      <MetricsBar summary={summary} />

      {/* Main row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Progresso Geral — com blobs de gradiente no fundo */}
        <SurfaceCard
          className="flex flex-col items-center justify-center gap-4 relative overflow-hidden"
          style={{ minHeight: "320px" }}
        >
          {/* abstract gradient blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div style={{
              position: "absolute", width: 220, height: 220, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)",
              top: "-40px", left: "-40px", filter: "blur(24px)",
            }} />
            <div style={{
              position: "absolute", width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)",
              bottom: "-30px", right: "-30px", filter: "blur(24px)",
            }} />
            <div style={{
              position: "absolute", width: 160, height: 160, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 70%)",
              top: "30%", right: "10%", filter: "blur(20px)",
            }} />
            <div style={{
              position: "absolute", width: 140, height: 140, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)",
              bottom: "20%", left: "5%", filter: "blur(18px)",
            }} />
          </div>

          <SectionLabel>Progresso Geral</SectionLabel>
          <DoughnutRing pct={summary.percentual} />
        </SurfaceCard>

        {/* Destaques */}
        <SurfaceCard className="flex flex-col gap-3">
          <SectionLabel>Destaques</SectionLabel>
          <motion.div
            className="grid grid-cols-2 gap-3 flex-1"
            variants={STAGGER_GRID}
            initial="hidden"
            animate="visible"
          >
            <HighlightCard
              theme="repeated"
              label="Figurinha Mais Repetida"
              logo={stats.most_repeated && LOGOS[stats.most_repeated.section_code]}
              icon="bi-layers-fill"
              iconColor="#06b6d4"
              name={stats.most_repeated ? stats.most_repeated.section_name : "Nenhuma ainda"}
              stat={stats.most_repeated ? `×${stats.most_repeated.quantity - 1} cópias` : null}
              statColor="#06b6d4"
            />
            <HighlightCard
              theme="closest_team"
              label="Time Mais Perto de Completar"
              logo={stats.closest_team && LOGOS[stats.closest_team.section_code]}
              icon="bi-trophy-fill"
              iconColor={GOLD}
              name={stats.closest_team ? stats.closest_team.section_name : "Nenhum ainda"}
              stat={stats.closest_team ? `${stats.closest_team.coladas}/${stats.closest_team.total} (${stats.closest_team.pct}%)` : null}
              statColor="#34d399"
            />
            <HighlightCard
              theme="closest_group"
              label="Grupo Mais Perto de Completar"
              icon="bi-star-fill"
              iconColor="#a78bfa"
              name={stats.closest_group ? stats.closest_group.group : "Nenhum ainda"}
              stat={stats.closest_group ? `${stats.closest_group.coladas}/${stats.closest_group.total} (${stats.closest_group.pct}%)` : null}
              statColor="#a78bfa"
            />
            <HighlightCard
              theme="lagging"
              label="Grupo Mais Atrasado"
              icon="bi-exclamation-triangle-fill"
              iconColor="#f87171"
              name={laggingGroup ? laggingGroup.group : "Nenhum iniciado"}
              stat={laggingGroup ? `${laggingGroup.coladas}/${laggingGroup.total} (${laggingGroup.pct}%)` : null}
              statColor="#f87171"
            />
          </motion.div>
        </SurfaceCard>
      </div>

      {/* Progresso por Grupo */}
      <SurfaceCard>
        <div className="flex flex-col gap-4">
          <SectionLabel>Progresso por Grupo</SectionLabel>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2"
            variants={STAGGER_GRID}
            initial="hidden"
            animate="visible"
          >
            {sortedGroups.map((g) => (
              <GroupProgressBar key={g.group} {...g} />
            ))}
          </motion.div>
        </div>
      </SurfaceCard>
    </motion.div>
  );
}
