import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Album from "./pages/Album";
import Trocas from "./pages/Trocas";

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
          Copa 2026
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
      </div>
    </nav>
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
