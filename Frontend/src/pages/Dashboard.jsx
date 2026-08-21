import { useState, useEffect } from "react";
import { useAsync } from "../hooks/useAsync.js";
import { dashboardService, userService } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  Card, CardTitle, Badge, RiskBadge, HealthRing, Spinner, ErrorState,
  Skeleton, Button, Field, Input
} from "../components/ui.jsx";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Activity, Droplet, ScanLine, Leaf, TrendingUp, AlertTriangle,
  FlaskConical, Sprout, Search, Droplets, ArrowRight, Award, ClipboardCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const priorityVariant = (p) => (p === "High" ? "error" : p === "Medium" ? "warning" : "neutral");
const recIcon = (name) =>
  ({ droplet: Droplet, search: Search, flask: FlaskConical, sprout: Sprout, alert: AlertTriangle }[name] || Leaf);

const chartTooltipStyle = {
  borderRadius: 12, border: "1.5px solid var(--tp-neutral-200)", fontSize: "0.84rem", fontWeight: 600, boxShadow: "var(--tp-shadow-sm)", background: "#ffffff", padding: "8px 12px",
};

export default function Dashboard() {
  const { user } = useAuth();
  const overview = useAsync(() => dashboardService.getOverview(), []);
  const fields = useAsync(() => dashboardService.getFields(), []);
  const ndvi = useAsync(() => dashboardService.getNdviHistory(), []);
  const moisture = useAsync(() => dashboardService.getMoistureHistory(), []);
  const scans = useAsync(() => dashboardService.getRecentScans(), []);
  const recs = useAsync(() => dashboardService.getRecommendations(), []);
  const carbon = useAsync(() => dashboardService.getCarbonMetrics(), []);
  const profile = useAsync(() => userService.getProfile(), [user]);

  const [selectedRec, setSelectedRec] = useState(null);
  
  // Profile edit states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFarmName, setEditFarmName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAcreage, setEditAcreage] = useState(30);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [modalError, setModalError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Set default selected recommendation when loaded
  useEffect(() => {
    if (recs.data && recs.data.length > 0) {
      setSelectedRec(recs.data[0]);
    }
  }, [recs.data]);

  // Populate edit fields when profile data loads
  useEffect(() => {
    if (profile.data) {
      setEditFarmName(profile.data.farmName || "Green Valley Farm");
      setEditLocation(profile.data.location || "Pune, Maharashtra");
      setEditAcreage(profile.data.acreage || 30);
      setEditDisplayName(profile.data.displayName || user?.displayName || "Farmer");
    }
  }, [profile.data, user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setSaveLoading(true);
    try {
      await userService.updateProfile({
        farmName: editFarmName,
        location: editLocation,
        acreage: editAcreage,
        displayName: editDisplayName
      });
      await profile.refetch();
      setIsEditOpen(false);
    } catch (err) {
      setModalError(err.message || "Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const anyError = [overview, fields, ndvi, moisture, scans, recs, carbon, profile].find((q) => q.error);

  return (
    <div>
      <div className="tp-page-head">
        <h1>Dashboard</h1>
        <p>Real-time overview of {profile.data?.farmName || "Green Valley Farm"} health, scans, and carbon metrics.</p>
      </div>

      {anyError && (
        <Card>
          <ErrorState message="Some dashboard data failed to load." onRetry={() => { overview.refetch(); fields.refetch(); }} />
        </Card>
      )}

      {/* Top row: health + stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: 20 }}>
        <Card>
          {overview.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><Spinner /></div>
          ) : overview.data ? (
            <div className="tp-row" style={{ gap: 16 }}>
              <HealthRing value={overview.data.healthScore} />
              <div className="tp-stack" style={{ gap: 4 }}>
                <span className="tp-stat-label">Farm health</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge variant="success">{overview.data.status}</Badge>
                  <span className="tp-hint" style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--tp-green-600)" }}>
                    {overview.data.dataSource?.includes("LIVE") ? "LIVE" : "DEMO"}
                  </span>
                </div>
                <span className="tp-hint" style={{ color: "var(--tp-green-600)", fontWeight: 600 }}>
                  ▲ {overview.data.healthTrend || 4}% this month
                </span>
              </div>
            </div>
          ) : <Skeleton h={120} />}
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {profile.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><Spinner /></div>
          ) : profile.data ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", width: "100%" }}>
                  <CardTitle icon={Sprout}>Farm Ledger</CardTitle>
                  <Badge variant="neutral">MongoDB Sync</Badge>
                </div>
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>{profile.data.farmName || "Green Valley Farm"}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--tp-neutral-500)", fontWeight: 600 }}>{profile.data.location || "Pune, Maharashtra"}</div>
                  <div style={{ fontSize: "0.75rem", marginTop: 4, display: "flex", gap: 6, color: "var(--tp-neutral-600)" }}>
                    <span><strong>Acreage:</strong> {profile.data.acreage || 30} ac</span>
                    <span>•</span>
                    <span><strong>User:</strong> {profile.data.displayName || "Farmer"}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setIsEditOpen(true)}
                style={{ marginTop: 10, width: "fit-content", padding: "4px 10px", height: 28, fontSize: "0.72rem" }}
              >
                Edit Profile
              </Button>
            </div>
          ) : <Skeleton h={120} />}
        </Card>

        <StatCard loading={fields.loading} label="Monitored fields" value={fields.data?.length} icon={Leaf} source="DEMO" />
        <StatCard loading={ndvi.loading} label="Current NDVI" value={ndvi.data ? ndvi.data[ndvi.data.length - 1].ndvi.toFixed(2) : null} icon={Activity} source="LIVE" />
        <StatCard loading={carbon.loading} label="Est. carbon credits" value={carbon.data?.estimatedCredits} suffix=" tCO₂e/yr" icon={Award} source="MODEL" />
      </div>

      {/* NDVI + Moisture */}
      <div className="tp-grid tp-grid-2" style={{ marginBottom: 20 }}>
        <Card>
          <div className="tp-row" style={{ justifyContent: "space-between" }}>
            <CardTitle icon={Activity}>NDVI trend</CardTitle>
            <span className="tp-hint" style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--tp-green-600)" }}>LIVE (SATELLITE)</span>
          </div>
          {ndvi.loading ? <Skeleton h={200} /> : ndvi.data ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ndvi.data} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--tp-green-400)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--tp-green-400)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-neutral-200)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="ndvi" stroke="var(--tp-green-600)" strokeWidth={2} fill="url(#ndviFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </Card>

        <Card>
          <div className="tp-row" style={{ justifyContent: "space-between" }}>
            <CardTitle icon={Droplet}>Soil moisture trend</CardTitle>
            <span className="tp-hint" style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--tp-green-600)" }}>LIVE (WEATHER)</span>
          </div>
          {moisture.loading ? <Skeleton h={200} /> : moisture.data ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={moisture.data} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="moistFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--tp-sky-500)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--tp-sky-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-neutral-200)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="moisture" stroke="var(--tp-sky-600)" strokeWidth={2} fill="url(#moistFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
          {moisture.data && (
            <div className="tp-row" style={{ marginTop: 8 }}>
              <Badge variant="warning"><Droplets size={12} /> Stress in West Field</Badge>
            </div>
          )}
        </Card>
      </div>

      {/* Fields table + recent scans */}
      <div className="tp-grid tp-grid-2" style={{ marginBottom: 20 }}>
        <Card pad={false}>
          <div style={{ padding: "var(--tp-space-5) var(--tp-space-5) 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle icon={Leaf}>Monitored fields</CardTitle>
            <span className="tp-hint" style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--tp-green-600)" }}>DEMO</span>
          </div>
          {fields.loading ? (
            <div style={{ padding: 20 }}><Skeleton h={180} /></div>
          ) : fields.data ? (
            <table className="tp-table">
              <thead>
                <tr><th>Field</th><th>Crop</th><th>NDVI</th><th>Moisture</th><th>Risk</th></tr>
              </thead>
              <tbody>
                {fields.data.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.name}</strong><div className="tp-hint">{f.acres} ac · {f.soilType}</div></td>
                    <td>{f.crop}</td>
                    <td>{f.ndvi.toFixed(2)}</td>
                    <td>{f.moisture}%</td>
                    <td><RiskBadge risk={f.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <div style={{ padding: 12 }}>
            <Link to="/farm-health" className="tp-row" style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--tp-green-600)" }}>
              Open farm health <ArrowRight size={14} />
            </Link>
          </div>
        </Card>

        <Card pad={false}>
          <div style={{ padding: "var(--tp-space-5) var(--tp-space-5) 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle icon={ScanLine}>Recent AI scans</CardTitle>
            <span className="tp-hint" style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--tp-green-600)" }}>MODEL</span>
          </div>
          {scans.loading ? (
            <div style={{ padding: 20 }}><Skeleton h={180} /></div>
          ) : scans.data ? (
            <table className="tp-table">
              <thead>
                <tr><th>Date</th><th>Type</th><th>Result</th><th>Severity</th></tr>
              </thead>
              <tbody>
                {scans.data.map((s) => (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td><Badge variant={s.type === "Plant" ? "info" : "neutral"}>{s.type}</Badge></td>
                    <td>{s.result}</td>
                    <td><Badge variant={s.severity === "High" ? "error" : s.severity === "Medium" ? "warning" : s.severity === "Low" ? "info" : "success"}>{s.severity}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <div style={{ padding: 12 }}>
            <Link to="/ai-scanner" className="tp-row" style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--tp-green-600)" }}>
              New scan <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recommendations + Carbon */}
      <div className="tp-grid tp-grid-2">
        <Card>
          <div className="tp-row" style={{ justifyContent: "space-between" }}>
            <CardTitle icon={AlertTriangle}>Recommendations</CardTitle>
            <span className="tp-hint" style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--tp-green-600)" }}>MODEL (GEMINI)</span>
          </div>
          {recs.loading ? (
            <div className="tp-stack">{[...Array(3)].map((_, i) => <Skeleton key={i} h={56} />)}</div>
          ) : recs.data ? (
            <>
              <div className="tp-stack" style={{ gap: 12 }}>
                {recs.data.map((r) => {
                  const Icon = recIcon(r.icon);
                  const isSelected = selectedRec?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      className="tp-step"
                      onClick={() => setSelectedRec(r)}
                      style={{
                        background: isSelected ? "var(--tp-green-50)" : "var(--tp-neutral-50)",
                        cursor: "pointer",
                        border: isSelected ? "2.5px solid var(--tp-green-600)" : "2.5px solid transparent",
                        transition: "all 0.2s"
                      }}
                    >
                      <span className="tp-step-icon"><Icon size={18} style={{ color: "var(--tp-green-600)" }} /></span>
                      <div className="tp-grow">
                        <div className="tp-row" style={{ justifyContent: "space-between" }}>
                          <strong style={{ fontSize: "0.88rem" }}>{r.title}</strong>
                          <Badge variant={priorityVariant(r.priority)}>{r.priority}</Badge>
                        </div>
                        <div className="tp-hint" style={{ marginTop: 2 }}>{r.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedRec && (
                <div style={{ marginTop: 16, padding: "12px 16px", border: "2.5px solid #111827", borderRadius: 10, background: "#ffffff", boxShadow: "var(--tp-shadow-xs)" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.88rem", marginBottom: 6, color: "var(--tp-green-700)" }}>
                    💡 Why This Recommendation? ({selectedRec.title})
                  </div>
                  <div style={{ fontSize: "0.82rem", lineHeight: 1.4, color: "var(--tp-neutral-700)" }}>
                    {selectedRec.title.includes("Irrigate") || selectedRec.title.includes("water") ? (
                      <>
                        <strong>OBSERVED:</strong> Soil moisture dropped to 28% in West Field; temperature is 34°C. NDVI shows downward trend (-19.4%).<br />
                        <strong>INFERRED:</strong> Active crop is experiencing dry stress, reducing growth density.<br />
                        <strong>RECOMMENDED:</strong> Run a 12mm watering cycle. Alternate Wetting & Drying method is recommended for cotton roots.
                      </>
                    ) : selectedRec.title.includes("pest") || selectedRec.title.includes("curl") || selectedRec.title.includes("Trap") ? (
                      <>
                        <strong>OBSERVED:</strong> High temperature humidity index. Local community cooperative alert: Pink Bollworm outbreaks in nearby farms.<br />
                        <strong>INFERRED:</strong> Threat level is high during flowering stage.<br />
                        <strong>RECOMMENDED:</strong> Install 5 pheromone traps per acre and spray organic shield.
                      </>
                    ) : (
                      <>
                        <strong>OBSERVED:</strong> Low soil organic matter, dry clay structures in West Field.<br />
                        <strong>INFERRED:</strong> Poor water retention capacity is amplifying crop water stress.<br />
                        <strong>RECOMMENDED:</strong> Apply compost and introduce sunn-hemp bio-fertilizers.
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Center Preview */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "2px dashed var(--tp-neutral-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="tp-hint" style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <ClipboardCheck size={14} /> Action Center: 2 recommendations pending
                </span>
                <Link to="/actions" className="tp-btn tp-btn-sm tp-btn-primary" style={{ padding: "4px 10px", fontSize: "0.8rem", textDecoration: "none" }}>
                  Execute Actions
                </Link>
              </div>
            </>
          ) : null}
        </Card>

        <Card>
          <div className="tp-row" style={{ justifyContent: "space-between" }}>
            <CardTitle icon={TrendingUp}>Carbon metrics (estimates)</CardTitle>
            <span className="tp-hint" style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--tp-green-600)" }}>MODEL</span>
          </div>
          {carbon.loading ? <Skeleton h={160} /> : carbon.data ? (
            <>
              <div className="tp-grid tp-grid-3" style={{ marginBottom: 16 }}>
                <div className="tp-stat">
                  <span className="tp-stat-value">{carbon.data.socCurrent}</span>
                  <span className="tp-stat-label">SOC current (%)</span>
                </div>
                <div className="tp-stat">
                  <span className="tp-stat-value" style={{ color: "var(--tp-green-600)" }}>{carbon.data.socProjected}</span>
                  <span className="tp-stat-label">SOC projected (%)</span>
                </div>
                <div className="tp-stat">
                  <span className="tp-stat-value">{carbon.data.sequestrationRate}</span>
                  <span className="tp-stat-label">Seq. (tCO₂e/yr)</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={carbon.data.trend} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-neutral-200)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="soc" stroke="var(--tp-green-600)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <Link to="/carbon-simulator" className="tp-row" style={{ marginTop: 12, fontWeight: 600, fontSize: "0.86rem", color: "var(--tp-green-600)" }}>
                Open simulator <ArrowRight size={14} />
              </Link>
            </>
          ) : null}
        </Card>
      </div>
      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17, 24, 39, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 20
        }}>
          <div style={{ width: "100%", maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardTitle icon={Sprout}>Edit Farm Details</CardTitle>
              <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                <Field label="Farm Name" required>
                  <Input 
                    type="text" 
                    value={editFarmName} 
                    onChange={(e) => setEditFarmName(e.target.value)} 
                    required 
                  />
                </Field>
                <Field label="Location" required>
                  <Input 
                    type="text" 
                    value={editLocation} 
                    onChange={(e) => setEditLocation(e.target.value)} 
                    required 
                  />
                </Field>
                <Field label="Acreage (Acres)" required>
                  <Input 
                    type="number" 
                    value={editAcreage} 
                    onChange={(e) => setEditAcreage(e.target.value)} 
                    required 
                  />
                </Field>
                <Field label="Farmer Display Name" required>
                  <Input 
                    type="text" 
                    value={editDisplayName} 
                    onChange={(e) => setEditDisplayName(e.target.value)} 
                    required 
                  />
                </Field>

                {modalError && (
                  <div className="tp-error-text" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    {modalError}
                  </div>
                )}

                <div className="tp-row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                  <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={saveLoading}>
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ loading, label, value, icon: Icon, suffix, source }) {
  return (
    <Card>
      <div className="tp-row" style={{ justifyContent: "space-between" }}>
        <div className="tp-stat">
          {loading ? <Skeleton w={60} h={28} /> : (
            <div className="tp-row" style={{ gap: 8, alignItems: "baseline" }}>
              <span className="tp-stat-value">{value}{suffix}</span>
              {source && (
                <span className="tp-hint" style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--tp-green-600)" }}>
                  {source}
                </span>
              )}
            </div>
          )}
          <span className="tp-stat-label">{label}</span>
        </div>
        {Icon && <Icon size={28} style={{ color: "var(--tp-green-400)" }} />}
      </div>
    </Card>
  );
}
