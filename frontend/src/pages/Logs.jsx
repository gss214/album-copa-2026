import { useState, useEffect, useMemo } from "react";
import { api } from "@/api";

// ── Paleta ───────────────────────────────────────────────────────────────────
const SURFACE   = "#132030";
const SURFACE_2 = "#1a2d42";
const GOLD      = "#d4a853";
const COPPER    = "#b87333";

// ── Helpers ──────────────────────────────────────────────────────────────────
const TZ = "America/Sao_Paulo";

function toBRT(isoString) {
  return new Date(new Date(isoString).toLocaleString("en-US", { timeZone: TZ }));
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return toBRT(isoString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function dayKey(isoString) {
  const brt = toBRT(isoString);
  const y = brt.getFullYear();
  const m = String(brt.getMonth() + 1).padStart(2, "0");
  const d = String(brt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayLabel(key) {
  const [y, m, d] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const todayBRT  = toBRT(new Date().toISOString());
  const today = new Date(todayBRT.getFullYear(), todayBRT.getMonth(), todayBRT.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

function actionLabel(before, after) {
  if (after > before) return after === 1 ? "Colada" : "Repetida adicionada";
  return before === 1 ? "Descolada" : "Repetida removida";
}

// ── LogRow ────────────────────────────────────────────────────────────────────
function LogRow({ log, isLast, onUndo }) {
  const [undoing, setUndoing] = useState(false);
  const added = log.quantity_after > log.quantity_before;

  const handleUndo = async () => {
    setUndoing(true);
    try { await onUndo(log.id); }
    finally { setUndoing(false); }
  };

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5"
      style={!isLast ? { borderBottom: `1px solid ${COPPER}15` } : {}}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm"
        style={
          added
            ? { background: "rgba(52,211,153,0.12)", color: "#34d399" }
            : { background: "rgba(248,113,113,0.12)", color: "#f87171" }
        }
      >
        <i className={`bi ${added ? "bi-plus-lg" : "bi-dash-lg"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono font-semibold" style={{ color: "#e8d5b0" }}>
            {log.sticker_code}
          </span>
          <span className="text-xs truncate" style={{ color: "#4a6785" }}>
            {log.sticker_section_name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-medium" style={{ color: added ? "#34d399" : "#f87171" }}>
            {actionLabel(log.quantity_before, log.quantity_after)}
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ background: SURFACE_2, color: "#4a6785" }}
          >
            {log.quantity_before} → {log.quantity_after}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs" style={{ color: "#4a6785" }} title={formatDate(log.created_at)}>
          {timeAgo(log.created_at)}
        </span>
        <button
          onClick={handleUndo}
          disabled={undoing}
          title="Desfazer"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 hover:opacity-80"
          style={{ background: SURFACE_2, color: "#7a9bb5", border: `1px solid ${COPPER}20` }}
        >
          {undoing
            ? <i className="bi bi-arrow-repeat text-xs animate-spin" />
            : <i className="bi bi-arrow-counterclockwise text-xs" />}
        </button>
      </div>
    </div>
  );
}

// ── Logs ──────────────────────────────────────────────────────────────────────
export default function Logs() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [dayIdx,  setDayIdx]  = useState(0);

  const fetchLogs = () =>
    api.getLogs()
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { fetchLogs(); }, []);

  const handleUndo = async (logId) => {
    try {
      await api.undoLog(logId);
      setLoading(true);
      await fetchLogs();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const days = useMemo(() => {
    const map = new Map();
    for (const log of logs) {
      const k = dayKey(log.created_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(log);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  const totalDays   = days.length;
  const currentDay  = days[dayIdx];
  const currentLogs = currentDay?.[1] ?? [];

  const goTo = (idx) => setDayIdx(Math.max(0, Math.min(idx, totalDays - 1)));

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-10 h-10 object-contain drop-shadow-lg" />
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: GOLD, fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Histórico
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#4a6785" }}>
            Últimas alterações nas figurinhas
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm flex items-center gap-2" style={{ color: "#f87171" }}>
          <i className="bi bi-exclamation-circle" />{error}
        </p>
      )}

      {loading && (
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: SURFACE, border: `1px solid ${COPPER}15` }} />
      )}

      {!loading && logs.length === 0 && (
        <p className="text-sm" style={{ color: "#4a6785" }}>Nenhuma alteração registrada ainda.</p>
      )}

      {!loading && days.length > 0 && (
        <>
          {/* Navegação por dia */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => goTo(dayIdx + 1)}
              disabled={dayIdx >= totalDays - 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: SURFACE_2, color: "#7a9bb5", border: `1px solid ${COPPER}20` }}
            >
              <i className="bi bi-chevron-left text-sm" />
            </button>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {days.map(([key], i) => (
                <button
                  key={key}
                  onClick={() => setDayIdx(i)}
                  className="px-3 py-1 text-xs rounded-full font-medium transition-all"
                  style={
                    i === dayIdx
                      ? { background: `${COPPER}35`, color: GOLD, border: `1px solid ${COPPER}50` }
                      : { background: SURFACE_2, color: "#4a6785" }
                  }
                >
                  {dayLabel(key)}
                </button>
              ))}
            </div>

            <button
              onClick={() => goTo(dayIdx - 1)}
              disabled={dayIdx <= 0}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: SURFACE_2, color: "#7a9bb5", border: `1px solid ${COPPER}20` }}
            >
              <i className="bi bi-chevron-right text-sm" />
            </button>
          </div>

          {/* Cabeçalho do dia */}
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] uppercase tracking-widest font-semibold"
              style={{ color: COPPER }}
            >
              {dayLabel(currentDay[0])} — {currentDay[0]}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{ background: SURFACE_2, color: "#4a6785" }}
            >
              {currentLogs.length} {currentLogs.length === 1 ? "alteração" : "alterações"}
            </span>
          </div>

          {/* Lista do dia */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: SURFACE,
              border: `1px solid ${COPPER}22`,
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            {currentLogs.map((log, i) => (
              <LogRow
                key={log.id}
                log={log}
                isLast={i === currentLogs.length - 1}
                onUndo={handleUndo}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
