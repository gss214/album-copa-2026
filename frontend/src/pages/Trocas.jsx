import { useState, useEffect } from "react";
import { api } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function CopyCard({ title, icon, color, items, count, buildText }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildText(items)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayCount = count ?? items.length;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <i className={`bi ${icon} ${color}`} />
            {title}
            <span className={`text-sm font-normal ${color}`}>({displayCount})</span>
          </CardTitle>
          <Button variant="secondary" size="sm" onClick={handleCopy} disabled={items.length === 0}>
            <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"}`} />
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <p className="text-zinc-600 text-sm italic">Nenhuma figurinha nesta lista.</p>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap max-h-[480px] overflow-y-auto">
            {buildText(items)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function buildFaltamText(codes) {
  if (!codes.length) return "";
  const chunks = [];
  for (let i = 0; i < codes.length; i += 10) {
    chunks.push(codes.slice(i, i + 10).join("  "));
  }
  return `*FIGURINHAS QUE FALTAM (${codes.length}):*\n\n` + chunks.join("\n");
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
  const chunks = [];
  for (let i = 0; i < items.length; i += 6) {
    chunks.push(items.slice(i, i + 6).join("  "));
  }
  return `*FIGURINHAS REPETIDAS (${total}):*\n\n` + chunks.join("\n");
}

export default function Trocas() {
  const [trocas, setTrocas] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getTrocas()
      .then(setTrocas)
      .catch((e) => setError(e.message));
  }, []);

  const handleCopyAll = () => {
    if (!trocas) return;
    const text =
      buildFaltamText(trocas.faltam) +
      "\n\n" +
      buildRepetidaText(trocas.repetidas);
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Lista de Trocas</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Pronta para copiar e colar no WhatsApp
          </p>
        </div>
        {trocas && (
          <Button variant="secondary" onClick={handleCopyAll}>
            <i className="bi bi-whatsapp text-emerald-400" />
            Copiar tudo
          </Button>
        )}
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      {!trocas && !error && (
        <p className="text-zinc-500 text-sm">Carregando...</p>
      )}

      {trocas && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CopyCard
            title="Faltam"
            icon="bi-x-circle"
            color="text-rose-400"
            items={trocas.faltam}
            buildText={buildFaltamText}
          />
          <CopyCard
            title="Repetidas"
            icon="bi-layers"
            color="text-sky-400"
            items={trocas.repetidas}
            count={countTotalExtras(trocas.repetidas)}
            buildText={buildRepetidaText}
          />
        </div>
      )}
    </div>
  );
}
