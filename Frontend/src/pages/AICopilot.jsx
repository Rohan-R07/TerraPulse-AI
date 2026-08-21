import { useState, useEffect, useRef } from "react";
import {
  Card, CardTitle, Badge, Button, Spinner, Skeleton,
} from "../components/ui.jsx";
import { copilotService, actionService } from "../services/api.js";
import { Markdown } from "../components/Markdown.jsx";
import {
  MessageSquare, Mic, MicOff, Send, Volume2, Plus, Sparkles, User, Bot, HelpCircle
} from "lucide-react";

export default function AICopilot() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content: `OBSERVED:
- Crop: Cotton (Flowering)
- Moisture: 28% (Dry)
- NDVI: 0.54 (Decreasing)

INFERRED:
- The cotton plants are experiencing moderate water stress during the crucial flowering period, which is causing vegetative density to decrease.

RECOMMENDED:
- Run a 12mm irrigation cycle in West Field.
- Consider Alternate Wetting and Drying (AWD) to strengthen root resilience.
- Spray organic shield (Pseudomonas fluorescens) if humidity increases.`
    }
  ]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [ttsPlaying, setTtsPlaying] = useState(null);

  // Grounded context state
  const [context, setContext] = useState({
    farmName: "Green Valley Farm",
    fieldName: "West Field",
    crop: "Cotton",
    cropStage: "Flowering",
    soilType: "Black Clay",
    acres: 12,
    location: "Pune, Maharashtra",
    ndvi: 0.54,
    ndviTrend: "Decreasing",
    moisture: 28,
    temperature: 34,
    rainfall: "Low",
    forecast: "Dry for next 5 days",
    diseases: "None",
    prevRecs: "Improve irrigation frequency",
    recentActions: "None"
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Language mapping
  const [speechLang, setSpeechLang] = useState("en-IN");

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setTranscribing(true);
        try {
          const res = await copilotService.transcribeAudio(audioBlob, speechLang);
          if (res.transcript) {
            setQuery(res.transcript);
          }
        } catch (e) {
          console.error("Transcription error", e);
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setRecording(true);
    } catch (err) {
      alert("Microphone access blocked. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setRecording(false);
    }
  };

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = { role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg];
      const res = await copilotService.sendMessage(chatHistory, context);
      setMessages(prev => [...prev, { role: "model", content: res.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "model", content: "Error communicating with Gemini backend. Please check connection." }]);
    } finally {
      setLoading(false);
    }
  };

  const speakText = async (text) => {
    if (ttsPlaying === text) {
      window.speechSynthesis.cancel();
      setTtsPlaying(null);
      return;
    }
    setTtsPlaying(text);
    try {
      const res = await copilotService.textToSpeech(text, speechLang.split("-")[0]);
      if (res.fallback || !res.audioContent) {
        // client-side speech synthesis
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
        utter.lang = speechLang;
        utter.onend = () => setTtsPlaying(null);
        utter.onerror = () => setTtsPlaying(null);
        window.speechSynthesis.speak(utter);
      } else {
        const audio = new Audio(`data:audio/mp3;base64,${res.audioContent}`);
        audio.onended = () => setTtsPlaying(null);
        audio.play();
      }
    } catch (err) {
      setTtsPlaying(null);
    }
  };

  const logAction = async (recText) => {
    try {
      await actionService.createAction({
        field: context.fieldName,
        recommendation: recText,
        priority: "High",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        source: "AI Copilot advice"
      });
      alert("Added to Action Center!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="tp-page-head">
        <h1>AI Farm Copilot</h1>
        <p>Your multilingual Gemini-powered assistant. Ask questions about irrigation, soil compaction, and disease management.</p>
      </div>

      <div className="tp-grid" style={{ gridTemplateColumns: "1.2fr 1fr", height: "calc(100vh - 200px)", minHeight: 600 }}>
        {/* Chat view */}
        <Card style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
          <div style={{ padding: 16, borderBottom: "2.5px solid #111827", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--tp-neutral-50)" }}>
            <CardTitle icon={MessageSquare}>AI Reasoning Console</CardTitle>
            
            {/* Speech Language Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="tp-hint" style={{ fontWeight: 700 }}>Locale:</span>
              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                className="tp-select"
                style={{ width: "auto", padding: "4px 8px", fontSize: "0.82rem", height: 32, border: "2px solid #111827", borderRadius: 8, background: "#ffffff" }}
              >
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">हिन्दी (Hindi)</option>
                <option value="mr-IN">मराठी (Marathi)</option>
                <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>
          </div>

          {/* Messages block */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div key={idx} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 8 }}>
                  {!isUser && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--tp-green-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bot size={16} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "80%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "2.5px solid #111827",
                    background: isUser ? "var(--tp-green-100)" : "#ffffff",
                    boxShadow: "var(--tp-shadow-xs)"
                  }}>
                    <div style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
                      <Markdown content={m.content} />
                    </div>
                    
                    {!isUser && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10, borderTop: "1px dashed var(--tp-neutral-200)", paddingTop: 8 }}>
                        <button
                          onClick={() => speakText(m.content)}
                          style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "var(--tp-green-600)" }}
                        >
                          <Volume2 size={14} /> {ttsPlaying === m.content ? "Stop Audio" : "Listen (TTS)"}
                        </button>
                        <button
                          onClick={() => logAction(m.content)}
                          style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "var(--tp-neutral-600)", marginLeft: "auto" }}
                        >
                          <Plus size={14} /> Log Action
                        </button>
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--tp-neutral-800)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--tp-green-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={16} />
                </div>
                <div style={{ padding: "12px 16px", borderRadius: 12, border: "2.5px solid #111827", background: "#fff" }}>
                  <Spinner size={16} /> <span style={{ fontSize: "0.85rem", color: "var(--tp-neutral-500)" }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input */}
          <div style={{ padding: 16, borderTop: "2.5px solid #111827", background: "var(--tp-neutral-50)" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={transcribing ? "Transcribing speech..." : "Ask the copilot..."}
                disabled={loading || transcribing}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "2.5px solid #111827",
                  fontSize: "0.9rem",
                  outline: "none"
                }}
              />
              
              {/* Mic buttons */}
              {recording ? (
                <button
                  onClick={stopRecording}
                  style={{
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "2.5px solid #111827",
                    background: "var(--tp-error)",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  <MicOff size={20} />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={loading || transcribing}
                  style={{
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "2.5px solid #111827",
                    background: "#ffffff",
                    color: "#111827",
                    cursor: "pointer"
                  }}
                >
                  <Mic size={20} />
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={loading || transcribing || !query.trim()}
                style={{
                  padding: "0 18px",
                  borderRadius: 10,
                  border: "2.5px solid #111827",
                  background: "var(--tp-green-600)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </Card>

        {/* Live grounding context */}
        <Card style={{ overflowY: "auto" }}>
          <CardTitle icon={Sparkles}>Active Grounding Context</CardTitle>
          <p className="tp-card-sub" style={{ marginBottom: 12 }}>
            This context is automatically injected into Gemini's prompt to keep responses grounded in your farm's live telemetry.
          </p>
          
          <div className="tp-stack" style={{ gap: 10 }}>
            <div className="tp-grid tp-grid-2">
              <div className="tp-field">
                <label className="tp-label">Field</label>
                <input className="tp-select" type="text" value={context.fieldName} onChange={(e) => setContext({...context, fieldName: e.target.value})} />
              </div>
              <div className="tp-field">
                <label className="tp-label">Crop & Stage</label>
                <input className="tp-select" type="text" value={`${context.crop} (${context.cropStage})`} onChange={(e) => {
                  const [cr, st] = e.target.value.split(" (");
                  setContext({...context, crop: cr || "Cotton", cropStage: st ? st.replace(")", "") : "Flowering"});
                }} />
              </div>
            </div>

            <div className="tp-grid tp-grid-2">
              <div className="tp-field">
                <label className="tp-label">Soil Moisture</label>
                <input className="tp-select" type="number" value={context.moisture} onChange={(e) => setContext({...context, moisture: Number(e.target.value)})} />
              </div>
              <div className="tp-field">
                <label className="tp-label">NDVI Vigor</label>
                <input className="tp-select" type="number" step="0.01" value={context.ndvi} onChange={(e) => setContext({...context, ndvi: Number(e.target.value)})} />
              </div>
            </div>

            <div className="tp-grid tp-grid-2">
              <div className="tp-field">
                <label className="tp-label">Temperature (°C)</label>
                <input className="tp-select" type="number" value={context.temperature} onChange={(e) => setContext({...context, temperature: Number(e.target.value)})} />
              </div>
              <div className="tp-field">
                <label className="tp-label">Active Outbreaks</label>
                <input className="tp-select" type="text" value={context.diseases} onChange={(e) => setContext({...context, diseases: e.target.value})} />
              </div>
            </div>

            <div className="tp-field">
              <label className="tp-label">Forecast</label>
              <textarea 
                className="tp-select" 
                rows={2} 
                value={context.forecast} 
                onChange={(e) => setContext({...context, forecast: e.target.value})} 
                style={{ resize: "none", padding: 8, fontSize: "0.85rem" }} 
              />
            </div>
            
            <div style={{ marginTop: 12, padding: 12, background: "var(--tp-neutral-50)", border: "2px solid #111827", borderRadius: 8 }}>
              <strong style={{ fontSize: "0.82rem", color: "var(--tp-neutral-700)", display: "flex", alignItems: "center", gap: 4 }}>
                <HelpCircle size={14} /> Sample Inquiries:
              </strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: "0.8rem", color: "var(--tp-neutral-600)", lineHeight: 1.4 }}>
                <li>"Why is my cotton NDVI dropping? What irrigation steps do I need?"</li>
                <li>"What Bt cotton practices prevent Pink Bollworm in Maharashtra?"</li>
                <li>"How can I break soil compaction in my clay Vertisol soil?"</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
