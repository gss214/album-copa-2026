const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${res.status}`);
  }
  return res.json();
}

export const api = {
  getStickers: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request(`/stickers${qs ? `?${qs}` : ""}`);
  },
  updateSticker: (code, quantity) =>
    request(`/stickers/${code}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  bulkUpdate: (items) =>
    request("/stickers/bulk", {
      method: "PATCH",
      body: JSON.stringify({ items }),
    }),
  getSummary: () => request("/summary"),
  getTrocas: () => request("/trocas"),
  getStats: () => request("/stats"),
};
