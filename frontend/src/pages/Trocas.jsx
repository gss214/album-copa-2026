import { useState, useEffect } from "react";
import { api } from "@/api";

// ── Paleta ───────────────────────────────────────────────────────────────────
const SURFACE   = "#132030";
const SURFACE_2 = "#1a2d42";
const GOLD      = "#d4a853";
const COPPER    = "#b87333";

// ── Helpers ──────────────────────────────────────────────────────────────────
const NON_TEAM_SECTIONS = new Set(["FWC", "CC"]);
const SPECIAL_NUMBERS   = new Set(["1", "13"]);

function fmtNum(num, sectionCode) {
  return SPECIAL_NUMBERS.has(num) && !NON_TEAM_SECTIONS.has(sectionCode)
    ? `${num}✨` : num;
}

function groupBySection(codes) {
  const map = new Map();
  for (const code of codes) {
    const m = code.match(/^([A-Za-z]+)(\d+)$/);
    if (!m) continue;
    const [, sec, num] = m;
    if (!map.has(sec)) map.set(sec, []);
    map.get(sec).push(num);
  }
  return map;
}

function buildFaltamText(codes) {
  if (!codes.length) return "";
  const groups = groupBySection(codes);
  const lines = [...groups.entries()].map(
    ([sec, nums]) => `*${sec}:* ${nums.map((n) => fmtNum(n, sec)).join(", ")}`
  );
  return `*FIGURINHAS QUE FALTAM (${codes.length}):*\n\n` + lines.join("\n\n");
}

function countTotalExtras(items) {
  return items.reduce((sum, item) => {
    const m = item.match(/\((\d+)x\)/);
    return sum + (m ? parseInt(m[1], 10) : 1);
  }, 0);
}

function buildRepetidaText(items) {
  if (!items.length) return "";
  const total = countTotalExtras(items);
  const map = new Map();
  for (const item of items) {
    const m = item.match(/^([A-Za-z]+)(\d+)\s*\((\d+)x\)$/);
    if (!m) continue;
    const [, sec, num, qty] = m;
    if (!map.has(sec)) map.set(sec, []);
    map.get(sec).push({ num, qty: parseInt(qty, 10) });
  }
  const lines = [...map.entries()].map(([sec, entries]) => {
    const formatted = entries.map(({ num, qty }) => `${fmtNum(num, sec)} (${qty}x)`).join(", ");
    return `*${sec}:* ${formatted}`;
  });
  return `*FIGURINHAS REPETIDAS (${total}):*\n\n` + lines.join("\n\n");
}

// ── CopyCard ─────────────────────────────────────────────────────────────────
function CopyCard({ title, icon, iconColor, accentColor, items, count, buildText }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildText(items)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayCount = count ?? items.length;

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background: SURFACE,
        border: `1px solid ${COPPER}22`,
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: `1px solid ${COPPER}18` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}18` }}
          >
            <i className={`bi ${icon} text-sm`} style={{ color: iconColor }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#e8d5b0" }}>{title}</span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ background: `${accentColor}15`, color: iconColor }}
          >
            {displayCount}
          </span>
        </div>
        <button
          onClick={handleCopy}
          disabled={items.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all disabled:opacity-40"
          style={
            copied
              ? { background: "rgba(52,211,153,0.15)", color: "#34d399" }
              : { background: SURFACE_2, color: "#7a9bb5", border: `1px solid ${COPPER}20` }
          }
        >
          <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"}`} />
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        {items.length === 0 ? (
          <p className="text-sm italic" style={{ color: "#4a6785" }}>Nenhuma figurinha nesta lista.</p>
        ) : (
          <div
            className="font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto rounded-xl p-4"
            style={{ background: "#0a1520", color: "#7a9bb5", border: `1px solid ${COPPER}15` }}
          >
            {buildText(items)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trocas ───────────────────────────────────────────────────────────────────
export default function Trocas() {
  const [trocas,  setTrocas]  = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.getTrocas()
      .then(setTrocas)
      .catch((e) => setError(e.message));
  }, []);

  const [shared, setShared] = useState(false);

  const buildAllText = () =>
    buildFaltamText(trocas.faltam) + "\n\n" + buildRepetidaText(trocas.repetidas);

  const handleShare = async () => {
    if (!trocas) return;
    const text = buildAllText();
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled — do nothing
      }
    } else {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-10 h-10 object-contain drop-shadow-lg" />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: GOLD, fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Trocas
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#4a6785" }}>
              Pronta para copiar e colar no WhatsApp
            </p>
          </div>
        </div>
        {trocas && (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-semibold transition-all"
            style={shared
              ? { background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }
              : { background: "rgba(37,211,102,0.12)", color: "#25d366", border: "1px solid rgba(37,211,102,0.25)" }
            }
          >
            <i className={`bi ${shared ? "bi-check2" : navigator.share ? "bi-share" : "bi-whatsapp"} text-base`} />
            {shared ? "Copiado!" : "Compartilhar"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm flex items-center gap-2" style={{ color: "#f87171" }}>
          <i className="bi bi-exclamation-circle" />{error}
        </p>
      )}

      {/* Skeleton */}
      {!trocas && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="h-96 rounded-2xl" style={{ background: SURFACE, border: `1px solid ${COPPER}15` }} />
          ))}
        </div>
      )}

      {/* Cards */}
      {trocas && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CopyCard
            title="Faltam"
            icon="bi-x-circle-fill"
            iconColor="#f87171"
            accentColor="#f87171"
            items={trocas.faltam}
            buildText={buildFaltamText}
          />
          <CopyCard
            title="Repetidas"
            icon="bi-layers-fill"
            iconColor="#38bdf8"
            accentColor="#38bdf8"
            items={trocas.repetidas}
            count={countTotalExtras(trocas.repetidas)}
            buildText={buildRepetidaText}
          />
        </div>
      )}
    </div>
  );
}
