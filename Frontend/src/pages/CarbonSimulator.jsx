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
import { useTranslation } from "../hooks/useTranslation.jsx";

const chartTooltipStyle = { borderRadius: 12, border: "1.5px solid var(--tp-neutral-200)", fontSize: "0.84rem", fontWeight: 600, boxShadow: "var(--tp-shadow-sm)", background: "#ffffff", padding: "8px 12px" };

export default function CarbonSimulator() {
  const { t } = useTranslation();
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
    if (!form.soilType) e.soilType = t("simulator.errorSoil", "Select a soil type");
    const ac = Number(form.acreage);
    if (!form.acreage || isNaN(ac) || ac <= 0) e.acreage = t("simulator.errorAcreage", "Enter acreage greater than 0");
    if (ac > 100000) e.acreage = t("simulator.errorAcreageLarge", "Value too large");
    const y = Number(form.historicalYield);
    if (form.historicalYield === "" || isNaN(y) || y < 0) e.historicalYield = t("simulator.errorYield", "Enter a valid yield");
    if (form.rotation.some((r) => !r)) e.rotation = t("simulator.errorRotation", "Select a crop for each year");
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
        <h1>{t("simulator.title")}</h1>
        <p>{t("simulator.subtitle")}</p>
      </div>

      <div className="tp-carbon-simulator-grid">
        {/* Inputs */}
        <Card>
          <CardTitle icon={Calculator}>{t("simulator.inputTitle", "Simulation inputs")}</CardTitle>
          <div className="tp-stack" style={{ gap: 16 }}>
            <Field label={t("simulator.soilType", "Soil type")} required error={errors.soilType}>
              <Select value={form.soilType} onChange={(e) => setForm({ ...form, soilType: e.target.value })}>
                <option value="clay-loam">{t("simulator.soilClayLoam", "Clay Loam (Vertisol)")}</option>
                <option value="silt-loam">{t("simulator.soilSiltLoam", "Silt Loam")}</option>
                <option value="sandy-loam">{t("simulator.soilSandyLoam", "Sandy Loam")}</option>
              </Select>
            </Field>

            <div className="tp-grid tp-grid-2">
              <Field label={t("profileModal.acreage")} required error={errors.acreage}>
                <Input type="number" min="1" step="1" value={form.acreage}
                  onChange={(e) => setForm({ ...form, acreage: e.target.value })}
                  placeholder="e.g. 25" />
              </Field>
              <Field label={t("simulator.historicalYield", "Historical yield (t/acre)")} required error={errors.historicalYield}
                hint={t("simulator.historicalYieldHint", "Average over recent seasons")}>
                <Input type="number" min="0" step="0.1" value={form.historicalYield}
                  onChange={(e) => setForm({ ...form, historicalYield: e.target.value })}
                  placeholder="e.g. 1.8" />
              </Field>
            </div>

            <div>
              <div className="tp-label" style={{ marginBottom: 8 }}>{t("simulator.rotationLabel", "3-year crop rotation")}</div>
              <div className="tp-stack" style={{ gap: 10 }}>
                {[0, 1, 2].map((yr) => (
                  <div key={yr} className="tp-step" style={{ background: "var(--tp-neutral-50)" }}>
                    <span className="tp-step-icon" style={{
                      width: 28, height: 28, borderRadius: "50%", background: "var(--tp-green-600)", color: "#fff",
                      fontWeight: 700, fontSize: "0.82rem",
                    }}>{yr + 1}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.86rem" }}>{t("labels.year", "Year")} {yr + 1}</span>
                    <Select value={form.rotation[yr] || ""} onChange={(e) => setCrop(yr, e.target.value)} style={{ flex: 1 }}>
                      <option value="">{t("simulator.selectCrop", "Select crop…")}</option>
                      <option value="wheat">{t("simulator.cropWheat", "Wheat (Indo-Gangetic Plain)")}</option>
                      <option value="rice">{t("simulator.cropRice", "Rice Paddy (Water intensive)")}</option>
                      <option value="cotton">{t("simulator.cropCotton", "Cotton (Deccan rainfed)")}</option>
                      <option value="soybeans">{t("simulator.cropSoybean", "Soybean (Legume nitrogen fixer)")}</option>
                      <option value="sunnhemp">{t("simulator.cropSunnhemp", "Sunn Hemp (Cover crop)")}</option>
                      <option value="cowpea">{t("simulator.cropCowpea", "Cowpea (Cover crop)")}</option>
                    </Select>
                  </div>
                ))}
              </div>
              {errors.rotation && <div className="tp-error-text" style={{ marginTop: 6 }}>{errors.rotation}</div>}
            </div>

            <div className="tp-row">
              <Button variant="primary" onClick={run} disabled={running}>
                {running ? <><Spinner size={16} /> {t("states.loading")}</> : <><Play size={16} /> {t("buttons.runSimulation")}</>}
              </Button>
              <Button variant="ghost" onClick={reset} disabled={running}><RotateCcw size={14} /> {t("buttons.reset", "Reset")}</Button>
            </div>
            <div className="tp-step" style={{ background: "var(--tp-info-bg)", borderColor: "var(--tp-sky-200)" }}>
              <Info size={16} style={{ color: "var(--tp-sky-600)" }} />
              <span className="tp-hint" style={{ color: "var(--tp-neutral-700)" }}>
                {t("simulator.disclaimer", "Calculations are deterministic based on agronomic inputs, while strategies are generated by Gemini.")}
              </span>
            </div>
          </div>
        </Card>

        {/* Results */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <CardTitle icon={TrendingUp}>{t("simulator.resultsTitle", "Simulation results")}</CardTitle>
            {result && (
              <span className="tp-badge tp-badge-success" style={{ fontWeight: 700 }}>
                {result.dataSource || "LIVE SIMULATOR"}
              </span>
            )}
          </div>

          {!result && !running && (
            <div className="tp-state">
              <Calculator size={40} style={{ color: "var(--tp-neutral-300)" }} />
              <div className="tp-state-title">{t("simulator.noSimulation", "No simulation yet")}</div>
              <p>{t("simulator.runPrompt", "Enter your parameters and run the simulation to see projected outcomes.")}</p>
            </div>
          )}
          {running && (
            <div className="tp-state">
              <Spinner size={36} />
              <div className="tp-state-title" style={{ marginTop: 12 }}>{t("simulator.runningSimulation", "Running multi-scenario simulation…")}</div>
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
                      <th>{t("simulator.scenario", "Scenario")}</th>
                      <th>{t("simulator.socProj", "SOC Projected")}</th>
                      <th>{t("simulator.creditsYr", "Credits/yr")}</th>
                      <th>{t("labels.resilience", "Resilience")}</th>
                      <th>{t("simulator.waterIndex", "Water Index")}</th>
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
                      <td><strong>{t("simulator.scenarioA", "A: Current Practice")}</strong></td>
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
                      <td><strong>{t("simulator.scenarioB", "B: Regenerative (AI)")}</strong></td>
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
                      <td><strong>{t("simulator.scenarioC", "C: Water-Efficient")}</strong></td>
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
                  {t("simulator.chartTitle", "Scenario {selectedScenario} Details: SOC & Credit Accrual Trend").replace("{selectedScenario}", selectedScenario)}
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
                    <Area type="monotone" dataKey="soc" name={t("simulator.soilCarbon", "Soil Carbon (%)")} stroke="var(--tp-green-600)" strokeWidth={2} fill="url(#activeSocFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Strategy Analysis */}
              <div style={{ padding: "16px", background: "var(--tp-green-50)", borderRadius: 12, border: "2.5px solid var(--tp-green-600)" }}>
                <h4 style={{ color: "var(--tp-green-800)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={16} /> {t("simulator.agroAnalysis", "AI Strategic Agro-rotation Analysis")}
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
