import { useState, useEffect } from "react";
import { api } from "@/api";
import { Card } from "@/components/ui/card";
import { LOGOS } from "@/lib/logos";

function StatCard({ icon, label, value, sub, color = "text-zinc-100" }) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <span className="text-zinc-500 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
        <i className={`bi ${icon}`} /> {label}
      </span>
      <span className={`text-3xl font-bold tabular-nums ${color}`}>{value}</span>
      {sub && <span className="text-zinc-500 text-xs">{sub}</span>}
    </Card>
  );
}

function ProgressRing({ pct }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#27272a" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke="#34d399"
          strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="70" y="66" textAnchor="middle" fill="#f4f4f5" fontSize="22" fontWeight="bold">
          {pct}%
        </text>
        <text x="70" y="84" textAnchor="middle" fill="#71717a" fontSize="11">
          completo
        </text>
      </svg>
    </div>
  );
}

function GroupProgressBar({ group, coladas, total, pct }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-zinc-400 text-xs w-16 shrink-0">{group}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-zinc-500 text-xs tabular-nums w-16 text-right shrink-0">
        {coladas}/{total}
      </span>
    </div>
  );
}

function HighlightRow({ icon, iconColor, label, children }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-800/60 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-800 ${iconColor}`}>
        <i className={`bi ${icon} text-sm`} />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-zinc-500 text-xs">{label}</span>
        <div className="text-zinc-100 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.getSummary(), api.getStats()])
      .then(([s, st]) => { setSummary(s); setStats(st); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-rose-400 text-sm">{error}</p>;
  if (!summary || !stats) return <p className="text-zinc-500 text-sm">Carregando...</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Visão geral do álbum Copa 2026</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon="bi-collection" label="Total do álbum" value={summary.total} />
        <StatCard icon="bi-check2-square" label="Coladas" value={summary.coladas} color="text-emerald-400" />
        <StatCard icon="bi-x-square" label="Faltam" value={summary.faltam} color="text-rose-400" />
        <StatCard icon="bi-percent" label="Conclusão" value={`${summary.percentual}%`} color="text-amber-400" />
        <StatCard icon="bi-layers" label="Repetidas" value={summary.repetidas} sub="figurinhas extras" color="text-sky-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progresso geral */}
        <Card className="p-6 flex flex-col items-center gap-4">
          <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider self-start">
            Progresso geral
          </span>
          <ProgressRing pct={summary.percentual} />
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-zinc-400">Coladas: <strong className="text-zinc-100">{summary.coladas}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              <span className="text-zinc-400">Faltam: <strong className="text-zinc-100">{summary.faltam}</strong></span>
            </div>
          </div>
        </Card>

        {/* Destaques */}
        <Card className="p-6 flex flex-col gap-1">
          <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">
            Destaques
          </span>

          {stats.most_repeated ? (
            <HighlightRow icon="bi-layers-fill" iconColor="text-sky-400" label="Figurinha mais repetida">
              <span className="font-mono text-sky-300 text-xs bg-zinc-800 px-1.5 py-0.5 rounded mr-2">
                {stats.most_repeated.code}
              </span>
              {stats.most_repeated.section_name}
              <span className="text-amber-400 ml-2 text-xs">×{stats.most_repeated.quantity}</span>
            </HighlightRow>
          ) : (
            <HighlightRow icon="bi-layers-fill" iconColor="text-sky-400" label="Figurinha mais repetida">
              <span className="text-zinc-600">Nenhuma ainda</span>
            </HighlightRow>
          )}

          {stats.closest_team ? (
            <HighlightRow icon="bi-trophy-fill" iconColor="text-amber-400" label="Time mais perto de completar">
              <div className="flex items-center gap-2">
                {LOGOS[stats.closest_team.section_code] && (
                  <img src={LOGOS[stats.closest_team.section_code]} className="w-5 h-5 object-contain" />
                )}
                <span>{stats.closest_team.section_name}</span>
                <span className="text-zinc-500 text-xs tabular-nums">
                  {stats.closest_team.coladas}/{stats.closest_team.total}
                  <span className="text-emerald-400 ml-1">({stats.closest_team.pct}%)</span>
                </span>
              </div>
            </HighlightRow>
          ) : (
            <HighlightRow icon="bi-trophy-fill" iconColor="text-amber-400" label="Time mais perto de completar">
              <span className="text-zinc-600">Nenhum ainda</span>
            </HighlightRow>
          )}

          {stats.closest_group ? (
            <HighlightRow icon="bi-star-fill" iconColor="text-emerald-400" label="Grupo mais perto de completar">
              <span>{stats.closest_group.group}</span>
              <span className="text-zinc-500 text-xs tabular-nums ml-2">
                {stats.closest_group.coladas}/{stats.closest_group.total}
                <span className="text-emerald-400 ml-1">({stats.closest_group.pct}%)</span>
              </span>
            </HighlightRow>
          ) : (
            <HighlightRow icon="bi-star-fill" iconColor="text-emerald-400" label="Grupo mais perto de completar">
              <span className="text-zinc-600">Nenhum ainda</span>
            </HighlightRow>
          )}
        </Card>
      </div>

      {/* Progresso por grupo */}
      <Card className="p-6 flex flex-col gap-4">
        <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
          Progresso por grupo
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
          {stats.group_progress.map((g) => (
            <GroupProgressBar key={g.group} {...g} />
          ))}
        </div>
      </Card>
    </div>
  );
}
