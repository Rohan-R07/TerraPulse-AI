// Shared UI components for TerraPulse AI.
import React from "react";

export function Button({ variant = "primary", size = "md", children, ...props }) {
  const cls = ["tp-btn", `tp-btn-${variant}`, size === "sm" && "tp-btn-sm", size === "lg" && "tp-btn-lg"]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "", pad = true, ...props }) {
  return (
    <div className={`tp-card ${pad ? "tp-card-pad" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ icon: Icon, children }) {
  return (
    <div className="tp-card-title">
      {Icon && <Icon size={18} className="tp-card-title-icon" />}
      {children}
    </div>
  );
}

export function Badge({ variant = "neutral", children }) {
  return <span className={`tp-badge tp-badge-${variant}`}>{children}</span>;
}

export function Field({ label, required, error, hint, children }) {
  return (
    <div className="tp-field">
      {label && (
        <label className="tp-label">
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error && <span className="tp-error-text">{error}</span>}
      {hint && !error && <span className="tp-hint">{hint}</span>}
    </div>
  );
}

export function Input({ error, ...props }) {
  return <input className={`tp-input ${error ? "error" : ""}`} {...props} />;
}

export function Select({ error, children, ...props }) {
  return (
    <select className={`tp-select ${error ? "error" : ""}`} {...props}>
      {children}
    </select>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tp-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`tp-tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="tp-progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="tp-progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Spinner({ size = 32 }) {
  return <div className="tp-spinner" style={{ width: size, height: size }} aria-label="Loading" />;
}

export function Skeleton({ w = "100%", h = 16, r }) {
  return <div className="tp-skeleton" style={{ width: w, height: h, borderRadius: r }} />;
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="tp-state">
      {Icon && <div className="tp-state-icon"><Icon size={40} /></div>}
      <div className="tp-state-title">{title}</div>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="tp-state">
      <div className="tp-state-icon" style={{ color: "var(--tp-error)" }}>!</div>
      <div className="tp-state-title">{title}</div>
      {message && <p>{message}</p>}
      {onRetry && (
        <div style={{ marginTop: 16 }}>
          <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="tp-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="tp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tp-modal-head">
          <div className="tp-row" style={{ justifyContent: "space-between" }}>
            <h3>{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">×</Button>
          </div>
        </div>
        <div className="tp-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function RiskBadge({ risk }) {
  const variant = risk === "High" ? "error" : risk === "Medium" ? "warning" : "success";
  return <Badge variant={variant}>{risk} risk</Badge>;
}

export function HealthRing({ value, size = 120, label = "Health" }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  const color = pct >= 75 ? "var(--tp-green-500)" : pct >= 50 ? "var(--tp-warning)" : "var(--tp-error)";
  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--tp-neutral-200)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--tp-neutral-900)" }}>{value}</div>
        <div style={{ fontSize: "0.7rem", color: "var(--tp-neutral-500)" }}>{label}</div>
      </div>
    </div>
  );
}
