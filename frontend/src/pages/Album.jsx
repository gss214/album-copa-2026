import { useState, useEffect, useMemo, useRef } from "react";
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

const EXCLUDED_GROUPS = new Set(["Raras"]);

const normalize = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Stickers 1 = Escudo, 13 = Perfilada (only for team sections, not FWC/CC)
const SPECIAL_LABELS = { "1": "Escudo", "13": "Perfilada" };

function isSpecialSticker(s) {
  return (s.number === "1" || s.number === "13") &&
    s.section_code !== "FWC" && s.section_code !== "CC";
}

function StickerTile({ sticker, onUpdate, onlyMissing, withRepeated }) {
  const [loading, setLoading] = useState(false);
  const longPressTimer = useRef(null);

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

  const onTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      decrement({ preventDefault: () => {} });
    }, 500);
  };

  const onTouchEnd = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    } else {
      e.preventDefault();
    }
  };

  const isSpecial = isSpecialSticker(sticker);
  const cls = isSpecial
    ? sticker.quantity === 0
      ? "bg-sky-900/40 text-sky-600 hover:bg-sky-900/60 hover:text-sky-400"
      : "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/30"
    : sticker.quantity === 0
      ? "bg-zinc-800/70 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400"
      : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30";

  const specialLabel = SPECIAL_LABELS[sticker.number] && isSpecial
    ? SPECIAL_LABELS[sticker.number]
    : null;

  const titleParts = [];
  if (specialLabel) titleParts.push(specialLabel);
  titleParts.push(sticker.player_name ? `${sticker.code} · ${sticker.player_name}` : sticker.code);

  const invisible = (onlyMissing && sticker.quantity >= 1) || (withRepeated && sticker.quantity <= 1);

  return (
    <button
      onClick={increment}
      onContextMenu={decrement}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      disabled={loading || invisible}
      title={titleParts.join(" — ")}
      className={`relative flex flex-col items-center justify-center rounded text-xs font-mono font-semibold transition-all select-none h-14 w-full gap-0.5 px-0.5 ${cls} ${invisible ? "invisible" : ""}`}
    >
      <span className="leading-none">{sticker.number}</span>
      {sticker.player_name && (
        <span className="text-[8px] font-sans font-normal leading-tight text-center truncate w-full px-0.5 opacity-70">
          {sticker.section_code === "FWC"
            ? sticker.player_name
            : sticker.player_name.split(" ").slice(-1)[0]}
        </span>
      )}
      {specialLabel && (
        <span className="text-[7px] font-sans font-bold leading-none opacity-60 uppercase tracking-wide">
          {specialLabel}
        </span>
      )}
      {sticker.quantity > 1 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-900 text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
          {sticker.quantity}
        </span>
      )}
    </button>
  );
}

function TeamCard({ sectionName, sectionCode, stickers, onUpdate, onlyMissing, withRepeated }) {
  const coladas = stickers.filter((s) => s.quantity >= 1).length;
  const total = stickers.length;
  const pct = total ? Math.round((coladas / total) * 100) : 0;
  const done = coladas === total;
  const logo = LOGOS[sectionCode];

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
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
          <span className={`text-xs tabular-nums font-medium shrink-0 ${done ? "text-emerald-400" : "text-zinc-500"}`}>
            {coladas}/{total}
          </span>
        </div>
        {/* Micro progress bar at the bottom of the header */}
        <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-0.5 rounded-full transition-all duration-300 ${done ? "bg-emerald-400" : "bg-emerald-600"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {stickers.map((s) => (
          <StickerTile key={s.code} sticker={s} onUpdate={onUpdate} onlyMissing={onlyMissing} withRepeated={withRepeated} />
        ))}
      </div>
    </Card>
  );
}

function GroupSection({ groupName, teamMap, onUpdate, onlyMissing, withRepeated }) {
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
              onlyMissing={onlyMissing}
              withRepeated={withRepeated}
            />
          );
        })}
      </div>
    </div>
  );
}

const STATUS_FILTERS = [
  { key: "all", label: "Todas" },
  { key: "incomplete", label: "Incompletas" },
  { key: "complete", label: "Completas" },
  { key: "not_started", label: "Não iniciadas" },
];

