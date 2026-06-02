import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "@/api";
import { LOGOS } from "@/lib/logos";
import { getSectionInfo } from "@/lib/albumPages";

// ── Paleta (espelha Dashboard) ───────────────────────────────────────────────
const SURFACE   = "#132030";
const SURFACE_2 = "#1a2d42";
const GOLD      = "#d4a853";
const COPPER    = "#b87333";
const APP_BG    = "#0d1b2a";

// ── Constantes ───────────────────────────────────────────────────────────────
const GROUPS = [
  "Todos", "FWC",
  "Grupo A", "Grupo B", "Grupo C", "Grupo D",
  "Grupo E", "Grupo F", "Grupo G", "Grupo H",
  "Grupo I", "Grupo J", "Grupo K", "Grupo L",
  "Coca-Cola",
];
const EXCLUDED_GROUPS = new Set(["Raras"]);

const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const SPECIAL_LABELS = { "1": "Escudo", "13": "Perfilada" };

function isSpecialSticker(s) {
  return (s.number === "1" || s.number === "13") &&
    s.section_code !== "FWC" && s.section_code !== "CC";
}

// ── StickerConfirmModal ──────────────────────────────────────────────────────
function StickerConfirmModal({ sticker, action, onConfirm, onCancel }) {
  const isAdd = action === "add";
  const newQty = isAdd ? sticker.quantity + 1 : sticker.quantity - 1;
  const isFirstAdd  = isAdd && sticker.quantity === 0;
  const isLastRemove = !isAdd && newQty === 0;

  const accentColor = isAdd
    ? isFirstAdd ? "#34d399" : "#f59e0b"
    : "#f87171";
  const accentBg = isAdd
    ? isFirstAdd ? "rgba(52,211,153,0.12)" : "rgba(245,158,11,0.12)"
    : "rgba(239,68,68,0.12)";
  const icon = isAdd
    ? isFirstAdd ? "bi-check-circle-fill" : "bi-layers-fill"
    : "bi-dash-circle-fill";
  const label = isAdd
    ? isFirstAdd ? "Marcar como colada?" : "Adicionar repetida?"
    : isLastRemove ? "Desmarcar figurinha?" : "Remover uma repetida?";

  return (
    <Modal>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
          style={{ background: accentBg, color: accentColor }}
        >
          <i className={`bi ${icon}`} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#e8d5b0" }}>{label}</p>
          <p className="text-xs mt-0.5 font-mono" style={{ color: "#7a9bb5" }}>
            {sticker.code}
            {sticker.player_name && (
              <span className="font-sans font-normal ml-1" style={{ color: "#4a6785" }}>
                · {sticker.player_name}
              </span>
            )}
          </p>
        </div>
      </div>
      {isAdd && !isFirstAdd && (
        <p className="text-xs rounded-xl px-3 py-2" style={{ background: SURFACE_2, color: "#7a9bb5" }}>
          Quantidade vai de{" "}
          <span className="font-semibold" style={{ color: "#e8d5b0" }}>×{sticker.quantity}</span>
          {" "}para{" "}
          <span className="font-semibold" style={{ color: accentColor }}>×{newQty}</span>
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs rounded-lg font-medium transition-colors"
          style={{ background: SURFACE_2, color: "#7a9bb5" }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs rounded-lg font-semibold transition-colors"
          style={{ background: accentColor, color: isAdd && !isFirstAdd ? "#1a1a1a" : isAdd ? "#0d1b2a" : "#fff" }}
        >
          Confirmar
        </button>
      </div>
    </Modal>
  );
}

// ── StickerTile ──────────────────────────────────────────────────────────────
function StickerTile({ sticker, onUpdate, onlyMissing, withRepeated }) {
  const [loading, setLoading] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // "add" | "remove"
  const longPressTimer = useRef(null);
  const touchOrigin = useRef(null);
  const didScroll = useRef(false);
  const MOVE_THRESHOLD = 8;

  const confirmAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (loading) return;
    setLoading(true);
    const newQty = action === "add" ? sticker.quantity + 1 : sticker.quantity - 1;
    try { await onUpdate(sticker.code, newQty); }
    finally { setLoading(false); }
  };

  const increment = () => {
    if (loading) return;
    setPendingAction("add");
  };

  const decrement = (e) => {
    e?.preventDefault();
    if (loading || sticker.quantity === 0) return;
    setPendingAction("remove");
  };

  const onTouchStart = (e) => {
    touchOrigin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    didScroll.current = false;
    setIsPressing(true);
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      setIsPressing(false);
      if (!didScroll.current) decrement();
    }, 500);
  };

  const onTouchMove = (e) => {
    if (!touchOrigin.current || didScroll.current) return;
    const dx = e.touches[0].clientX - touchOrigin.current.x;
    const dy = e.touches[0].clientY - touchOrigin.current.y;
    if (dx * dx + dy * dy > MOVE_THRESHOLD * MOVE_THRESHOLD) {
      didScroll.current = true;
      cancelPress();
    }
  };

  const cancelPress = () => {
    setIsPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onTouchEnd = (e) => {
    e.preventDefault();
    const wasShortTap = !!longPressTimer.current;
    cancelPress();
    if (wasShortTap && !didScroll.current) increment();
    touchOrigin.current = null;
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
    ? SPECIAL_LABELS[sticker.number] : null;

  const titleParts = [];
  if (specialLabel) titleParts.push(specialLabel);
  titleParts.push(sticker.player_name ? `${sticker.code} · ${sticker.player_name}` : sticker.code);

  const invisible = (onlyMissing && sticker.quantity >= 1) || (withRepeated && sticker.quantity <= 1);

  return (
    <>
    {pendingAction && (
      <StickerConfirmModal
        sticker={sticker}
        action={pendingAction}
        onConfirm={confirmAction}
        onCancel={() => setPendingAction(null)}
      />
    )}
    <button
      onClick={increment}
      onContextMenu={decrement}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={cancelPress}
      disabled={loading || invisible}
      title={titleParts.join(" — ")}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", touchAction: "manipulation" }}
      className={`relative flex flex-col items-center justify-center rounded text-xs font-mono font-semibold transition-all select-none h-14 w-full gap-0.5 px-0.5 ${cls} ${invisible ? "invisible" : ""} ${isPressing ? "scale-90 ring-2 ring-amber-400/60" : ""}`}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center rounded bg-black/30">
          <i className="bi bi-arrow-repeat text-xs animate-spin opacity-80" />
        </span>
      )}
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
    </>
  );
}

