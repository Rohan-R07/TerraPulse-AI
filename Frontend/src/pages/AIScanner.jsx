import { useState, useCallback, useRef } from "react";
import {
  Card, CardTitle, Badge, Button, Tabs, Progress, ErrorState, Field, Select,
} from "../components/ui.jsx";
import { scannerService, actionService } from "../services/api.js";
import { Markdown } from "../components/Markdown.jsx";
import { languages, scannerProcessingSteps } from "../data/mockData.js";
import {
  ScanLine, Upload, Image as ImageIcon, X, Leaf, Layers, CheckCircle2,
  AlertTriangle, Sparkles, Languages, RotateCcw, FlaskConical, Bug, ShieldCheck, Info
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation.jsx";

const MAX_SIZE = 8 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export default function AIScanner() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("plant"); // plant | soil
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | processing | result | error
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [lang, setLang] = useState("en");
  const [actionLogged, setActionLogged] = useState(false);
  const fileInput = useRef(null);

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setStage("idle");
    setStepIdx(0);
    setResult(null);
    setActionLogged(false);
  };

  const handleFile = useCallback((f) => {
    setError(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError(t("scanner.unsupportedFormat", "Unsupported format. Use JPG, PNG, or WEBP."));
      return;
    }
    if (f.size > MAX_SIZE) {
      setError(t("scanner.fileTooLarge", "File too large. Maximum 8 MB."));
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStage("idle");
    setResult(null);
    setActionLogged(false);
  }, [t]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setStage("processing");
    setStepIdx(0);
    setError(null);
    setActionLogged(false);

    // animate steps
    const stepTimer = setInterval(() => {
      setStepIdx((i) => (i < scannerProcessingSteps.length - 1 ? i + 1 : i));
    }, 480);
    try {
      const res = mode === "plant"
        ? await scannerService.analyzePlant(file)
        : await scannerService.analyzeSoil(file);
      clearInterval(stepTimer);
      setStepIdx(scannerProcessingSteps.length - 1);
      setResult(res);
      setTimeout(() => setStage("result"), 300);
    } catch (e) {
      clearInterval(stepTimer);
      setError(e.message || t("states.error"));
      setStage("error");
    }
  };

  const handleLogAction = async () => {
    if (!result) return;
    try {
      const recText = mode === "plant"
        ? `Apply treatment for: ${result.disease} (AI diagnosis)`
        : "Implement soil regeneration steps: organic composting & Daikon Radish cover crop";

      await actionService.createAction({
        field: "West Field",
        recommendation: recText,
        priority: "Medium",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        source: "AI Scanner"
      });
      setActionLogged(true);
    } catch (err) {
      console.error(err);
    }
  };

  const recs = scannerService.getRecommendations(lang);

  return (
    <div>
      <div className="tp-page-head">
        <h1>{t("scanner.title")}</h1>
        <p>{t("scanner.subtitle")}</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="tp-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <Tabs
            tabs={[
              { id: "plant", label: t("scanner.tabPlant") },
              { id: "soil", label: t("scanner.tabSoil") },
            ]}
            active={mode}
            onChange={(m) => { setMode(m); reset(); }}
          />
          <span className="tp-badge tp-badge-info" style={{ fontWeight: 700 }}>
            {result?.dataSource || t("states.modelActive", "MODEL ACTIVE")}
          </span>
        </div>
      </Card>

      <div className="tp-grid tp-grid-2">
        {/* Upload / preview / processing */}
        <Card>
          <CardTitle icon={mode === "plant" ? Leaf : Layers}>
            {mode === "plant" ? t("scanner.plantImage", "Plant image") : t("scanner.soilImage", "Soil image")}
          </CardTitle>

          {stage === "processing" ? (
            <ProcessingView stepIdx={stepIdx} />
          ) : !previewUrl ? (
            <div
              className={`tp-upload ${dragOver ? "drag" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInput.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") fileInput.current?.click(); }}
            >
              <div className="tp-upload-icon"><Upload size={40} /></div>
              <div className="tp-upload-title">{t("scanner.dragDrop", "Drag & drop an image")}</div>
              <div className="tp-upload-sub">{t("scanner.clickBrowse", "or click to browse from your device")}</div>
              <div className="tp-upload-formats">JPG · PNG · WEBP · max 8 MB</div>
            </div>
          ) : (
            <div className="tp-stack" style={{ gap: 14 }}>
              <div className="tp-preview">
                <img src={previewUrl} alt="Selected preview" className="tp-preview-img" />
              </div>
              <div className="tp-row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--tp-neutral-800)" }}>{file?.name}</div>
                  <div className="tp-hint">{file ? (file.size / 1024).toFixed(0) : 0} KB</div>
                </div>
                <div className="tp-row">
                  <Button variant="ghost" size="sm" onClick={reset}><X size={14} /> {t("buttons.remove", "Remove")}</Button>
                  <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}><RotateCcw size={14} /> {t("buttons.replace", "Replace")}</Button>
                </div>
              </div>
              {error && <div className="tp-error-text">{error}</div>}
              {stage === "error" ? (
                <ErrorState message={error} onRetry={analyze} />
              ) : (
                <Button variant="primary" onClick={analyze} disabled={stage === "processing"} style={{ width: "100%" }}>
                  <Sparkles size={16} /> {mode === "plant" ? t("buttons.analyzePlant", "Analyze Plant") : t("buttons.analyzeSoil", "Analyze Soil")}
                </Button>
              )}
            </div>
          )}

          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED.join(",")}
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </Card>

        {/* Result / empty state */}
        <Card>
          <CardTitle icon={ScanLine}>{t("scanner.analysisResult", "Analysis result")}</CardTitle>
          {stage === "result" && result ? (
            <div className="tp-stack" style={{ gap: 16 }}>
              {mode === "plant" ? (
                <div className="tp-stack" style={{ gap: 12 }}>
                  <div className="tp-row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <span className="tp-stat-label">{t("scanner.cropCondition", "Crop & Condition")}</span>
                      <strong style={{ fontSize: "1.1rem", display: "block" }}>
                        {result.crop} — {result.disease}
                      </strong>
                    </div>
                    {result.confidence && (
                      <div className="tp-stat" style={{ textAlign: "right" }}>
                        <span className="tp-stat-label">{t("scanner.mlConfidence", "ML Confidence")}</span>
                        <strong style={{ fontSize: "1rem", color: "var(--tp-green-600)" }}>{(result.confidence * 100).toFixed(0)}%</strong>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ fontSize: "0.86rem", lineHeight: 1.4, color: "var(--tp-neutral-700)", padding: 12, background: "var(--tp-neutral-50)", borderRadius: 10, border: "2px solid #111827" }}>
                    <Markdown content={result.analysis} />
                  </div>
                </div>
              ) : (
                <div className="tp-stack" style={{ gap: 12 }}>
                  <div className="tp-row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <span className="tp-stat-label">{t("scanner.analysisMode", "Analysis Mode")}</span>
                      <strong style={{ fontSize: "1.1rem", display: "block" }}>{t("scanner.soilVisualTitle", "Soil Quality Visual Inspection")}</strong>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "0.86rem", lineHeight: 1.4, color: "var(--tp-neutral-700)", padding: 12, background: "var(--tp-neutral-50)", borderRadius: 10, border: "2px solid #111827" }}>
                    <Markdown content={result.analysis} />
                  </div>
                </div>
              )}

              {/* Action link */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <Button
                  variant={actionLogged ? "secondary" : "primary"}
                  onClick={handleLogAction}
                  disabled={actionLogged}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {actionLogged ? (
                    <>
                      <ShieldCheck size={16} /> {t("farmHealth.loggedAction", "Logged to Action Center")}
                    </>
                  ) : (
                    t("scanner.addTreatment", "Add treatment plan to Action Center")
                  )}
                </Button>
              </div>
            </div>
          ) : stage === "processing" ? (
            <div className="tp-state"><Sparkles size={32} style={{ color: "var(--tp-green-500)" }} /><div className="tp-state-title">{t("scanner.analyzing", "Analyzing...")}</div><p>{t("scanner.resultsHere", "Results will appear here.")}</p></div>
          ) : (
            <div className="tp-state">
              <ImageIcon size={40} style={{ color: "var(--tp-neutral-300)" }} />
              <div className="tp-state-title">{t("scanner.noAnalysis", "No analysis yet")}</div>
              <p>{t("scanner.uploadPrompt", "Upload an image and click Analyze to trigger actual machine learning classification.")}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recommendations + language */}
      {stage === "result" && (
        <Card style={{ marginTop: 20 }}>
          <div className="tp-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <CardTitle icon={FlaskConical}>{t("scanner.regenRecs", "Regenerative recommendations")}</CardTitle>
            <div className="tp-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Languages size={16} style={{ color: "var(--tp-neutral-500)" }} />
              <label className="tp-label" style={{ margin: 0 }}>{t("labels.language", "Language")}</label>
              <Select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: "auto" }}>
                {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </div>
          </div>
          <div className="tp-grid tp-grid-2" style={{ marginTop: 8 }}>
            {recs.map((r, i) => (
              <div key={i} className="tp-step" style={{ background: "var(--tp-green-50)" }}>
                <CheckCircle2 size={18} style={{ color: "var(--tp-green-600)" }} />
                <span style={{ fontSize: "0.88rem" }}>{r}</span>
              </div>
            ))}
          </div>
          <p className="tp-hint" style={{ marginTop: 12 }}>
            {t("scanner.disclaimer", "AI-generated recommendations for demonstration. Not a substitute for professional wet-lab soil test or in-field certification.")}
          </p>
        </Card>
      )}
    </div>
  );
}

function ProcessingView({ stepIdx }) {
  const { t } = useTranslation();
  return (
    <div className="tp-stack" style={{ gap: 12 }}>
      <div className="tp-row" style={{ gap: 10 }}>
        <Sparkles size={20} style={{ color: "var(--tp-green-600)" }} />
        <strong>{t("scanner.processingImage", "Processing image...")}</strong>
      </div>
      <Progress value={(stepIdx + 1) * 20} />
      <div className="tp-steps">
        {scannerProcessingSteps.map((s, i) => (
          <div key={s} className={`tp-step ${i < stepIdx ? "done" : i === stepIdx ? "active" : ""}`}>
            <span className="tp-step-icon">
              {i < stepIdx ? <CheckCircle2 size={18} /> : i === stepIdx ? <span className="tp-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <span style={{ opacity: 0.4 }}>{i + 1}</span>}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
