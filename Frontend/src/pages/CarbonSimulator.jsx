import { useState } from "react";
import {
  Card, CardTitle, Button, Field, Select, Input, Badge, Spinner, Progress,
} from "../components/ui.jsx";
import { simulatorService } from "../services/api.js";
import { Markdown } from "../components/Markdown.jsx";
import { soilTypes, cropOptions } from "../data/mockData.js";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  Calculator, Sprout, TrendingUp, Leaf, Award, Play, Info, RotateCcw,
  Sparkles, CheckCircle2,
} from "lucide-react";

const chartTooltipStyle = { borderRadius: 12, border: "1.5px solid var(--tp-neutral-200)", fontSize: "0.84rem", fontWeight: 600, boxShadow: "var(--tp-shadow-sm)", background: "#ffffff", padding: "8px 12px" };

export default function CarbonSimulator() {
  const [form, setForm] = useState({
    soilType: "clay-loam",
    acreage: "25",
    historicalYield: "1.8",
    rotation: ["wheat", "soybeans", "wheat"],
  });
  const [errors, setErrors] = useState({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("B"); // 'A', 'B', or 'C'

  const setCrop = (year, cropId) => {
    setForm((f) => {
      const rotation = [...f.rotation];
      rotation[year] = cropId;
      return { ...f, rotation };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.soilType) e.soilType = "Select a soil type";
    const ac = Number(form.acreage);
    if (!form.acreage || isNaN(ac) || ac <= 0) e.acreage = "Enter acreage greater than 0";
    if (ac > 100000) e.acreage = "Value too large";
    const y = Number(form.historicalYield);
    if (form.historicalYield === "" || isNaN(y) || y < 0) e.historicalYield = "Enter a valid yield";
    if (form.rotation.some((r) => !r)) e.rotation = "Select a crop for each year";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const run = async () => {
    if (!validate()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await simulatorService.runSimulation(form);
      setResult(res);
      setSelectedScenario("B"); // Default to Regenerative
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => { setResult(null); setErrors({}); };

  // Generate series helper for charts depending on active scenario data
  const generateSeries = (sc) => {
    if (!sc) return [];
    const years = ["2026", "2027", "2028", "2029", "2030"];
    const stepSoc = (sc.socProjected - sc.socCurrent) / 4;
    const stepRes = (sc.resilience - 60) / 4;
    return years.map((y, i) => ({
      year: y,
      soc: +(sc.socCurrent + stepSoc * i).toFixed(2),
      resilience: Math.round(60 + stepRes * i),
      sequestration: +(sc.sequestrationRate * (0.6 + 0.1 * i)).toFixed(2),
      credits: +(sc.annualCredits * (0.5 + 0.12 * i)).toFixed(1),
    }));
  };

  const activeScenarioData = result ? (selectedScenario === "A" ? result.scenarioA : selectedScenario === "B" ? result.scenarioB : result.scenarioC) : null;
  const activeSeries = activeScenarioData ? generateSeries(activeScenarioData) : [];

  return (
    <div>
      <div className="tp-page-head">
        <h1>Carbon Simulator</h1>
        <p>Plan a 3-year crop rotation and simulate soil carbon recovery, yield resilience, and voluntary carbon credits.</p>
      </div>

      <div className="tp-grid" style={{ gridTemplateColumns: "1fr 1.3fr" }}>
        {/* Inputs */}
        <Card>
          <CardTitle icon={Calculator}>Simulation inputs</CardTitle>
          <div className="tp-stack" style={{ gap: 16 }}>
            <Field label="Soil type" required error={errors.soilType}>
              <Select value={form.soilType} onChange={(e) => setForm({ ...form, soilType: e.target.value })}>
                <option value="clay-loam">Clay Loam (Vertisol)</option>
                <option value="silt-loam">Silt Loam</option>
                <option value="sandy-loam">Sandy Loam</option>
              </Select>
            </Field>

            <div className="tp-grid tp-grid-2">
              <Field label="Acreage (acres)" required error={errors.acreage}>
                <Input type="number" min="1" step="1" value={form.acreage}
                  onChange={(e) => setForm({ ...form, acreage: e.target.value })}
                  placeholder="e.g. 25" />
              </Field>
              <Field label="Historical yield (t/acre)" required error={errors.historicalYield}
                hint="Average over recent seasons">
                <Input type="number" min="0" step="0.1" value={form.historicalYield}
                  onChange={(e) => setForm({ ...form, historicalYield: e.target.value })}
                  placeholder="e.g. 1.8" />
              </Field>
            </div>

            <div>
              <div className="tp-label" style={{ marginBottom: 8 }}>3-year crop rotation</div>
              <div className="tp-stack" style={{ gap: 10 }}>
                {[0, 1, 2].map((yr) => (
                  <div key={yr} className="tp-step" style={{ background: "var(--tp-neutral-50)" }}>
                    <span className="tp-step-icon" style={{
                      width: 28, height: 28, borderRadius: "50%", background: "var(--tp-green-600)", color: "#fff",
                      fontWeight: 700, fontSize: "0.82rem",
                    }}>{yr + 1}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.86rem" }}>Year {yr + 1}</span>
                    <Select value={form.rotation[yr] || ""} onChange={(e) => setCrop(yr, e.target.value)} style={{ flex: 1 }}>
                      <option value="">Select crop…</option>
                      <option value="wheat">Wheat (Indo-Gangetic Plain)</option>
                      <option value="rice">Rice Paddy (Water intensive)</option>
                      <option value="cotton">Cotton (Deccan rainfed)</option>
                      <option value="soybeans">Soybean (Legume nitrogen fixer)</option>
                      <option value="sunnhemp">Sunn Hemp (Cover crop)</option>
                      <option value="cowpea">Cowpea (Cover crop)</option>
                    </Select>
                  </div>
                ))}
              </div>
              {errors.rotation && <div className="tp-error-text" style={{ marginTop: 6 }}>{errors.rotation}</div>}
            </div>

            <div className="tp-row">
              <Button variant="primary" onClick={run} disabled={running}>
                {running ? <><Spinner size={16} /> Running…</> : <><Play size={16} /> Run Simulation</>}
              </Button>
              <Button variant="ghost" onClick={reset} disabled={running}><RotateCcw size={14} /> Reset</Button>
            </div>
            <div className="tp-step" style={{ background: "var(--tp-info-bg)", borderColor: "var(--tp-sky-200)" }}>
              <Info size={16} style={{ color: "var(--tp-sky-600)" }} />
              <span className="tp-hint" style={{ color: "var(--tp-neutral-700)" }}>
                Calculations are deterministic based on agronomic inputs, while strategies are generated by Gemini.
              </span>
            </div>
          </div>
        </Card>

        {/* Results */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <CardTitle icon={TrendingUp}>Simulation results</CardTitle>
            {result && (
              <span className="tp-badge tp-badge-success" style={{ fontWeight: 700 }}>
                {result.dataSource || "LIVE SIMULATOR"}
              </span>
            )}
          </div>

          {!result && !running && (
            <div className="tp-state">
              <Calculator size={40} style={{ color: "var(--tp-neutral-300)" }} />
              <div className="tp-state-title">No simulation yet</div>
              <p>Enter your parameters and run the simulation to see projected outcomes.</p>
            </div>
          )}
          {running && (
            <div className="tp-state">
              <Spinner size={36} />
              <div className="tp-state-title" style={{ marginTop: 12 }}>Running multi-scenario simulation…</div>
              <Progress value={70} />
            </div>
          )}
          {result && (
            <div className="tp-stack" style={{ gap: 16 }}>
              {/* Multi Scenario Comparison Table */}
              <div style={{ overflowX: "auto", border: "2.5px solid #111827", borderRadius: 10, background: "#ffffff" }}>
                <table className="tp-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th>SOC Projected</th>
                      <th>Credits/yr</th>
                      <th>Resilience</th>
                      <th>Water Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      onClick={() => setSelectedScenario("A")}
                      style={{ 
                        cursor: "pointer", 
                        background: selectedScenario === "A" ? "var(--tp-neutral-100)" : "",
                        fontWeight: selectedScenario === "A" ? 700 : 400,
                        borderLeft: selectedScenario === "A" ? "6px solid var(--tp-neutral-600)" : "6px solid transparent"
                      }}
                    >
                      <td><strong>A: Current Practice</strong></td>
                      <td>{result.scenarioA.socProjected}%</td>
                      <td>{result.scenarioA.annualCredits} t</td>
                      <td>{result.scenarioA.resilience}/100</td>
                      <td>{result.scenarioA.waterDemand}/100</td>
                    </tr>
                    <tr 
                      onClick={() => setSelectedScenario("B")}
                      style={{ 
                        cursor: "pointer", 
                        background: selectedScenario === "B" ? "var(--tp-green-50)" : "",
                        fontWeight: selectedScenario === "B" ? 700 : 400,
                        borderLeft: selectedScenario === "B" ? "6px solid var(--tp-green-600)" : "6px solid transparent"
                      }}
                    >
                      <td><strong>B: Regenerative (AI)</strong></td>
                      <td style={{ color: "var(--tp-green-600)" }}>{result.scenarioB.socProjected}%</td>
                      <td style={{ color: "var(--tp-green-600)" }}>{result.scenarioB.annualCredits} t</td>
                      <td>{result.scenarioB.resilience}/100</td>
                      <td>{result.scenarioB.waterDemand}/100</td>
                    </tr>
                    <tr 
                      onClick={() => setSelectedScenario("C")}
                      style={{ 
                        cursor: "pointer", 
                        background: selectedScenario === "C" ? "var(--tp-sky-50)" : "",
                        fontWeight: selectedScenario === "C" ? 700 : 400,
                        borderLeft: selectedScenario === "C" ? "6px solid var(--tp-sky-600)" : "6px solid transparent"
                      }}
                    >
                      <td><strong>C: Water-Efficient</strong></td>
                      <td>{result.scenarioC.socProjected}%</td>
                      <td>{result.scenarioC.annualCredits} t</td>
                      <td>{result.scenarioC.resilience}/100</td>
                      <td>{result.scenarioC.waterDemand}/100</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Active Scenario Detailed Chart */}
              <div style={{ padding: 12, border: "2px solid #111827", borderRadius: 10, background: "var(--tp-neutral-50)" }}>
                <h4 style={{ marginBottom: 8, fontSize: "0.86rem", color: "var(--tp-neutral-700)" }}>
                  Scenario {selectedScenario} Details: SOC & Credit Accrual Trend (2026-2030)
                </h4>
                
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={activeSeries} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="activeSocFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--tp-green-400)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--tp-green-400)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-neutral-200)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--tp-neutral-500)" }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="soc" name="Soil Carbon (%)" stroke="var(--tp-green-600)" strokeWidth={2} fill="url(#activeSocFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Strategy Analysis */}
              <div style={{ padding: "16px", background: "var(--tp-green-50)", borderRadius: 12, border: "2.5px solid var(--tp-green-600)" }}>
                <h4 style={{ color: "var(--tp-green-800)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={16} /> AI Strategic Agro-rotation Analysis
                </h4>
                <div style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--tp-neutral-900)" }}>
                  <Markdown content={result.strategyAnalysis} />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
