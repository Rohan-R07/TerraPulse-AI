import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Leaf, Map as MapIcon, ScanLine, Calculator, ArrowRight,
  Satellite, Activity, TrendingUp, Menu, X,
} from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/landing.css";

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <img src={logo} alt="TerraPulse AI Logo" style={{ width: "160px", objectFit: "contain" }} />
          </Link>
          <div className="landing-nav-links">
            <a href="#capabilities">Capabilities</a>
            <a href="#how">How it works</a>
            <a href="#preview">Product preview</a>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className="landing-nav-cta">
            <Link to="/dashboard" className="tp-btn tp-btn-primary">Launch app <ArrowRight size={16} /></Link>
          </div>
          <button className="landing-nav-mobile tp-btn tp-btn-ghost" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="landing-nav-mobile-menu" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 24px 20px", borderBottom: "1px solid var(--tp-neutral-200)" }}>
            <a href="#capabilities" onClick={() => setMobileOpen(false)}>Capabilities</a>
            <a href="#how" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#preview" onClick={() => setMobileOpen(false)}>Product preview</a>
            <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            <Link to="/ai-scanner" onClick={() => setMobileOpen(false)} className="tp-btn tp-btn-primary" style={{ justifyContent: "center" }}>Launch app</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div>
            <span className="landing-hero-tag"><Satellite size={14} /> Satellite + AI intelligence</span>
            <h1>
              Regenerative farm<br />
              intelligence from <span className="accent">satellite to soil</span>
            </h1>
            <p className="landing-hero-lead">
              TerraPulse AI combines satellite monitoring, AI-assisted plant and soil analysis,
              and carbon-credit simulation to help farms stay healthy, resilient, and regenerative.
            </p>
            <div className="landing-hero-ctas">
              <Link to="/dashboard" className="tp-btn tp-btn-primary tp-btn-lg">Explore dashboard <ArrowRight size={18} /></Link>
              <Link to="/ai-scanner" className="tp-btn tp-btn-secondary tp-btn-lg">Start analysis</Link>
            </div>
            <div className="landing-hero-stats">
              <div>
                <div className="landing-hero-stat-val">124 ac</div>
                <div className="landing-hero-stat-lbl">Monitored farmland</div>
              </div>
              <div>
                <div className="landing-hero-stat-val">4</div>
                <div className="landing-hero-stat-lbl">Active fields</div>
              </div>
              <div>
                <div className="landing-hero-stat-val">78</div>
                <div className="landing-hero-stat-lbl">Farm health score</div>
              </div>
            </div>
          </div>
          <div className="landing-hero-visual">
            <img
              src="https://images.pexels.com/photos/7564340/pexels-photo-7564340.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Aerial view of structured agricultural farmland"
            />
            <div className="landing-hero-badge">
              <span className="landing-hero-badge-dot" />
              <span className="landing-hero-badge-text">NDVI live · Green Valley Farm</span>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="landing-section" id="capabilities">
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <div className="eyebrow">Capabilities</div>
            <h2>One platform, three intelligence layers</h2>
            <p>From orbit-level monitoring to leaf-level diagnosis and carbon-aware planning.</p>
          </div>
          <div className="cap-grid">
            <div className="cap-card">
              <div className="cap-icon"><MapIcon size={24} /></div>
              <h3>Farm Health</h3>
              <p>Satellite-powered field monitoring with NDVI, moisture stress, vegetation analytics, and interactive field maps.</p>
              <Link to="/farm-health" className="tp-row" style={{ marginTop: 16, fontWeight: 600, fontSize: "0.86rem" }}>
                Open farm health <ArrowRight size={14} />
              </Link>
            </div>
            <div className="cap-card">
              <div className="cap-icon"><ScanLine size={24} /></div>
              <h3>AI Scanner</h3>
              <p>Upload a leaf or soil photo for AI-assisted disease and degradation analysis with regenerative recommendations.</p>
              <Link to="/ai-scanner" className="tp-row" style={{ marginTop: 16, fontWeight: 600, fontSize: "0.86rem" }}>
                Start a scan <ArrowRight size={14} />
              </Link>
            </div>
            <div className="cap-card">
              <div className="cap-icon"><Calculator size={24} /></div>
              <h3>Carbon Intelligence</h3>
              <p>Plan a 3-year crop rotation and simulate soil organic carbon recovery, yield resilience, and voluntary carbon credits.</p>
              <Link to="/carbon-simulator" className="tp-row" style={{ marginTop: 16, fontWeight: 600, fontSize: "0.86rem" }}>
                Run simulator <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" id="how" style={{ background: "var(--tp-neutral-50)" }}>
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <div className="eyebrow">How it works</div>
            <h2>A clear path from monitoring to restoration</h2>
          </div>
          <div className="how-grid">
            <div className="how-step">
              <div className="how-step-num">1</div>
              <h4>Monitor</h4>
              <p>Satellite imagery tracks field NDVI, moisture, and vegetation health continuously.</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">2</div>
              <h4>Analyze</h4>
              <p>AI scans plant and soil images to detect disease, stress, and degradation early.</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">3</div>
              <h4>Optimize</h4>
              <p>Cover-crop and bio-fertilizer recommendations improve soil and yields sustainably.</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">4</div>
              <h4>Restore</h4>
              <p>Simulate carbon recovery and carbon-credit potential from regenerative rotations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section className="landing-section" id="preview">
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <div className="eyebrow">Product preview</div>
            <h2>Built like a real agricultural SaaS</h2>
            <p>Every screen below is a live, working part of the application.</p>
          </div>
          <div className="preview-grid">
            <Link to="/dashboard" className="preview-card">
              <div className="preview-card-top">
                <h4>Dashboard</h4>
                <p>Health score, monitored fields, NDVI, recent scans, carbon metrics.</p>
              </div>
              <div className="preview-card-body">
                <div className="tp-row" style={{ gap: 16 }}>
                  <div className="tp-stat"><span className="tp-stat-value" style={{ color: "var(--tp-green-600)" }}>78</span><span className="tp-stat-label">Health</span></div>
                  <div className="tp-stat"><span className="tp-stat-value">0.57</span><span className="tp-stat-label">NDVI</span></div>
                  <Activity size={48} style={{ color: "var(--tp-green-300)" }} />
                </div>
              </div>
            </Link>
            <Link to="/farm-health" className="preview-card">
              <div className="preview-card-top">
                <h4>Farm map</h4>
                <p>Interactive field boundaries with per-field health, NDVI, and risk.</p>
              </div>
              <div className="preview-card-body">
                <MapIcon size={64} style={{ color: "var(--tp-green-400)" }} />
              </div>
            </Link>
            <Link to="/ai-scanner" className="preview-card">
              <div className="preview-card-top">
                <h4>AI scanner</h4>
                <p>Plant disease and soil degradation analysis with recommendations.</p>
              </div>
              <div className="preview-card-body">
                <ScanLine size={64} style={{ color: "var(--tp-green-400)" }} />
              </div>
            </Link>
            <Link to="/carbon-simulator" className="preview-card">
              <div className="preview-card-top">
                <h4>Carbon simulator</h4>
                <p>3-year rotation planner with SOC, resilience, and credit projections.</p>
              </div>
              <div className="preview-card-body">
                <TrendingUp size={64} style={{ color: "var(--tp-green-400)" }} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-cta">
            <h2>Bring satellite intelligence to your farm today</h2>
            <p>Explore the full TerraPulse AI dashboard, run an AI scan, and simulate your carbon recovery path — all in the live demo.</p>
            <Link to="/dashboard" className="tp-btn tp-btn-primary tp-btn-lg">Launch TerraPulse AI <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        TerraPulse AI · Agricultural intelligence & regenerative farming · Demo build with simulated data
      </footer>
    </div>
  );
}
