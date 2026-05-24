import { useState, useEffect, useMemo } from "react";
import { api } from "@/api";
import { LOGOS } from "@/lib/logos";
import { RARE_PLAYERS, VARIANT_STYLES } from "@/lib/rarePlayers";

// ── Paleta ───────────────────────────────────────────────────────────────────
const SURFACE   = "#132030";
const SURFACE_2 = "#1a2d42";
const GOLD      = "#d4a853";
const COPPER    = "#b87333";

// ── VariantTile ───────────────────────────────────────────────────────────────
function VariantTile({ sticker, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const style = VARIANT_STYLES[sticker.number] ?? VARIANT_STYLES["Prata"];

  const increment = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try { await onUpdate(sticker.code, sticker.quantity + 1); }
    finally { setLoading(false); }
  };

  const decrement = async (e) => {
    e.preventDefault();
    if (loading || sticker.quantity === 0) return;
    setLoading(true);
    try { await onUpdate(sticker.code, sticker.quantity - 1); }
    finally { setLoading(false); }
  };

  const cls = sticker.quantity >= 1 ? style.active : style.empty;

  return (
    <button
      onClick={increment}
      onContextMenu={decrement}
      disabled={loading}
      title={`${sticker.code} — clique: +1 | clique direito: -1`}
      className={`relative flex flex-col items-center justify-center gap-0.5 rounded-md py-2 px-1 text-xs font-semibold transition-all select-none ${cls}`}
    >
      <span className="text-[10px] leading-none">{sticker.number}</span>
      {sticker.quantity > 1 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-900 text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
          {sticker.quantity}
        </span>
      )}
    </button>
  );
}

// ── PlayerLogo ────────────────────────────────────────────────────────────────
function PlayerLogo({ logo, sectionCode, country }) {
  const [error, setError] = useState(false);
  if (!logo || error) {
    return (
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: SURFACE_2, color: "#7a9bb5" }}
      >
        {sectionCode.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={logo}
      alt={country}
      className="w-9 h-9 object-contain shrink-0 drop-shadow-md"
      onError={() => setError(true)}
    />
  );
}

// ── PlayerCard ────────────────────────────────────────────────────────────────
function PlayerCard({ sectionCode, stickers, onUpdate }) {
  const player    = RARE_PLAYERS[sectionCode];
  const logo      = player ? LOGOS[player.code] : null;
  const collected = stickers.filter((s) => s.quantity >= 1).length;
  const complete  = collected === 4;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: SURFACE,
        border: `1px solid ${complete ? "#34d39930" : `${COPPER}22`}`,
        boxShadow: complete
          ? "inset 0 2px 8px rgba(0,0,0,0.45), 0 0 14px rgba(52,211,153,0.07)"
          : "inset 0 2px 8px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <PlayerLogo logo={logo} sectionCode={sectionCode} country={player?.country} />
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-sm font-semibold leading-tight truncate" style={{ color: "#e8d5b0" }}>
            {player?.name ?? sectionCode}
          </span>
          <span className="text-xs truncate" style={{ color: "#4a6785" }}>{player?.country}</span>
        </div>
        <span
          className="text-xs tabular-nums font-semibold shrink-0"
          style={{ color: complete ? "#34d399" : "#4a6785" }}
        >
          {collected}/4
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {stickers.map((s) => (
          <VariantTile key={s.code} sticker={s} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

// ── Raras ─────────────────────────────────────────────────────────────────────
export default function Raras() {
  const [stickers, setStickers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    api.getStickers({ group_name: "Raras" })
      .then(setStickers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (code, qty) => {
    const updated = await api.updateSticker(code, qty);
    setStickers((prev) => prev.map((s) => (s.code === updated.code ? updated : s)));
  };

  const byPlayer = useMemo(() => {
    const map = new Map();
    for (const s of stickers) {
      if (!map.has(s.section_code)) map.set(s.section_code, []);
      map.get(s.section_code).push(s);
    }
    return map;
  }, [stickers]);

  const collected       = stickers.filter((s) => s.quantity >= 1).length;
  const total           = stickers.length;
  const completePlayers = [...byPlayer.values()].filter((s) => s.every((x) => x.quantity >= 1)).length;

  const VARIANTS = [
    { label: "Ouro",   color: "#eab308", bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.25)"   },
    { label: "Prata",  color: "#d1d5db", bg: "rgba(209,213,219,0.1)",  border: "rgba(209,213,219,0.2)"  },
    { label: "Bronze", color: "#c2763a", bg: "rgba(194,118,58,0.12)",  border: "rgba(194,118,58,0.25)"  },
    { label: "Lilás",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
  ];

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
              Raras
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#4a6785" }}>
              20 jogadores · 4 variantes cada — Ouro, Prata, Bronze e Lilás
            </p>
          </div>
        </div>

        {/* Stats chip */}
        {total > 0 && (
          <div
            className="flex items-center gap-3 text-sm px-4 py-2 rounded-xl"
            style={{ background: SURFACE, border: `1px solid ${COPPER}20` }}
          >
            <div className="flex items-center gap-1.5">
              <span className="tabular-nums font-semibold" style={{ color: "#34d399" }}>{collected}</span>
              <span style={{ color: "#4a6785" }}>/ {total} fig.</span>
            </div>
            <span style={{ color: `${COPPER}50` }}>·</span>
            <div className="flex items-center gap-1.5">
              <span className="tabular-nums font-semibold" style={{ color: GOLD }}>{completePlayers}</span>
              <span style={{ color: "#4a6785" }}>/ 20 completos</span>
            </div>
          </div>
        )}
      </div>

      {/* Legenda de variantes */}
      <div className="flex items-center gap-2 flex-wrap">
        {VARIANTS.map(({ label, color, bg, border }) => (
          <span
            key={label}
            className="px-2.5 py-1 text-xs rounded-full font-semibold"
            style={{ background: bg, color, border: `1px solid ${border}` }}
          >
            {label}
          </span>
        ))}
        <span className="text-xs ml-1" style={{ color: "#4a6785" }}>
          Clique para marcar · clique direito para desmarcar
        </span>
      </div>

      {error && (
        <p className="text-sm flex items-center gap-2" style={{ color: "#f87171" }}>
          <i className="bi bi-exclamation-circle" />{error}
        </p>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl" style={{ background: SURFACE, border: `1px solid ${COPPER}15` }} />
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {[...byPlayer.entries()].map(([sectionCode, playerStickers]) => (
            <PlayerCard
              key={sectionCode}
              sectionCode={sectionCode}
              stickers={playerStickers}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