const STATUS_ACTIVE_CLS = {
  all: "bg-zinc-700 text-zinc-100",
  incomplete: "bg-amber-400 text-zinc-900",
  complete: "bg-sky-500 text-white",
  not_started: "bg-zinc-600 text-zinc-100",
};

const INACTIVE_CLS = "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800";

function teamStatus(stickers) {
  const coladas = stickers.filter((s) => s.quantity >= 1).length;
  if (coladas === 0) return "not_started";
  if (coladas === stickers.length) return "complete";
  return "incomplete";
}

function teamHasRepeated(stickers) {
  return stickers.some((s) => s.quantity > 1);
}

function ImportConfirmModal({ onConfirm, onCancel, count }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <i className="bi bi-exclamation-triangle-fill" />
          </div>
          <div>
            <p className="text-zinc-100 font-semibold text-sm">Substituir dados?</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              Você já tem figurinhas marcadas. O CSV importado irá substituir todas as quantidades.
            </p>
          </div>
        </div>
        <p className="text-zinc-400 text-xs bg-zinc-800 rounded-lg px-3 py-2">
          <span className="text-zinc-100 font-semibold">{count} figurinhas</span> serão atualizadas.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs rounded-lg bg-amber-500 text-zinc-900 hover:bg-amber-400 transition-colors font-semibold"
          >
            Importar assim mesmo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Album() {
  const [stickers, setStickers] = useState([]);
  const [group, setGroup] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [specialOnly, setSpecialOnly] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [withRepeated, setWithRepeated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api
      .getStickers()
      .then(setStickers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (code, qty) => {
    const updated = await api.updateSticker(code, qty);
    setStickers((prev) => prev.map((s) => (s.code === updated.code ? updated : s)));
  };

  const handleExport = () => {
    const rows = ["code,quantity", ...stickers.map((s) => `${s.code},${s.quantity}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    a.download = `album-copa-2026_${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) throw new Error("Arquivo vazio.");
    const header = lines[0].toLowerCase();
    if (!header.includes("code") || !header.includes("quantity"))
      throw new Error("Formato inválido. O CSV deve ter colunas 'code' e 'quantity'.");
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length < 2) throw new Error(`Linha ${i + 1} inválida: "${lines[i]}"`);
      const code = parts[0].trim();
      const quantity = parseInt(parts[1].trim(), 10);
      if (!code) throw new Error(`Código vazio na linha ${i + 1}.`);
      if (isNaN(quantity) || quantity < 0)
        throw new Error(`Quantidade inválida na linha ${i + 1}: "${parts[1]}"`);
      items.push({ code, quantity });
    }
    if (!items.length) throw new Error("Nenhum dado encontrado no CSV.");
    return items;
  };

  const applyImport = async (items) => {
    setImporting(true);
    setImportError(null);
    try {
      await api.bulkUpdate(items);
      const updated = await api.getStickers();
      setStickers(updated);
    } catch (e) {
      setImportError(e.message);
    } finally {
      setImporting(false);
      setPendingImport(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const items = parseCSV(ev.target.result);
        const hasData = stickers.some((s) => s.quantity > 0);
        if (hasData) {
          setPendingImport(items);
        } else {
          applyImport(items);
        }
      } catch (err) {
        setImportError(err.message);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // group_name → section_key → stickers[]
  // specialOnly filters stickers to positions 1 and 13 (Escudo/Perfilada) only
  const grouped = useMemo(() => {
    const nq = normalize(search.trim());
    const byGroup = new Map();
    const allTeams = new Map();

    for (const s of stickers) {
      if (EXCLUDED_GROUPS.has(s.group_name)) continue;
      if (group !== "Todos" && s.group_name !== group) continue;

      if (nq) {
        const matches =
          normalize(s.code).includes(nq) ||
          normalize(s.section_name).includes(nq) ||
          normalize(s.group_name).includes(nq) ||
          normalize(s.section_code).includes(nq) ||
          normalize(s.player_name || "").includes(nq);
        if (!matches) continue;
      }

      if (specialOnly && !isSpecialSticker(s)) continue;

      const teamKey = `${s.group_name}__${s.section_code}__${s.section_name}`;
      if (!allTeams.has(teamKey)) allTeams.set(teamKey, []);
      allTeams.get(teamKey).push(s);
    }

    for (const [teamKey, teamStickers] of allTeams.entries()) {
      if (teamStickers.length === 0) continue;
      if (withRepeated && !teamHasRepeated(teamStickers)) continue;
      if (statusFilter !== "all" && teamStatus(teamStickers) !== statusFilter) continue;
      const groupName = teamStickers[0].group_name;
      if (!byGroup.has(groupName)) byGroup.set(groupName, new Map());
      byGroup.get(groupName).set(teamKey, teamStickers);
    }

    return byGroup;
  }, [stickers, group, statusFilter, search, specialOnly, withRepeated]);

  const mainStickers = stickers.filter((s) => !EXCLUDED_GROUPS.has(s.group_name));
  const coladas = mainStickers.filter((s) => s.quantity >= 1).length;
  const total = mainStickers.length;
  const pct = total ? Math.round((coladas / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {pendingImport && (
        <ImportConfirmModal
          count={pendingImport.length}
          onConfirm={() => applyImport(pendingImport)}
          onCancel={() => {
            setPendingImport(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Static header — scrolls away */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Álbum</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Toque para marcar · segure para desmarcar
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {total > 0 && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="text-emerald-400 font-semibold tabular-nums">{coladas}</span>
              <span>/ {total}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-semibold tabular-nums">{pct}%</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={loading || stickers.length === 0}
              title="Exportar CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors font-medium disabled:opacity-40"
            >
              <i className="bi bi-download" />
              Exportar
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              title="Importar CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors font-medium disabled:opacity-40"
            >
              <i className="bi bi-upload" />
              {importing ? "Importando..." : "Importar"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Sticky filter bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-zinc-950 -mx-6 px-6 py-3 border-b border-zinc-800/80 flex flex-col gap-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar time, jogador, grupo ou figurinha..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <i className="bi bi-x text-sm" />
            </button>
          )}
        </div>

        {/* Status + view-mode pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-colors ${
                statusFilter === f.key ? STATUS_ACTIVE_CLS[f.key] : INACTIVE_CLS
              }`}
            >
              {f.label}
            </button>
          ))}

          <span className="w-px h-4 bg-zinc-700 mx-0.5" />

          {/* Especiais toggle */}
          <button
            onClick={() => setSpecialOnly((v) => !v)}
            title="Mostrar apenas Escudo (1) e Perfilada (13)"
            className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
              specialOnly ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40" : INACTIVE_CLS
            }`}
          >
            <i className="bi bi-star-fill text-[10px]" />
            Especiais
          </button>

          {/* Com repetidas toggle */}
          <button
            onClick={() => setWithRepeated((v) => !v)}
            className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-colors ${
              withRepeated ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40" : INACTIVE_CLS
            }`}
          >
            Com repetidas
          </button>

          {/* Apenas Faltantes toggle */}
          <button
            onClick={() => setOnlyMissing((v) => !v)}
            title="Ocultar figurinhas já coladas — ver apenas os buracos"
            className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
              onlyMissing ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40" : INACTIVE_CLS
            }`}
          >
            <i className="bi bi-eye-slash-fill text-[10px]" />
            Apenas Faltantes
          </button>
        </div>

        {/* Group pills */}
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                group === g
                  ? "bg-zinc-100 text-zinc-900"
                  : INACTIVE_CLS
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}
      {importError && (
        <p className="text-rose-400 text-sm flex items-center gap-2">
          <i className="bi bi-exclamation-circle" />
          {importError}
        </p>
      )}
      {loading && <p className="text-zinc-500 text-sm">Carregando...</p>}

      {/* Content */}
      {!loading && (
        <div className="flex flex-col gap-8">
          {grouped.size === 0 && (
            <p className="text-zinc-600 text-sm">Nenhuma seleção encontrada com esse filtro.</p>
          )}
          {[...grouped.entries()].map(([groupName, teamMap]) => (
            <GroupSection
              key={groupName}
              groupName={groupName}
              teamMap={teamMap}
              onUpdate={handleUpdate}
              onlyMissing={onlyMissing}
              withRepeated={withRepeated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
