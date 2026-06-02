import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/api";
import { LOGOS } from "@/lib/logos";
import {
  SURFACE, SURFACE_2, GOLD,
  PAGE_VARIANTS, FADE_UP, STAGGER_GRID,
  AnimatedNumber, SurfaceCard, SectionLabel,
} from "@/components/dashboard/primitives";
import { HighlightCard, GroupProgressBar, TeamRankList } from "@/components/dashboard/cards";

// ── MetricCards — 4 cards (sem grid wrapper) ─────────────────────────────────
function MetricCards({ summary }) {
  const metrics = [
    { icon: "bi-collection",    label: "Total do Álbum",  value: summary.total,      color: "#e8d5b0" },
    { icon: "bi-check2-square", label: "Coladas",          value: summary.coladas,    color: "#34d399" },
    { icon: "bi-x-square",      label: "Faltam",           value: summary.faltam,     color: "#f87171" },
    { icon: "bi-layers",        label: "Repetidas",        value: summary.repetidas,  color: "#38bdf8" },
  ];

  return metrics.map((m) => (
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
        className="text-3xl tabular-nums leading-none"
        style={{ color: m.color, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
      />
    </motion.div>
  ));
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

// ── ActivityCard — métrica de atividade ──────────────────────────────────────
function ActivityCard({ icon, label, value, color }) {
  return (
    <motion.div
      variants={FADE_UP}
      className="rounded-2xl flex flex-col items-center justify-center gap-1 py-5 px-4 text-center"
      style={{
        background: SURFACE,
        border: `1px solid ${color}22`,
        boxShadow: `inset 0 2px 10px rgba(0,0,0,0.5), 0 0 18px ${color}10`,
      }}
    >
      <span className="text-[10px] uppercase tracking-widest flex items-center gap-1.5" style={{ color: "#7a9bb5" }}>
        <i className={`bi ${icon}`} style={{ color }} />
        {label}
      </span>
      <AnimatedNumber
        to={value}
        className="text-3xl tabular-nums leading-none"
        style={{ color, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
      />
    </motion.div>
  );
}

// ── InfoCard — bloco textual (ritmo / última atividade) ───────────────────────
function InfoCard({ icon, iconColor, label, value, hint }) {
  return (
    <motion.div
      variants={FADE_UP}
      className="rounded-xl p-4 flex gap-3 items-center"
      style={{ background: SURFACE, border: `1px solid ${iconColor}22` }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${iconColor}1f` }}
      >
        <i className={`bi ${icon} text-lg`} style={{ color: iconColor }} />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] uppercase tracking-wider leading-tight" style={{ color: "#7a9bb5" }}>{label}</span>
        <span className="text-base font-semibold leading-snug truncate" style={{ color: "#e8d5b0" }}>{value}</span>
        {hint && <span className="text-[11px]" style={{ color: "#4a6785" }}>{hint}</span>}
      </div>
    </motion.div>
  );
}

function timeAgo(iso) {
  if (!iso) return "Nenhuma";
  const then = new Date(iso);
  const diff = (Date.now() - then.getTime()) / 1000;
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  return then.toLocaleDateString("pt-BR");
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [summary,  setSummary]  = useState(null);
  const [stats,    setStats]    = useState(null);
  const [activity, setActivity] = useState(null);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    Promise.all([api.getSummary(), api.getStats(), api.getActivity()])
      .then(([s, st, ac]) => { setSummary(s); setStats(st); setActivity(ac); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-rose-400 text-sm">{error}</p>;

  if (!summary || !stats || !activity) return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-10 w-56 rounded-lg" style={{ background: SURFACE }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: SURFACE }} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 rounded-2xl" style={{ background: SURFACE }} />
        <div className="h-80 rounded-2xl" style={{ background: SURFACE }} />
      </div>
    </div>
  );

  const sortedGroups = [...stats.group_progress].sort((a, b) => b.pct - a.pct);
  const laggingGroup = stats.group_progress
    .filter((g) => g.pct > 0)
    .reduce((min, g) => (!min || g.pct < min.pct) ? g : min, null);
  const mr = stats.most_repeated;

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

      {/* Progresso geral + métricas */}
      <SurfaceCard className="relative overflow-hidden">
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
            background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)",
            bottom: "10%", left: "5%", filter: "blur(18px)",
          }} />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <SectionLabel>Progresso Geral</SectionLabel>
            <DoughnutRing pct={summary.percentual} />
          </div>
          <motion.div
            className="grid grid-cols-2 gap-3 w-full flex-1"
            variants={STAGGER_GRID}
            initial="hidden"
            animate="visible"
          >
            <MetricCards summary={summary} />
          </motion.div>
        </div>
      </SurfaceCard>

      {/* Atividade — hoje e semana */}
      <SurfaceCard className="flex flex-col gap-4">
        <SectionLabel>Atividade</SectionLabel>
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3" variants={STAGGER_GRID} initial="hidden" animate="visible">
          <ActivityCard icon="bi-plus-circle"   label="Coladas hoje"        value={activity.today_coladas}     color="#34d399" />
          <ActivityCard icon="bi-dash-circle"   label="Descoladas hoje"     value={activity.today_descoladas}  color="#f87171" />
          <ActivityCard icon="bi-calendar-week" label="Coladas (7 dias)"    value={activity.week_coladas}      color="#38bdf8" />
          <ActivityCard icon="bi-calendar-x"    label="Descoladas (7 dias)" value={activity.week_descoladas}   color="#f59e0b" />
        </motion.div>
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-3" variants={STAGGER_GRID} initial="hidden" animate="visible">
          <InfoCard
            icon="bi-speedometer2"
            iconColor="#a78bfa"
            label="Ritmo médio"
            value={`${activity.avg_per_day} /dia`}
            hint="coladas por dia ativo"
          />
          <InfoCard
            icon="bi-flag-fill"
            iconColor={GOLD}
            label="Estimativa para completar"
            value={activity.days_to_complete != null ? `~${activity.days_to_complete} dias` : "—"}
            hint={activity.days_to_complete != null ? "no ritmo atual" : "sem dados suficientes"}
          />
          <InfoCard
            icon="bi-clock-history"
            iconColor="#38bdf8"
            label="Última atividade"
            value={timeAgo(activity.last_activity)}
            hint={`${activity.total_events} movimentações no total`}
          />
        </motion.div>
      </SurfaceCard>

      {/* Destaques */}
      <SurfaceCard className="flex flex-col gap-3">
        <SectionLabel>Destaques</SectionLabel>
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" variants={STAGGER_GRID} initial="hidden" animate="visible">
            <HighlightCard
              theme="repeated"
              label="Figurinha Mais Repetida"
              logo={mr && LOGOS[mr.code.replace(/\d+$/, "")]}
              icon="bi-layers-fill"
              iconColor="#06b6d4"
              name={mr ? mr.section_name : "Nenhuma ainda"}
              stat={mr ? `${mr.code} · ×${mr.quantity - 1} cópias` : null}
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

      {/* Ranking de times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SurfaceCard className="flex flex-col gap-4">
          <SectionLabel>Mais Perto de Completar</SectionLabel>
          <TeamRankList teams={stats.top_teams} accent="#34d399" />
        </SurfaceCard>
        <SurfaceCard className="flex flex-col gap-4">
          <SectionLabel>Mais Longe de Completar</SectionLabel>
          <TeamRankList teams={stats.bottom_teams} accent="#f87171" />
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
