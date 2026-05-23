import { useState, useEffect } from "react";
import { api } from "@/api";
import { Card } from "@/components/ui/card";

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString + "Z").getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

function formatDate(isoString) {
  return new Date(isoString + "Z").toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionLabel(before, after) {
  if (after > before) return after === 1 ? "Colada" : "Repetida adicionada";
  return before === 1 ? "Descolada" : "Repetida removida";
}

function LogRow({ log }) {
  const added = log.quantity_after > log.quantity_before;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 last:border-0">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm ${
          added
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-rose-500/20 text-rose-400"
        }`}
      >
        <i className={`bi ${added ? "bi-plus-lg" : "bi-dash-lg"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-100 text-sm font-mono font-semibold">
            {log.sticker_code}
          </span>
          <span className="text-zinc-500 text-xs truncate">
            {log.sticker_section_name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-xs font-medium ${
              added ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {actionLabel(log.quantity_before, log.quantity_after)}
          </span>
          <span className="text-zinc-700 text-xs">
            {log.quantity_before} → {log.quantity_after}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-zinc-600 text-xs" title={formatDate(log.created_at)}>
          {timeAgo(log.created_at)}
        </span>
      </div>
    </div>
  );
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getLogs()
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Histórico</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Últimas alterações nas figurinhas
        </p>
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      {loading && (
        <Card className="animate-pulse h-64" />
      )}

      {!loading && logs.length === 0 && (
        <p className="text-zinc-600 text-sm">Nenhuma alteração registrada ainda.</p>
      )}

      {!loading && logs.length > 0 && (
        <Card className="p-0 overflow-hidden">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </Card>
      )}
    </div>
  );
}