// ── TeamLogo ─────────────────────────────────────────────────────────────────
function TeamLogo({ logo, sectionCode, sectionName }) {
  const [error, setError] = useState(false);
  const initials = sectionCode.slice(0, 3).toUpperCase();
  if (!logo || error) {
    return (
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: SURFACE_2, color: "#7a9bb5" }}
      >
        {initials}
      </span>
    );
  }
  return (
    <img
      src={logo}
      alt={sectionName}
      className="w-9 h-9 object-contain shrink-0 drop-shadow-md"
      onError={() => setError(true)}
    />
  );
}

// ── TeamCard ─────────────────────────────────────────────────────────────────
function TeamCard({ sectionName, sectionCode, stickers, onUpdate, onlyMissing, withRepeated }) {
  const coladas = stickers.filter((s) => s.quantity >= 1).length;
  const total   = stickers.length;
  const pct     = total ? Math.round((coladas / total) * 100) : 0;
  const done    = coladas === total;
  const logo    = LOGOS[sectionCode];
  const info    = getSectionInfo(sectionCode, sectionName);

  const barColor = done ? "#34d399" : pct >= 50 ? "#f59e0b" : "#60a5fa";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: SURFACE,
        border: `1px solid ${done ? "#34d39930" : `${COPPER}22`}`,
        boxShadow: done
          ? "inset 0 2px 8px rgba(0,0,0,0.45), 0 0 16px rgba(52,211,153,0.08)"
          : "inset 0 2px 8px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamLogo logo={logo} sectionCode={sectionCode} sectionName={sectionName} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold leading-tight truncate" style={{ color: "#e8d5b0" }}>
                {sectionName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: "#4a6785" }}>{sectionCode}</span>
                {info?.pages && (
                  <span className="text-[10px]" style={{ color: `${COPPER}80` }}>pg. {info.pages}</span>
                )}
              </div>
            </div>
          </div>
          <span
            className="text-xs tabular-nums font-semibold shrink-0"
            style={{ color: done ? "#34d399" : "#7a9bb5" }}
          >
            {coladas}/{total}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: SURFACE_2 }}>
          <div
            className="h-0.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-5 gap-1">
        {stickers.map((s) => (
          <StickerTile
            key={s.code}
            sticker={s}
            onUpdate={onUpdate}
            onlyMissing={onlyMissing}
            withRepeated={withRepeated}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── GroupSection ─────────────────────────────────────────────────────────────
function GroupSection({ groupName, teamMap, onUpdate, onlyMissing, withRepeated }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center gap-3 pb-2"
        style={{ borderBottom: `1px solid ${COPPER}25` }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: COPPER }}
        >
          {groupName}
        </span>
        <span className="text-[10px]" style={{ color: "#4a6785" }}>
          {teamMap.size} {teamMap.size === 1 ? "seção" : "seções"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
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

// ── Filtros ──────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: "all",         label: "Todas" },
  { key: "incomplete",  label: "Incompletas" },
  { key: "complete",    label: "Completas" },
  { key: "not_started", label: "Não iniciadas" },
];

const STATUS_ACTIVE = {
  all:         { background: `${COPPER}40`, color: GOLD },
  incomplete:  { background: "rgba(245,158,11,0.2)", color: "#f59e0b" },
  complete:    { background: "rgba(52,211,153,0.15)", color: "#34d399" },
  not_started: { background: `${SURFACE_2}`, color: "#7a9bb5" },
};

const PILL_INACTIVE = {
  background: `${SURFACE_2}`,
  color: "#4a6785",
};

function pill(active, activeStyle) {
  return active ? activeStyle : PILL_INACTIVE;
}

function teamStatus(stickers) {
  const coladas = stickers.filter((s) => s.quantity >= 1).length;
  if (coladas === 0) return "not_started";
  if (coladas === stickers.length) return "complete";
  return "incomplete";
}

function teamHasRepeated(stickers) {
  return stickers.some((s) => s.quantity > 1);
}

// ── Toast ────────────────────────────────────────────────────────────────────
function StickerToast({ toast }) {
  if (!toast) return null;
  const { code, sectionName, newQty, removed, error } = toast;
  const repeated = !removed && !error && newQty > 1;

  const style = error
    ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }
    : removed
      ? { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }
      : repeated
        ? { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }
        : { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#6ee7b7" };

  const icon = error ? "bi-wifi-off" : removed ? "bi-dash-circle-fill" : repeated ? "bi-layers-fill" : "bi-check-circle-fill";
  const iconColor = error ? "#f87171" : removed ? "#f87171" : repeated ? "#f59e0b" : "#34d399";

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium whitespace-nowrap" style={style}>
        <i className={`bi ${icon} text-base`} style={{ color: iconColor }} />
        <span className="font-mono font-semibold">{code}</span>
        {error
          ? <span className="text-xs font-sans font-normal" style={{ color: "#f87171" }}>Erro ao salvar</span>
          : <span className="text-xs font-sans font-normal" style={{ color: "#4a6785" }}>{sectionName}</span>
        }
        {repeated && (
          <span className="bg-amber-500 text-zinc-900 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
            ×{newQty}
          </span>
        )}
        {removed && newQty > 0 && (
          <span className="text-xs font-sans font-normal" style={{ color: "#4a6785" }}>→ ×{newQty}</span>
        )}
      </div>
    </div>
  );
}

// ── Modais ───────────────────────────────────────────────────────────────────
function Modal({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl"
        style={{ background: SURFACE, border: `1px solid ${COPPER}30` }}
      >
        {children}
      </div>
    </div>
  );
}

function ClearRepeatedModal({ onConfirm, onCancel, count }) {
  return (
    <Modal>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
        >
          <i className="bi bi-trash3-fill" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#e8d5b0" }}>Limpar repetidas?</p>
          <p className="text-xs mt-0.5" style={{ color: "#4a6785" }}>
            Todas as figurinhas com mais de 1 cópia voltarão para quantidade 1.
          </p>
        </div>
      </div>
      <p className="text-xs rounded-xl px-3 py-2" style={{ background: SURFACE_2, color: "#7a9bb5" }}>
        <span className="font-semibold" style={{ color: "#e8d5b0" }}>{count} figurinha{count !== 1 ? "s" : ""}</span> terão as extras removidas.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs rounded-lg font-medium transition-colors"
          style={{ background: SURFACE_2, color: "#7a9bb5" }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs rounded-lg font-semibold transition-colors"
          style={{ background: "rgba(239,68,68,0.8)", color: "#fff" }}
        >
          Limpar
        </button>
      </div>
    </Modal>
  );
}

function ImportConfirmModal({ onConfirm, onCancel, count }) {
  return (
    <Modal>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
        >
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#e8d5b0" }}>Substituir dados?</p>
          <p className="text-xs mt-0.5" style={{ color: "#4a6785" }}>
            O CSV importado irá substituir todas as quantidades atuais.
          </p>
        </div>
      </div>
      <p className="text-xs rounded-xl px-3 py-2" style={{ background: SURFACE_2, color: "#7a9bb5" }}>
        <span className="font-semibold" style={{ color: "#e8d5b0" }}>{count} figurinhas</span> serão atualizadas.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs rounded-lg font-medium transition-colors"
          style={{ background: SURFACE_2, color: "#7a9bb5" }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs rounded-lg font-semibold transition-colors"
          style={{ background: "rgba(245,158,11,0.85)", color: "#1a1a1a" }}
        >
          Importar assim mesmo
        </button>
      </div>
    </Modal>
  );
}

// ── Album ────────────────────────────────────────────────────────────────────
export default function Album() {
  const [stickers,        setStickers]        = useState([]);
  const [group,           setGroup]           = useState("Todos");
  const [statusFilter,    setStatusFilter]    = useState("all");
  const [search,          setSearch]          = useState("");
  const [specialOnly,     setSpecialOnly]     = useState(false);
  const [onlyMissing,     setOnlyMissing]     = useState(false);
  const [withRepeated,    setWithRepeated]    = useState(false);
  const [filtersOpen,     setFiltersOpen]     = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [importError,     setImportError]     = useState(null);
  const [importing,       setImporting]       = useState(false);
  const [pendingImport,   setPendingImport]   = useState(null);
  const [clearingRepeated,setClearingRepeated]= useState(false);
  const [showClearModal,  setShowClearModal]  = useState(false);
  const [toast,           setToast]           = useState(null);
  const toastTimer  = useRef(null);
  const fileInputRef= useRef(null);

  useEffect(() => {
    api.getStickers()
      .then(setStickers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleUpdate = async (code, qty) => {
    const prev = stickers.find((s) => s.code === code);
    try {
      const updated = await api.updateSticker(code, qty);
      setStickers((cur) => cur.map((s) => (s.code === updated.code ? updated : s)));
      if (updated.quantity !== prev?.quantity) {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ code: updated.code, sectionName: updated.section_name, newQty: updated.quantity, removed: updated.quantity < (prev?.quantity ?? 0) });
        toastTimer.current = setTimeout(() => setToast(null), 2000);
      }
    } catch {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ code, sectionName: prev?.section_name ?? "", newQty: null, error: true });
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    }
  };

  const handleClearRepeated = async () => {
    setClearingRepeated(true);
    try {
      await api.clearRepeated();
      setStickers(await api.getStickers());
      setShowClearModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setClearingRepeated(false);
    }
  };

  const handleExport = () => {
    const rows = ["code,quantity", ...stickers.map((s) => `${s.code},${s.quantity}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `album-copa-2026_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.csv`;
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
      if (isNaN(quantity) || quantity < 0) throw new Error(`Quantidade inválida na linha ${i + 1}: "${parts[1]}"`);
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
      setStickers(await api.getStickers());
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
        if (stickers.some((s) => s.quantity > 0)) {
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

  const activeFilterCount = [
    statusFilter !== "all", specialOnly, withRepeated, onlyMissing, group !== "Todos",
  ].filter(Boolean).length;

  // shared action button style
  const actionBtn = (danger = false) => ({
    background: SURFACE_2,
    color: danger ? "#f87171" : "#7a9bb5",
    border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : `${COPPER}18`}`,
  });

  return (
    <div className="flex flex-col gap-6">
      <StickerToast toast={toast} />

      {showClearModal && (
        <ClearRepeatedModal
          count={stickers.filter((s) => s.quantity > 1).length}
          onConfirm={handleClearRepeated}
          onCancel={() => setShowClearModal(false)}
        />
      )}
      {pendingImport && (
        <ImportConfirmModal
          count={pendingImport.length}
          onConfirm={() => applyImport(pendingImport)}
          onCancel={() => { setPendingImport(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
        />
      )}
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />

      {/* ── Cabeçalho ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-10 h-10 object-contain drop-shadow-lg" />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: GOLD, fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Álbum
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#4a6785" }}>
              Toque para marcar · segure para desmarcar
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {stickers.some((s) => s.quantity > 1) && (
              <button
                onClick={() => setShowClearModal(true)}
                disabled={clearingRepeated}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all disabled:opacity-40"
                style={actionBtn(true)}
              >
                <i className="bi bi-trash3" />
                <span className="hidden sm:inline">{clearingRepeated ? "Limpando..." : "Limpar repetidas"}</span>
              </button>
            )}
            <button
              onClick={handleExport}
              disabled={loading || stickers.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all disabled:opacity-40"
              style={actionBtn()}
            >
              <i className="bi bi-download" />
              Exportar
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all disabled:opacity-40"
              style={actionBtn()}
            >
              <i className="bi bi-upload" />
              {importing ? "Importando..." : "Importar"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Barra de filtros sticky ───────────────────────────────────── */}
      <div
        className="sticky top-12 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 py-3 flex flex-col gap-3"
        style={{
          background: APP_BG,
          borderBottom: `1px solid ${COPPER}20`,
        }}
      >
        {/* Busca + toggle mobile */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:max-w-sm">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "#4a6785" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar time, jogador, grupo..."
              className="w-full rounded-xl pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-1 transition-colors placeholder-[#4a6785]"
              style={{
                background: SURFACE,
                border: `1px solid ${COPPER}25`,
                color: "#e8d5b0",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#4a6785" }}
              >
                <i className="bi bi-x text-sm" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="relative flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg font-semibold transition-colors"
            style={filtersOpen
              ? { background: `${COPPER}30`, color: GOLD }
              : activeFilterCount > 0
                ? { background: SURFACE, color: "#7a9bb5", border: `1px solid ${COPPER}25` }
                : { background: SURFACE_2, color: "#4a6785" }
            }
          >
            <i className="bi bi-sliders text-sm" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-zinc-900 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filtros expandidos */}
        <div className={`flex flex-col gap-2 ${filtersOpen ? "" : "hidden"}`}>
          {/* Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider w-12 shrink-0" style={{ color: "#4a6785" }}>Status</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key === statusFilter && f.key !== "all" ? "all" : f.key)}
                className="px-3 py-1.5 text-xs rounded-full font-semibold transition-all"
                style={pill(statusFilter === f.key, STATUS_ACTIVE[f.key])}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Modo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider w-12 shrink-0" style={{ color: "#4a6785" }}>Modo</span>
            <button
              onClick={() => setSpecialOnly((v) => !v)}
              className="px-3 py-1.5 text-xs rounded-full font-semibold transition-all flex items-center gap-1.5"
              style={pill(specialOnly, { background: "rgba(56,189,248,0.15)", color: "#38bdf8" })}
            >
              <i className={`bi ${specialOnly ? "bi-star-fill" : "bi-star"} text-[10px]`} />
              Especiais
            </button>
            <button
              onClick={() => setWithRepeated((v) => !v)}
              className="px-3 py-1.5 text-xs rounded-full font-semibold transition-all"
              style={pill(withRepeated, { background: "rgba(52,211,153,0.15)", color: "#34d399" })}
            >
              Repetidas
            </button>
            <button
              onClick={() => setOnlyMissing((v) => !v)}
              className="px-3 py-1.5 text-xs rounded-full font-semibold transition-all flex items-center gap-1.5"
              style={pill(onlyMissing, { background: "rgba(239,68,68,0.15)", color: "#f87171" })}
            >
              <i className="bi bi-eye-slash-fill text-[10px]" />
              Apenas Faltantes
            </button>
          </div>

          {/* Grupo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider w-12 shrink-0" style={{ color: "#4a6785" }}>Grupo</span>
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g === group && g !== "Todos" ? "Todos" : g)}
                className="px-3 py-1 text-xs rounded-full font-medium transition-all"
                style={pill(group === g, { background: `${COPPER}35`, color: GOLD })}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Erros ────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm flex items-center gap-2" style={{ color: "#f87171" }}>
          <i className="bi bi-exclamation-circle" />{error}
        </p>
      )}
      {importError && (
        <p className="text-sm flex items-center gap-2" style={{ color: "#f87171" }}>
          <i className="bi bi-exclamation-circle" />{importError}
        </p>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl" style={{ background: SURFACE, border: `1px solid ${COPPER}15` }} />
          ))}
        </div>
      )}

      {/* ── Conteúdo ─────────────────────────────────────────────────── */}
      {!loading && (
        <div className="flex flex-col gap-8">
          {grouped.size === 0 && (
            <p className="text-sm" style={{ color: "#4a6785" }}>
              Nenhuma figurinha encontrada com esse filtro.
            </p>
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
