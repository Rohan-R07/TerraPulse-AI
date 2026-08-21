import { NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  LayoutDashboard,
  Map as MapIcon,
  ScanLine,
  Calculator,
  Leaf,
  Menu,
  X,
  MessageSquare,
  CheckSquare,
  Globe,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/farm-health", label: "Farm Health", icon: MapIcon },
  { to: "/ai-scanner", label: "AI Scanner", icon: ScanLine },
  { to: "/carbon-simulator", label: "Carbon Simulator", icon: Calculator },
  { to: "/copilot", label: "AI Farm Copilot", icon: MessageSquare },
  { to: "/actions", label: "Action Center", icon: CheckSquare },
  { to: "/india-intelligence", label: "India Intelligence", icon: Globe },
];

export function Sidebar({ open, onClose }) {
  const { profile } = useAuth();

  let regionName = "Pune Region";
  if (profile?.location) {
    const parts = profile.location.split(",");
    regionName = parts[0].trim();
    if (parts[1]) {
      regionName += ", " + parts[1].trim();
    }
  }

  return (
    <>
      {open && <div className="tp-sidebar-overlay" onClick={onClose} aria-hidden />}
      <aside className={`tp-sidebar ${open ? "open" : ""}`}>
        <div className="tp-sidebar-brand" style={{ padding: "6px 12px" }}>
          <Link to="/" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="TerraPulse AI Logo" style={{ width: "200px", objectFit: "contain" }} />
          </Link>
          <button className="tp-sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="tp-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `tp-nav-link ${isActive ? "active" : ""}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="tp-sidebar-foot">
          <div className="tp-sidebar-foot-card">
            <div className="tp-sidebar-foot-title">TerraPulse AI Network</div>
            <div className="tp-sidebar-foot-sub">Active Node · {regionName}</div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Topbar({ onMenu }) {
  const [lang, setLang] = useState(localStorage.getItem("tp-lang") || "en");
  const [appMode, setAppMode] = useState(localStorage.getItem("tp-app-mode") || "demo");
  const { user, profile, logOut } = useAuth();

  const handleLangChange = (e) => {
    const val = e.target.value;
    localStorage.setItem("tp-lang", val);
    setLang(val);
    window.dispatchEvent(new Event("tp-lang-changed"));
  };

  const handleModeChange = (mode) => {
    localStorage.setItem("tp-app-mode", mode);
    setAppMode(mode);
    window.location.reload();
  };

  return (
    <header className="tp-topbar">
      <button className="tp-topbar-menu" onClick={onMenu} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="tp-topbar-title">{profile?.farmName || "Green Valley Farm"}</div>
      <div className="tp-topbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <select
          value={lang}
          onChange={handleLangChange}
          className="tp-select"
          style={{ width: "auto", padding: "4px 8px", fontSize: "0.85rem", height: 32, border: "2.5px solid #111827", borderRadius: 8, background: "#ffffff", fontWeight: 700 }}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="bn">বাংলা (Bengali)</option>
          <option value="mr">मराठी (Marathi)</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
        </select>
        
        <div style={{ display: "flex", gap: 4, border: "2.5px solid #111827", borderRadius: 8, overflow: "hidden", background: "#ffffff", height: 32 }}>
          <button
            onClick={() => handleModeChange("live")}
            style={{
              padding: "2px 8px",
              border: "none",
              background: appMode === "live" ? "var(--tp-green-600)" : "#ffffff",
              color: appMode === "live" ? "#ffffff" : "var(--tp-neutral-600)",
              fontSize: "0.72rem",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all var(--tp-transition)"
            }}
          >
            LIVE
          </button>
          <button
            onClick={() => handleModeChange("demo")}
            style={{
              padding: "2px 8px",
              border: "none",
              background: appMode === "demo" ? "#111827" : "#ffffff",
              color: appMode === "demo" ? "#ffffff" : "var(--tp-neutral-600)",
              fontSize: "0.72rem",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all var(--tp-transition)"
            }}
          >
            DEMO
          </button>
        </div>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderLeft: "2.5px solid #111827", paddingLeft: 12 }}>
            <div style={{ display: "none", flexDirection: "column", alignItems: "flex-end" }} className="tp-topbar-userinfo">
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--tp-neutral-800)" }}>
                {profile?.displayName || user.displayName || "Farmer"}
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--tp-neutral-500)", fontWeight: 600 }}>
                {user.email}
              </span>
            </div>
            <button
              onClick={logOut}
              className="tp-btn tp-btn-sm"
              style={{
                padding: "4px 8px",
                height: 32,
                background: "#fee2e2",
                color: "#dc2626",
                border: "2.5px solid #111827",
                boxShadow: "none",
                fontSize: "0.75rem",
                fontWeight: 700
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="tp-app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="tp-main">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="tp-content">{children}</main>
      </div>
    </div>
  );
}
