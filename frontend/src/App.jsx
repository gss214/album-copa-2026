import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Album from "./pages/Album";
import Trocas from "./pages/Trocas";
import Raras from "./pages/Raras";

function Navbar() {
  const navClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? "bg-zinc-800 text-zinc-100"
        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
    }`;

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800/60 px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1 h-12">
        <span className="text-zinc-100 font-bold text-sm tracking-wider uppercase mr-5 flex items-center gap-2">
          <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-6 h-6 object-contain" />
          Álbum Copa 2026
        </span>
        <div className="w-px h-4 bg-zinc-800 mr-4" />
        <NavLink to="/" end className={navClass}>
          Dashboard
        </NavLink>
        <NavLink to="/album" className={navClass}>
          Álbum
        </NavLink>
        <NavLink to="/trocas" className={navClass}>
          Trocas
        </NavLink>
        <NavLink to="/raras" className={navClass}>
          Raras
        </NavLink>
      </div>
    </nav>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors flex items-center justify-center shadow-lg"
      title="Voltar ao topo"
    >
      <i className="bi bi-arrow-up" />
    </button>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/album" element={<Album />} />
            <Route path="/trocas" element={<Trocas />} />
            <Route path="/raras" element={<Raras />} />
          </Routes>
        </main>
        <ScrollToTop />
      </div>
    </BrowserRouter>
  );
}
