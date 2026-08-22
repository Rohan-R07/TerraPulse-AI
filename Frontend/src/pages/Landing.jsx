import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Leaf, Map as MapIcon, ScanLine, Calculator, ArrowRight,
  Satellite, Activity, TrendingUp, Menu, X,
} from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/landing.css";
import { useTranslation } from "../hooks/useTranslation.jsx";

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <img src={logo} alt="TerraPulse AI Logo" style={{ width: "160px", objectFit: "contain" }} />
          </Link>
          <div className="landing-nav-links">
            <a href="#capabilities">{t("landing.nav.capabilities")}</a>
            <a href="#how">{t("landing.nav.howItWorks")}</a>
            <a href="#preview">{t("landing.nav.preview")}</a>
            <Link to="/dashboard">{t("landing.nav.dashboard")}</Link>
          </div>
          <div className="landing-nav-cta">
            <Link to="/dashboard" className="tp-btn tp-btn-primary">{t("landing.nav.launch")} <ArrowRight size={16} /></Link>
          </div>
          <button className="landing-nav-mobile tp-btn tp-btn-ghost" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="landing-nav-mobile-menu" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 24px 20px", borderBottom: "1px solid var(--tp-neutral-200)" }}>
            <a href="#capabilities" onClick={() => setMobileOpen(false)}>{t("landing.nav.capabilities")}</a>
            <a href="#how" onClick={() => setMobileOpen(false)}>{t("landing.nav.howItWorks")}</a>
            <a href="#preview" onClick={() => setMobileOpen(false)}>{t("landing.nav.preview")}</a>
            <Link to="/dashboard" onClick={() => setMobileOpen(false)}>{t("landing.nav.dashboard")}</Link>
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="tp-btn tp-btn-primary" style={{ justifyContent: "center" }}>{t("landing.nav.launch")}</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div>
            <span className="landing-hero-tag"><Satellite size={14} /> {t("landing.hero.tag")}</span>
            <h1>
              {t("landing.hero.titleLine1")}<br />
              {t("landing.hero.titleLine2")} <span className="accent">{t("landing.hero.titleAccent")}</span>
            </h1>
            <p className="landing-hero-lead">
              {t("landing.hero.lead")}
            </p>
            <div className="landing-hero-ctas">
              <Link to="/dashboard" className="tp-btn tp-btn-primary tp-btn-lg">{t("landing.hero.explore")} <ArrowRight size={18} /></Link>
              <Link to="/ai-scanner" className="tp-btn tp-btn-secondary tp-btn-lg">{t("landing.hero.start")}</Link>
            </div>
            <div className="landing-hero-stats">
              <div>
                <div className="landing-hero-stat-val">124 ac</div>
                <div className="landing-hero-stat-lbl">{t("landing.hero.farmland")}</div>
              </div>
              <div>
                <div className="landing-hero-stat-val">4</div>
                <div className="landing-hero-stat-lbl">{t("landing.hero.activeFields")}</div>
              </div>
              <div>
                <div className="landing-hero-stat-val">78</div>
                <div className="landing-hero-stat-lbl">{t("landing.hero.healthScore")}</div>
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
              <span className="landing-hero-badge-text">{t("landing.hero.ndviLive")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="landing-section" id="capabilities">
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <div className="eyebrow">{t("landing.capabilities.eyebrow")}</div>
            <h2>{t("landing.capabilities.title")}</h2>
            <p>{t("landing.capabilities.sub")}</p>
          </div>
          <div className="cap-grid">
            <div className="cap-card">
              <div className="cap-icon"><MapIcon size={24} /></div>
              <h3>{t("landing.capabilities.healthTitle")}</h3>
              <p>{t("landing.capabilities.healthDesc")}</p>
              <Link to="/farm-health" className="tp-row" style={{ marginTop: 16, fontWeight: 600, fontSize: "0.86rem" }}>
                {t("landing.capabilities.healthLink")} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="cap-card">
              <div className="cap-icon"><ScanLine size={24} /></div>
              <h3>{t("landing.capabilities.scannerTitle")}</h3>
              <p>{t("landing.capabilities.scannerDesc")}</p>
              <Link to="/ai-scanner" className="tp-row" style={{ marginTop: 16, fontWeight: 600, fontSize: "0.86rem" }}>
                {t("landing.capabilities.scannerLink")} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="cap-card">
              <div className="cap-icon"><Calculator size={24} /></div>
              <h3>{t("landing.capabilities.carbonTitle")}</h3>
              <p>{t("landing.capabilities.carbonDesc")}</p>
              <Link to="/carbon-simulator" className="tp-row" style={{ marginTop: 16, fontWeight: 600, fontSize: "0.86rem" }}>
                {t("landing.capabilities.carbonLink")} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" id="how" style={{ background: "var(--tp-neutral-50)" }}>
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <div className="eyebrow">{t("landing.how.eyebrow")}</div>
            <h2>{t("landing.how.title")}</h2>
          </div>
          <div className="how-grid">
            <div className="how-step">
              <div className="how-step-num">1</div>
              <h4>{t("landing.how.step1Title")}</h4>
              <p>{t("landing.how.step1Desc")}</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">2</div>
              <h4>{t("landing.how.step2Title")}</h4>
              <p>{t("landing.how.step2Desc")}</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">3</div>
              <h4>{t("landing.how.step3Title")}</h4>
              <p>{t("landing.how.step3Desc")}</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">4</div>
              <h4>{t("landing.how.step4Title")}</h4>
              <p>{t("landing.how.step4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section className="landing-section" id="preview">
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <div className="eyebrow">{t("landing.preview.eyebrow")}</div>
            <h2>{t("landing.preview.title")}</h2>
            <p>{t("landing.preview.sub")}</p>
          </div>
          <div className="preview-grid">
            <Link to="/dashboard" className="preview-card">
              <div className="preview-card-top">
                <h4>{t("landing.preview.dashboardTitle")}</h4>
                <p>{t("landing.preview.dashboardDesc")}</p>
              </div>
              <div className="preview-card-body">
                <div className="tp-row" style={{ gap: 16 }}>
                  <div className="tp-stat"><span className="tp-stat-value" style={{ color: "var(--tp-green-600)" }}>78</span><span className="tp-stat-label">{t("landing.preview.dashboardStatHealth")}</span></div>
                  <div className="tp-stat"><span className="tp-stat-value">0.57</span><span className="tp-stat-label">{t("landing.preview.dashboardStatNdvi")}</span></div>
                  <Activity size={48} style={{ color: "var(--tp-green-300)" }} />
                </div>
              </div>
            </Link>
            <Link to="/farm-health" className="preview-card">
              <div className="preview-card-top">
                <h4>{t("landing.preview.mapTitle")}</h4>
                <p>{t("landing.preview.mapDesc")}</p>
              </div>
              <div className="preview-card-body">
                <MapIcon size={64} style={{ color: "var(--tp-green-400)" }} />
              </div>
            </Link>
            <Link to="/ai-scanner" className="preview-card">
              <div className="preview-card-top">
                <h4>{t("landing.preview.scannerTitle")}</h4>
                <p>{t("landing.preview.scannerDesc")}</p>
              </div>
              <div className="preview-card-body">
                <ScanLine size={64} style={{ color: "var(--tp-green-400)" }} />
              </div>
            </Link>
            <Link to="/carbon-simulator" className="preview-card">
              <div className="preview-card-top">
                <h4>{t("landing.preview.carbonTitle")}</h4>
                <p>{t("landing.preview.carbonDesc")}</p>
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
            <h2>{t("landing.cta.title")}</h2>
            <p>{t("landing.cta.desc")}</p>
            <Link to="/dashboard" className="tp-btn tp-btn-primary tp-btn-lg">{t("landing.cta.btn")} <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
