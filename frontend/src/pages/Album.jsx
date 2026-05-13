import { useState, useEffect, useMemo } from "react";
import { api } from "@/api";
import { Card } from "@/components/ui/card";
import { LOGOS } from "@/lib/logos";

const GROUPS = [
  "Todos", "FWC",
  "Grupo A", "Grupo B", "Grupo C", "Grupo D",
  "Grupo E", "Grupo F", "Grupo G", "Grupo H",
  "Grupo I", "Grupo J", "Grupo K", "Grupo L",
  "Coca-Cola",
];

function StickerTile({ sticker, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const increment = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onUpdate(sticker.code, sticker.quantity + 1);
    } finally {
      setLoading(false);
    }
  };

  const decrement = async (e) => {
    e.preventDefault();
    if (loading || sticker.quantity === 0) return;
    setLoading(true);
    try {
      await onUpdate(sticker.code, sticker.quantity - 1);
    } finally {
      setLoading(false);
    }
  };

  const cls =
    sticker.quantity === 0
      ? "bg-zinc-800/70 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400"
      : sticker.quantity === 1
      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30"
      : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/30";

  return (
    <button
      onClick={increment}
      onContextMenu={decrement}
      disabled={loading}
      title={`${sticker.code} — clique: +1 | clique direito: -1`}
      className={`relative flex items-center justify-center rounded text-xs font-mono font-semibold transition-all select-none h-9 w-full ${cls}`}
    >
      {sticker.number}
      {sticker.quantity > 1 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-900 text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
          {sticker.quantity}
        </span>
      )}
    </button>
  );
}

function TeamCard({ sectionName, sectionCode, stickers, onUpdate }) {
  const coladas = stickers.filter((s) => s.quantity >= 1).length;
  const total = stickers.length;
  const pct = total ? Math.round((coladas / total) * 100) : 0;
  const done = coladas === total;
  const logo = LOGOS[sectionCode];

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {logo && (
            <img
              src={logo}
              alt={sectionName}
              className="w-8 h-8 object-contain shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-zinc-200 text-sm font-semibold leading-tight truncate">
              {sectionName}
            </span>
            <span className="text-zinc-600 text-xs font-mono">{sectionCode}</span>
          </div>
        </div>
        <span
          className={`text-xs tabular-nums font-medium shrink-0 ${
            done ? "text-emerald-400" : "text-zinc-500"
          }`}
        >
          {coladas}/{total}
        </span>
      </div>

      <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-0.5 rounded-full transition-all duration-300 ${
            done ? "bg-emerald-400" : "bg-emerald-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-5 gap-1">
        {stickers.map((s) => (
          <StickerTile key={s.code} sticker={s} onUpdate={onUpdate} />
        ))}
      </div>
    </Card>
  );
}

function GroupSection({ groupName, teamMap, onUpdate }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">
        {groupName}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...teamMap.entries()].map(([key, stickers]) => {
          const first = stickers[0];
          return (
            <TeamCard
              key={key}
              sectionName={first.section_name}
              sectionCode={first.section_code}
              stickers={stickers}
              onUpdate={onUpdate}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Album() {
  const [stickers, setStickers] = useState([]);
  const [group, setGroup] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getStickers()
      .then(setStickers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (code, qty) => {
    const updated = await api.updateSticker(code, qty);
    setStickers((prev) =>
      prev.map((s) => (s.code === updated.code ? updated : s))
    );
  };

  // group_name → section_key → stickers[]
  const grouped = useMemo(() => {
    const filtered =
      group === "Todos" ? stickers : stickers.filter((s) => s.group_name === group);

    const byGroup = new Map();
    for (const s of filtered) {
      if (!byGroup.has(s.group_name)) byGroup.set(s.group_name, new Map());
      const teamKey = `${s.section_code}__${s.section_name}`;
      const byTeam = byGroup.get(s.group_name);
      if (!byTeam.has(teamKey)) byTeam.set(teamKey, []);
      byTeam.get(teamKey).push(s);
    }
    return byGroup;
  }, [stickers, group]);

  const coladas = stickers.filter((s) => s.quantity >= 1).length;
  const total = stickers.length;
  const pct = total ? Math.round((coladas / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Álbum</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Clique na figurinha para marcar · clique direito para desmarcar
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="text-emerald-400 font-semibold tabular-nums">{coladas}</span>
            <span>/ {total}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-amber-400 font-semibold tabular-nums">{pct}%</span>
          </div>
        )}
      </div>

      {/* Filtro de grupo */}
      <div className="flex flex-wrap gap-1.5">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              group === g
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}
      {loading && <p className="text-zinc-500 text-sm">Carregando...</p>}

      {/* Conteúdo */}
      {!loading && (
        <div className="flex flex-col gap-8">
          {[...grouped.entries()].map(([groupName, teamMap]) => (
            <GroupSection
              key={groupName}
              groupName={groupName}
              teamMap={teamMap}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
