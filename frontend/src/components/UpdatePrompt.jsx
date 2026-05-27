import { useRegisterSW } from "virtual:pwa-register/react";

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl text-sm text-zinc-200">
      <i className="bi bi-arrow-repeat text-zinc-400" />
      <span>Nova versão disponível</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1 rounded-md bg-zinc-100 text-zinc-900 font-medium hover:bg-white transition-colors text-xs"
      >
        Atualizar
      </button>
    </div>
  );
}
