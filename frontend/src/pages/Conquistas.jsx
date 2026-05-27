import { useState, useEffect } from "react";
import { api } from "@/api";

const GOLD   = "#d4a853";
const COPPER = "#b87333";
const SURFACE  = "#132030";
const SURFACE_2 = "#1a2d42";

function Badge({ icon, title, desc, unlocked, accent = GOLD }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-4 transition-all"
      style={{
        background: unlocked ? `${accent}0d` : SURFACE,
        border: `1px solid ${unlocked ? `${accent}40` : `${COPPER}18`}`,
        opacity: unlocked ? 1 : 0.45,
        boxShadow: unlocked ? `0 0 20px ${accent}18` : "none",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
        style={{
          background: unlocked ? `${accent}18` : SURFACE_2,
          filter: unlocked ? "none" : "grayscale(1)",
        }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="text-sm font-semibold leading-tight"
          style={{ color: unlocked ? "#e8d5b0" : "#4a6785" }}
        >
          {title}
        </span>
        <span className="text-xs leading-snug" style={{ color: unlocked ? "#7a9bb5" : "#374151" }}>
          {desc}
        </span>
        {unlocked && (
          <span className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: accent }}>
            Desbloqueado
          </span>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: COPPER }}>
        {title}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
}

export default function Conquistas() {
  const [summary, setSummary] = useState(null);
  const [stats,   setStats]   = useState(null);
  const [raras,   setRaras]   = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      api.getSummary(),
      api.getStats(),
      api.getStickers({ group_name: "Raras" }),
    ])
      .then(([s, st, r]) => { setSummary(s); setStats(st); setRaras(r); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-rose-400 text-sm">{error}</p>;

  if (!summary || !stats || !raras) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-10 w-48 rounded-lg" style={{ background: SURFACE }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: SURFACE }} />
          ))}
        </div>
      </div>
    );
  }

  const pct = summary.percentual;
  const completedGroups = stats.group_progress.filter((g) => g.coladas === g.total && g.total > 0);
  const rarasColadas = raras.filter((r) => r.quantity >= 1).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-10 h-10 object-contain drop-shadow-lg" />
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: GOLD, fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Conquistas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#4a6785" }}>
            {completedGroups.length > 0 || pct >= 10
              ? `${[
                  pct >= 100 && "Álbum completo!",
                  pct >= 50 && "Mais da metade!",
                  completedGroups.length > 0 && `${completedGroups.length} grupo${completedGroups.length > 1 ? "s" : ""} completo${completedGroups.length > 1 ? "s" : ""}`,
                ].filter(Boolean).join(" · ")}`
              : "Continue colando para desbloquear conquistas"}
          </p>
        </div>
      </div>

      {/* Progresso geral */}
      <Section title="Progresso do Álbum">
        <Badge icon="⭐" title="Primeiros Passos" desc="Cole sua primeira figurinha" unlocked={summary.coladas >= 1} />
        <Badge icon="🔥" title="Aquecendo" desc="10% do álbum completo" unlocked={pct >= 10} />
        <Badge icon="📈" title="No Ritmo" desc="25% do álbum completo" unlocked={pct >= 25} />
        <Badge icon="⚡" title="Na Metade" desc="50% do álbum completo" unlocked={pct >= 50} accent="#38bdf8" />
        <Badge icon="🚀" title="Quase Lá" desc="75% do álbum completo" unlocked={pct >= 75} accent="#a78bfa" />
        <Badge icon="🏆" title="Álbum Completo" desc="100% das figurinhas coladas" unlocked={pct >= 100} accent="#34d399" />
      </Section>

      {/* Grupos */}
      <Section title="Grupos">
        <Badge icon="🗂️" title="Primeiro Grupo" desc="Complete um grupo inteiro" unlocked={completedGroups.length >= 1} />
        <Badge icon="📚" title="Colecionador" desc="Complete 5 grupos" unlocked={completedGroups.length >= 5} />
        <Badge icon="🌍" title="Dominador" desc="Complete todos os grupos" unlocked={completedGroups.length >= stats.group_progress.length && stats.group_progress.length > 0} accent="#34d399" />
      </Section>

      {/* Raras */}
      <Section title="Raras">
        <Badge icon="✨" title="Primeira Rara" desc="Consiga sua primeira figurinha rara" unlocked={rarasColadas >= 1} accent="#a78bfa" />
        <Badge icon="💎" title="Raridade" desc="Consiga 10 figurinhas raras" unlocked={rarasColadas >= 10} accent="#a78bfa" />
        <Badge icon="👑" title="Lenda" desc="Complete todas as figurinhas raras" unlocked={rarasColadas >= raras.length && raras.length > 0} accent="#d4a853" />
      </Section>

      {/* Repetidas */}
      <Section title="Repetidas">
        <Badge icon="📦" title="Sobras" desc="Acumule 10 repetidas" unlocked={summary.repetidas >= 10} accent={COPPER} />
        <Badge icon="🏪" title="Bazar" desc="Acumule 50 repetidas" unlocked={summary.repetidas >= 50} accent={COPPER} />
        <Badge icon="🏭" title="Fábrica" desc="Acumule 100 repetidas" unlocked={summary.repetidas >= 100} accent={COPPER} />
      </Section>
    </div>
  );
}
