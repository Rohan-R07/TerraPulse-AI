import { useState, useEffect } from "react";
import {
  Card, CardTitle, Badge, Button, Spinner, Skeleton, ErrorState, Field, Select, Input,
} from "../components/ui.jsx";
import { indiaService, ragService } from "../services/api.js";
import { Markdown } from "../components/Markdown.jsx";
import {
  Globe, Search, MapPin, AlertTriangle, ShieldCheck, BookOpen, Users, Compass, HelpCircle
} from "lucide-react";

export default function IndiaIntelligence() {
  // Filters
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [crop, setCrop] = useState("Cotton");
  const [season, setSeason] = useState("Kharif");

  // Regional metrics state
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState(null);

  // Cooperative insights state
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState([]);

  // RAG Search state
  const [ragQuery, setRagQuery] = useState("");
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResult, setRagResult] = useState(null);

  const fetchRegionalData = async () => {
    setMetricsLoading(true);
    setInsightsLoading(true);
    try {
      const stats = await indiaService.getIndiaIntelligence(state, district, crop, season);
      const coops = await indiaService.getCooperativeInsights(state, crop);
      setMetricsData(stats.stats);
      setInsightsData(coops.insights);
    } catch (err) {
      console.error(err);
    } finally {
      setMetricsLoading(false);
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegionalData();
  }, [state, district, crop, season]);

  const handleRagSearch = async () => {
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    setRagResult(null);
    try {
      const res = await ragService.queryRag(ragQuery, crop);
      setRagResult(res);
    } catch (err) {
      console.error(err);
      setRagResult({ answer: "Search failed. Make sure the backend server is reachable." });
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div>
      <div className="tp-page-head">
        <h1>India Agricultural Intelligence</h1>
        <p>National and regional data aggregation. Monitor crop health trends, cooperative water stress warnings, and lookup verified ICAR guidelines.</p>
      </div>

      {/* Dropdown Filters */}
      <Card style={{ marginBottom: 20 }}>
        <div className="tp-grid tp-grid-4">
          <Field label="State / Region">
            <Select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="Maharashtra">Maharashtra (Deccan)</option>
              <option value="Karnataka">Karnataka (Southern Vertisols)</option>
              <option value="Punjab">Punjab (Indo-Gangetic)</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="West Bengal">West Bengal</option>
            </Select>
          </Field>

          <Field label="District">
            <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
              {state === "Maharashtra" ? (
                <>
                  <option value="Pune">Pune</option>
                  <option value="Nagpur">Nagpur</option>
                  <option value="Amravati">Amravati</option>
                </>
              ) : state === "Punjab" ? (
                <>
                  <option value="Ludhiana">Ludhiana</option>
                  <option value="Patiala">Patiala</option>
                </>
              ) : (
                <>
                  <option value="Central">Central District</option>
                  <option value="Southern">Southern District</option>
                </>
              )}
            </Select>
          </Field>

          <Field label="Crop Spec">
            <Select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="Cotton">Cotton (Kharif Cash)</option>
              <option value="Wheat">Wheat (Rabi Staple)</option>
              <option value="Rice">Rice Paddy</option>
              <option value="Soybeans">Soybeans</option>
            </Select>
          </Field>

          <Field label="Season">
            <Select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Zaid">Zaid (Summer)</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* Main Aggregates Grid */}
      <div className="tp-grid tp-grid-3" style={{ marginBottom: 20 }}>
        {metricsLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} h={120} />)
        ) : metricsData ? (
          <>
            <Card>
              <div className="tp-stat">
                <span className="tp-stat-label">Active Node Connections</span>
                <span className="tp-stat-value">{metricsData.monitoredFarms} farms</span>
                <span className="tp-hint" style={{ color: "var(--tp-green-600)", fontWeight: 700 }}>Maharashtra Regional Pool</span>
              </div>
            </Card>

            <Card>
              <div className="tp-stat">
                <span className="tp-stat-label">Crop Water Stress</span>
                <span className="tp-stat-value" style={{ color: metricsData.waterStress > 50 ? "var(--tp-error)" : "var(--tp-warning)" }}>
                  {metricsData.waterStress}%
                </span>
                <span className="tp-hint">Monitored groundwater depleting</span>
              </div>
            </Card>

            <Card>
              <div className="tp-stat">
                <span className="tp-stat-label">Regenerative Adoption Rate</span>
                <span className="tp-stat-value" style={{ color: "var(--tp-green-600)" }}>{metricsData.regenAdoption}%</span>
                <span className="tp-hint">Cover crop & AWD adoption</span>
              </div>
            </Card>
          </>
        ) : (
          <Skeleton h={120} />
        )}
      </div>

      <div className="tp-grid tp-grid-2">
        {/* Cooperative Insights (State Alerts) */}
        <Card>
          <CardTitle icon={Users}>Cooperative Community Alerts</CardTitle>
          <p className="tp-card-sub" style={{ marginBottom: 16 }}>
            Shared insights between regional nodes. Cooperatively alerts neighbors on pest outbreaks or groundwater over-draws.
          </p>

          {insightsLoading ? (
            <div className="tp-stack">{[...Array(2)].map((_, i) => <Skeleton key={i} h={70} />)}</div>
          ) : insightsData.length === 0 ? (
            <p className="tp-hint">No alerts reported in this region.</p>
          ) : (
            <div className="tp-stack" style={{ gap: 12 }}>
              {insightsData.map((ins, i) => (
                <div key={i} className="tp-step" style={{ 
                  background: ins.severity === "Critical" ? "var(--tp-error-bg)" : "var(--tp-neutral-50)",
                  border: ins.severity === "Critical" ? "2.5px solid var(--tp-error)" : "2.5px solid #111827"
                }}>
                  <span className="tp-step-icon">
                    <AlertTriangle size={18} style={{ color: ins.severity === "Critical" ? "var(--tp-error)" : "var(--tp-warning)" }} />
                  </span>
                  <div className="tp-grow">
                    <div className="tp-row" style={{ justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "0.86rem" }}>{ins.title}</strong>
                      <Badge variant={ins.severity === "Critical" ? "error" : "warning"}>{ins.severity}</Badge>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--tp-neutral-600)", marginTop: 2 }}>{ins.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Agricultural RAG (ICAR Retrieval) */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <CardTitle icon={BookOpen}>Authoritative ICAR Knowledge RAG</CardTitle>
          <p className="tp-card-sub" style={{ marginBottom: 12 }}>
            Search verified guidelines from the Indian Council of Agricultural Research. Returns context-anchored regenerative practices.
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRagSearch()}
              placeholder="e.g. Sowing window for wheat, alternate wetting and drying"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "2px solid #111827",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
            <Button variant="primary" onClick={handleRagSearch} disabled={ragLoading || !ragQuery.trim()}>
              {ragLoading ? <Spinner size={14} /> : <Search size={16} />}
            </Button>
          </div>

          {/* RAG response */}
          {ragLoading && <Skeleton h={150} />}
          {ragResult && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ 
                padding: 12, 
                background: "var(--tp-green-50)", 
                border: "2.5px solid var(--tp-green-600)", 
                borderRadius: 10,
                fontSize: "0.84rem",
                lineHeight: 1.4,
                color: "var(--tp-neutral-800)"
              }}>
                <Markdown content={ragResult.answer} />
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Badge variant="success"><ShieldCheck size={12} /> Verified Guideline</Badge>
                {ragResult.dataSource && (
                  <span className="tp-hint" style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--tp-green-600)" }}>
                    {ragResult.dataSource}
                  </span>
                )}
              </div>
            </div>
          )}

          {!ragResult && !ragLoading && (
            <div className="tp-state" style={{ flex: 1, padding: "20px 0" }}>
              <Compass size={32} style={{ color: "var(--tp-neutral-300)" }} />
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginTop: 4 }}>Ask a question</div>
              <p style={{ fontSize: "0.78rem" }}>Retrieve regional practices for India-scale wheat, rice, or cotton.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
