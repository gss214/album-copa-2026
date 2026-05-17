import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Album from "./pages/Album";
import Trocas from "./pages/Trocas";
import Raras from "./pages/Raras";
import Login from "./pages/Login";

function Navbar({ onLogout }) {
  const navClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? "bg-zinc-800 text-zinc-100"
        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
    }`;

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800/60 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1 h-12">
        <span className="text-zinc-100 font-bold text-sm tracking-wider uppercase mr-3 sm:mr-5 flex items-center gap-2 shrink-0">
          <img src="/logos/logo_copa_2026.png" alt="Copa 2026" className="w-6 h-6 object-contain" />
          <span className="hidden sm:inline">Álbum Copa 2026</span>
        </span>
        <div className="hidden sm:block w-px h-4 bg-zinc-800 mr-4" />
        <div className="hidden sm:flex items-center gap-0.5">
          <NavLink to="/" end className={navClass}>Dashboard</NavLink>
          <NavLink to="/album" className={navClass}>Álbum</NavLink>
          <NavLink to="/trocas" className={navClass}>Trocas</NavLink>
          <NavLink to="/raras" className={navClass}>Raras</NavLink>
        </div>
        <button
          onClick={onLogout}
          className="ml-auto shrink-0 px-3 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}

function BottomNav() {
  const itemClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-0.5 py-2 flex-1 text-xs font-medium transition-colors border-t-2 ${
      isActive
        ? "border-zinc-100 text-zinc-100"
        : "border-transparent text-zinc-500"
    }`;

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800/60 flex items-stretch safe-area-inset-bottom">
      <NavLink to="/" end className={itemClass}>
        <i className="bi bi-speedometer2 text-xl" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/album" className={itemClass}>
        <i className="bi bi-grid-3x3-gap text-xl" />
        <span>Álbum</span>
      </NavLink>
      <NavLink to="/trocas" className={itemClass}>
        <i className="bi bi-arrow-left-right text-xl" />
        <span>Trocas</span>
      </NavLink>
      <NavLink to="/raras" className={itemClass}>
        <i className="bi bi-stars text-xl" />
        <span>Raras</span>
      </NavLink>
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
      className="fixed bottom-20 sm:bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors flex items-center justify-center shadow-lg"
      title="Voltar ao topo"
    >
      <i className="bi bi-arrow-up" />
    </button>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/album" element={<Album />} />
            <Route path="/trocas" element={<Trocas />} />
            <Route path="/raras" element={<Raras />} />
          </Routes>
        </main>
        <BottomNav />
        <ScrollToTop />
      </div>
    </BrowserRouter>
  );
}
