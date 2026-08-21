import { useState, useEffect } from "react";
import { useAsync } from "../hooks/useAsync.js";
import { farmService, satelliteService, actionService } from "../services/api.js";
import { FarmMap } from "../components/FarmMap.jsx";
import { Markdown } from "../components/Markdown.jsx";
import {
  Card, CardTitle, Badge, RiskBadge, Spinner, ErrorState, Skeleton, Tabs, HealthRing, Button
} from "../components/ui.jsx";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { ndviHistory, moistureHistory, satelliteSources, satelliteLayers, satelliteDates } from "../data/mockData.js";
import {
  Map as MapIcon, Satellite, Activity, Droplet, Sprout, FlaskConical, Leaf, Layers, Calendar, AlertTriangle, ShieldCheck
} from "lucide-react";

const chartTooltipStyle = { borderRadius: 12, border: "1.5px solid var(--tp-neutral-200)", fontSize: "0.84rem", fontWeight: 600, boxShadow: "var(--tp-shadow-sm)", background: "#ffffff", padding: "8px 12px" };

export default function FarmHealth() {
  const fieldsQ = useAsync(() => farmService.getFields(), []);
  const coverQ = useAsync(() => farmService.getCoverCrops(), []);
  const bioQ = useAsync(() => farmService.getBioFertilizers(), []);

  const [selectedId, setSelectedId] = useState("north");
  const [source, setSource] = useState("sentinel2");
  const [layer, setLayer] = useState("ndvi");
  const [date, setDate] = useState(satelliteDates[0]);
  const [analyticsField, setAnalyticsField] = useState("all");

  // GEE Mode
  const [geeMode, setGeeMode] = useState("demo");
  const [geeLoading, setGeeLoading] = useState(false);
  const [geeData, setGeeData] = useState(null);

  // Advisory states
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryData, setAdvisoryData] = useState(null);
  const [actionLogged, setActionLogged] = useState(false);

  const selected = fieldsQ.data?.find((f) => f.id === selectedId) || fieldsQ.data?.[0];

  // Fetch GEE data when field or mode changes
  useEffect(() => {
    if (selectedId) {
      setGeeLoading(true);
      satelliteService.getSatelliteData(selectedId, geeMode === "live")
        .then(res => {
          setGeeData(res);
          setGeeLoading(false);
        })
        .catch(() => setGeeLoading(false));
    }
  }, [selectedId, geeMode]);

  const handleGenerateAdvisory = async () => {
    if (!selected) return;
    setAdvisoryLoading(true);
    setActionLogged(false);
    try {
      // 1. NDVI change explanation
      const ndviChangeRes = await satelliteService.ndviChangeDetection({
        field_id: selected.name,
        prev_ndvi: geeData?.prevNdvi || 0.72,
        current_ndvi: geeData?.ndvi || selected.ndvi,
        crop: selected.crop,
        moisture: selected.moisture,
        temperature: 34
      });

      // 2. Risk Engine calculation
      const riskRes = await satelliteService.calculateRisk({
        ndvi: geeData?.ndvi || selected.ndvi,
        ndvi_change: ndviChangeRes.changePct,
        moisture: selected.moisture,
        temperature: 34,
        rainfall: 8,
        crop: selected.crop,
        crop_stage: "Flowering",
        soil_type: selected.soilType,
        diseases: selected.stress.includes("stress") ? "Water stress" : "None"
      });

      // 3. Complete advisory
      const advisoryRes = await satelliteService.getAdvisory({
        field_id: selected.name,
        crop: selected.crop,
        crop_stage: "Flowering",
        ndvi: geeData?.ndvi || selected.ndvi,
        moisture: selected.moisture,
        temperature: 34,
        diseases: selected.stress,
        location: "Pune, Maharashtra"
      });

      setAdvisoryData({
        changePct: ndviChangeRes.changePct,
        changeExplanation: ndviChangeRes.explanation,
        riskScore: riskRes.riskScore,
        riskStatus: riskRes.riskStatus,
        riskExplanation: riskRes.explanation,
        urgency: riskRes.urgency,
        advisory: advisoryRes.advisory
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const handleLogAction = async () => {
    if (!selected || !advisoryData) return;
    try {
      await actionService.createAction({
        field: selected.name,
        recommendation: `Irrigate and implement AWD conservation (AI Risk: ${advisoryData.riskScore}/100)`,
        priority: advisoryData.riskStatus === "HIGH" || advisoryData.riskStatus === "CRITICAL" ? "High" : "Medium",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        source: "AI Agro-Advisory"
      });
      setActionLogged(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (fieldsQ.error) {
    return <Card><ErrorState message="Failed to load farm data." onRetry={fieldsQ.refetch} /></Card>;
  }

  const analyticsData = analyticsField === "all" ? ndviHistory : ndviHistory.map((d, i) => ({
    ...d,
    ndvi: +(d.ndvi * (0.7 + 0.1 * (["north", "south", "east", "west"].indexOf(analyticsField) % 4))).toFixed(2),
  }));

  return (
    <div>
      <div className="tp-page-head">
        <h1>Farm Health</h1>
        <p>Interactive field monitoring, satellite layers, vegetation analytics, and regenerative recommendations.</p>
      </div>

      {/* Map + Field detail */}
      <div className="tp-farm-health-grid">
        <Card pad={false}>
          <div style={{ padding: "var(--tp-space-5) var(--tp-space-5) var(--tp-space-3)" }}>
            <CardTitle icon={MapIcon}>Interactive field map</CardTitle>
            <p className="tp-card-sub">Click a field to inspect its condition. Colors reflect health score.</p>
          </div>
          {fieldsQ.loading ? (
            <div style={{ padding: 20, display: "flex", justifyContent: "center" }}><Spinner /></div>
          ) : fieldsQ.data ? (
            <FarmMap fields={fieldsQ.data} selectedId={selectedId} onSelect={setSelectedId} height={440} />
          ) : <Skeleton h={440} />}
        </Card>

        <Card>
          <CardTitle icon={Leaf}>Field detail</CardTitle>
          {!selected ? <Skeleton h={300} /> : (
            <div className="tp-stack" style={{ gap: 14 }}>
              <div className="tp-row" style={{ justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{selected.name}</h3>
                  <span className="tp-hint">{selected.acres} acres · {selected.soilType} soil</span>
                </div>
                <HealthRing value={selected.health} size={92} />
              </div>
              <div className="tp-grid tp-grid-3">
                <Metric label="Crop" value={selected.crop} />
                <Metric label="NDVI" value={geeData ? geeData.ndvi.toFixed(2) : selected.ndvi.toFixed(2)} />
                <Metric label="Moisture" value={`${selected.moisture}%`} />
                <Metric label="Vegetation" value={selected.vegetation} />
                <Metric label="Stress" value={geeData ? geeData.status : selected.stress} />
                <div className="tp-stat"><span className="tp-stat-label">Risk</span><div style={{ marginTop: 4 }}><RiskBadge risk={selected.risk} /></div></div>
              </div>
              <div>
                <strong style={{ fontSize: "0.86rem" }}>Standard Recommendations</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--tp-neutral-600)", fontSize: "0.86rem", display: "flex", flexDirection: "column", gap: 4 }}>
                  {selected.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "2px dashed var(--tp-neutral-200)" }}>
                <Button
                  variant="primary"
                  onClick={handleGenerateAdvisory}
                  disabled={advisoryLoading}
                  style={{ width: "100%" }}
                >
                  {advisoryLoading ? <Spinner size={16} /> : "Run AI Advisory & Risk Engine"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Advisory & NDVI change section */}
      {advisoryData && (
        <Card style={{ marginBottom: 20, border: "2.5px solid #111827", boxShadow: "var(--tp-shadow-md)" }}>
          <CardTitle icon={AlertTriangle}>AI Field Risk & Strategic Advisory</CardTitle>
          <div className="tp-grid tp-grid-3" style={{ marginBottom: 16 }}>
            <div className="tp-stat">
              <span className="tp-stat-label">Risk Score</span>
              <span className="tp-stat-value" style={{ color: "var(--tp-error)" }}>{advisoryData.riskScore}/100</span>
            </div>
            <div className="tp-stat">
              <span className="tp-stat-label">NDVI Change</span>
              <span className="tp-stat-value" style={{ color: advisoryData.changePct < 0 ? "var(--tp-error)" : "var(--tp-success)" }}>
                {advisoryData.changePct}%
              </span>
            </div>
            <div className="tp-stat">
              <span className="tp-stat-label">Urgency</span>
              <span className="tp-stat-value" style={{ fontSize: "1.1rem" }}>{advisoryData.urgency}</span>
            </div>
          </div>

          <div className="tp-grid tp-grid-2" style={{ gap: 20, marginBottom: 16 }}>
            <div style={{ padding: 12, background: "var(--tp-neutral-50)", borderRadius: 10, border: "2px solid #111827" }}>
              <h4 style={{ marginBottom: 6 }}>🛰️ NDVI Change Analysis</h4>
              <div style={{ fontSize: "0.85rem", color: "var(--tp-neutral-700)" }}>
                <Markdown content={advisoryData.changeExplanation} />
              </div>
            </div>
            <div style={{ padding: 12, background: "var(--tp-neutral-50)", borderRadius: 10, border: "2px solid #111827" }}>
              <h4 style={{ marginBottom: 6 }}>🧠 Risk Factor Explanation</h4>
              <div style={{ fontSize: "0.85rem", color: "var(--tp-neutral-700)" }}>
                <Markdown content={advisoryData.riskExplanation} />
              </div>
            </div>
          </div>

          <div style={{ padding: "16px", background: "var(--tp-green-50)", borderRadius: 12, border: "2.5px solid var(--tp-green-600)", marginBottom: 16 }}>
            <h4 style={{ color: "var(--tp-green-800)", marginBottom: 8 }}>📝 Grounded Agro-Advisory Guidelines</h4>
            <div style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--tp-neutral-900)" }}>
              <Markdown content={advisoryData.advisory} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant={actionLogged ? "secondary" : "primary"}
              onClick={handleLogAction}
              disabled={actionLogged}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {actionLogged ? (
                <>
                  <ShieldCheck size={16} /> Logged to Action Center
                </>
              ) : (
                "Add to Action Center"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Satellite monitoring controls */}
      <Card style={{ marginBottom: 20 }}>
        <div className="tp-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <CardTitle icon={Satellite}>Satellite monitoring</CardTitle>
          
          {/* GEE Live/Demo Toggle */}
          <div style={{ display: "flex", alignItems: "center", border: "2.5px solid #111827", borderRadius: 8, overflow: "hidden" }}>
            <button 
              onClick={() => setGeeMode("demo")} 
              style={{ 
                padding: "4px 12px", 
                border: "none",
                background: geeMode === "demo" ? "#111827" : "#ffffff", 
                color: geeMode === "demo" ? "#ffffff" : "#111827",
                fontWeight: 700,
                fontSize: "0.78rem"
              }}
            >
              DEMO DATA
            </button>
            <button 
              onClick={() => setGeeMode("live")} 
              style={{ 
                padding: "4px 12px", 
                border: "none",
                background: geeMode === "live" ? "#111827" : "#ffffff", 
                color: geeMode === "live" ? "#ffffff" : "#111827",
                fontWeight: 700,
                fontSize: "0.78rem"
              }}
            >
              GEE LIVE
            </button>
          </div>
        </div>

        <div className="tp-grid tp-grid-4">
          <div className="tp-field">
            <label className="tp-label">Data source</label>
            <select className="tp-select" value={source} onChange={(e) => setSource(e.target.value)}>
              {satelliteSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span className="tp-hint">{satelliteSources.find((s) => s.id === source)?.resolution} · {satelliteSources.find((s) => s.id === source)?.revisit} revisit</span>
          </div>
          <div className="tp-field">
            <label className="tp-label">Field</label>
            <select className="tp-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {fieldsQ.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <span className="tp-hint">{selected?.crop}</span>
          </div>
          <div className="tp-field">
            <label className="tp-label">Layer</label>
            <select className="tp-select" value={layer} onChange={(e) => setLayer(e.target.value)}>
              {satelliteLayers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <span className="tp-hint"><Layers size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {satelliteLayers.find((l) => l.id === layer)?.name}</span>
          </div>
          <div className="tp-field">
            <label className="tp-label">Date</label>
            <select className="tp-select" value={date} onChange={(e) => setDate(e.target.value)}>
              {satelliteDates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="tp-hint">
              <Calendar size={11} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
              {geeData ? geeData.acquisitionDate : date}
            </span>
          </div>
        </div>
        
        <div className="tp-row" style={{ marginTop: 12 }}>
          {geeLoading ? (
            <span style={{ fontSize: "0.8rem", color: "var(--tp-neutral-500)", display: "flex", alignItems: "center", gap: 6 }}>
              <Spinner size={12} /> Contacting Google Earth Engine...
            </span>
          ) : (
            <>
              <Badge variant={geeData?.isLive ? "success" : "info"}>
                <Satellite size={12} /> {geeData?.dataSource || "Sentinel-2"}
              </Badge>
              <Badge variant="neutral">{satelliteLayers.find((l) => l.id === layer)?.name}</Badge>
              <Badge variant="neutral">{geeData ? geeData.acquisitionDate : date}</Badge>
              <span className="tp-hint" style={{ marginLeft: "auto" }}>
                {geeData?.dataSource?.includes("LIVE") 
                  ? "Google Earth Engine active · sentinel hub" 
                  : "Using offline cached baseline telemetry dataset"}
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Vegetation analytics */}
      <Card style={{ marginBottom: 20 }}>
        <div className="tp-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <CardTitle icon={Activity}>Vegetation analytics</CardTitle>
          <div className="tp-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <label className="tp-label" style={{ margin: 0 }}>Field</label>
            <select className="tp-select" style={{ width: "auto" }} value={analyticsField} onChange={(e) => setAnalyticsField(e.target.value)}>
              <option value="all">All fields (avg)</option>
              {fieldsQ.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div className="tp-grid tp-grid-2">
          <div>
            <h4 style={{ marginBottom: 8, color: "var(--tp-neutral-600)", fontSize: "0.84rem" }}>NDVI</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analyticsData} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="anNdvi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--tp-green-400)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--tp-green-400)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-neutral-200)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="ndvi" stroke="var(--tp-green-600)" strokeWidth={2} fill="url(#anNdvi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 style={{ marginBottom: 8, color: "var(--tp-neutral-600)", fontSize: "0.84rem" }}>Moisture stress</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={moistureHistory} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="anMoist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--tp-sky-500)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--tp-sky-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-neutral-200)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={chartTooltipStyle} />
                <ReferenceLine y={30} stroke="var(--tp-warning)" strokeDasharray="4 4" label={{ value: "Stress threshold", fontSize: 10, fill: "var(--tp-warning)" }} />
                <Area type="monotone" dataKey="moisture" stroke="var(--tp-sky-600)" strokeWidth={2} fill="url(#anMoist)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Cover crops + Bio-fertilizer */}
      <div className="tp-grid tp-grid-2">
        <Card pad={false}>
          <div style={{ padding: "var(--tp-space-5) var(--tp-space-5) 0" }}>
            <CardTitle icon={Sprout}>Cover-crop recommendations</CardTitle>
          </div>
          {coverQ.loading ? <div style={{ padding: 20 }}><Skeleton h={200} /></div> : coverQ.data ? (
            <table className="tp-table">
              <thead><tr><th>Crop</th><th>Purpose</th><th>Benefit</th><th>Suitability</th><th>Timing</th></tr></thead>
              <tbody>
                {coverQ.data.map((c) => (
                  <tr key={c.crop}>
                    <td><strong>{c.crop}</strong></td>
                    <td>{c.purpose}</td>
                    <td>{c.benefit}</td>
                    <td><Badge variant={c.suitability >= 85 ? "success" : c.suitability >= 70 ? "warning" : "neutral"}>{c.suitability}%</Badge></td>
                    <td>{c.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </Card>

        <Card pad={false}>
          <div style={{ padding: "var(--tp-space-5) var(--tp-space-5) 0" }}>
            <CardTitle icon={FlaskConical}>Bio-fertilizer scheduling</CardTitle>
          </div>
          {bioQ.loading ? <div style={{ padding: 20 }}><Skeleton h={200} /></div> : bioQ.data ? (
            <table className="tp-table">
              <thead><tr><th>Field</th><th>Product</th><th>Timing</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {bioQ.data.map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.field}</strong></td>
                    <td>{b.product}</td>
                    <td>{b.timing}</td>
                    <td>{b.reason}</td>
                    <td><Badge variant={b.status === "Urgent" ? "error" : b.status === "Scheduled" ? "success" : "warning"}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="tp-stat">
      <span className="tp-stat-label">{label}</span>
      <span style={{ fontWeight: 700, color: "var(--tp-neutral-800)", fontSize: "0.9rem" }}>{value}</span>
    </div>
  );
}
