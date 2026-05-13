import { useState, useEffect } from "react";
import { api } from "@/api";
import { Card } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#34d399", "#f87171"];

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

const RTOOLTIP = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm">
      <span className="text-zinc-300">{payload[0].name}: </span>
      <span className="font-bold text-zinc-100">{payload[0].value}</span>
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getSummary()
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-rose-400 text-sm">{error}</p>;
  }
  if (!summary) {
    return <p className="text-zinc-500 text-sm">Carregando...</p>;
  }

  const pieData = [
    { name: "Coladas", value: summary.coladas },
    { name: "Faltam", value: summary.faltam },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Visão geral do álbum Copa 2026</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon="bi-collection" label="Total do álbum" value={summary.total} />
        <StatCard
          icon="bi-check2-square"
          label="Coladas"
          value={summary.coladas}
          color="text-emerald-400"
        />
        <StatCard
          icon="bi-x-square"
          label="Faltam"
          value={summary.faltam}
          color="text-rose-400"
        />
        <StatCard
          icon="bi-percent"
          label="Conclusão"
          value={`${summary.percentual}%`}
          color="text-amber-400"
        />
        <StatCard
          icon="bi-layers"
          label="Repetidas"
          value={summary.repetidas}
          sub="figurinhas extras"
          color="text-sky-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <Card className="p-6 flex flex-col gap-4">
          <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
            Distribuição
          </span>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<RTOOLTIP />} />
              <Legend
                formatter={(value) => (
                  <span className="text-zinc-400 text-xs">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
