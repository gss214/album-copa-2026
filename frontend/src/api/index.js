const BASE = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
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
  getActivity: () => request("/stats/activity"),
  getLogs: (limit = 200) => request(`/logs?limit=${limit}`),
  clearRepeated: () => request("/stickers/clear-repeated", { method: "POST" }),
  undoLog: (id) => request(`/logs/${id}/undo`, { method: "POST" }),
};
