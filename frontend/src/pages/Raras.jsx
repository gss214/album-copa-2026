import { useState, useEffect, useMemo } from "react";
import { api } from "@/api";
import { Card } from "@/components/ui/card";
import { LOGOS } from "@/lib/logos";
import { RARE_PLAYERS, VARIANT_STYLES } from "@/lib/rarePlayers";

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

function PlayerCard({ sectionCode, stickers, onUpdate }) {
  const player = RARE_PLAYERS[sectionCode];
  const logo = player ? LOGOS[player.code] : null;
  const collected = stickers.filter((s) => s.quantity >= 1).length;
  const complete = collected === 4;

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        {logo && (
          <img
            src={logo}
            alt={player?.country}
            className="w-8 h-8 object-contain shrink-0"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-zinc-100 text-sm font-semibold leading-tight truncate">
            {player?.name ?? sectionCode}
          </span>
          <span className="text-zinc-500 text-xs truncate">{player?.country}</span>
        </div>
        <span className={`text-xs tabular-nums font-medium shrink-0 ${complete ? "text-emerald-400" : "text-zinc-600"}`}>
          {collected}/4
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {stickers.map((s) => (
          <VariantTile key={s.code} sticker={s} onUpdate={onUpdate} />
        ))}
      </div>
    </Card>
  );
}

export default function Raras() {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // section_code → stickers[]
  const byPlayer = useMemo(() => {
    const map = new Map();
    for (const s of stickers) {
      if (!map.has(s.section_code)) map.set(s.section_code, []);
      map.get(s.section_code).push(s);
    }
    return map;
  }, [stickers]);

  const collected = stickers.filter((s) => s.quantity >= 1).length;
  const total = stickers.length;
  const completePlayers = [...byPlayer.values()].filter((s) => s.every((x) => x.quantity >= 1)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Figurinhas Raras</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            20 jogadores · 4 variantes cada — Ouro, Prata, Bronze e Lilás
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-emerald-400 font-semibold tabular-nums">{collected}</span>
              <span>/ {total} figurinhas</span>
            </div>
            <span className="text-zinc-700">·</span>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-amber-400 font-semibold tabular-nums">{completePlayers}</span>
              <span>/ 20 jogadores completos</span>
            </div>
          </div>
        )}
      </div>

      {/* Legenda de variantes */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: "Ouro",   cls: "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30" },
          { label: "Prata",  cls: "bg-zinc-400/20 text-zinc-300 ring-1 ring-zinc-400/30" },
          { label: "Bronze", cls: "bg-orange-700/20 text-orange-400 ring-1 ring-orange-600/30" },
          { label: "Lilás",  cls: "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30" },
        ].map(({ label, cls }) => (
          <span key={label} className={`px-2.5 py-1 text-xs rounded-full font-semibold ${cls}`}>
            {label}
          </span>
        ))}
        <span className="text-zinc-600 text-xs ml-1">
          Clique para marcar · clique direito para desmarcar
        </span>
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}
      {loading && <p className="text-zinc-500 text-sm">Carregando...</p>}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
