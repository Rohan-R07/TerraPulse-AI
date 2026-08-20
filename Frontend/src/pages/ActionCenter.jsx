import { useState, useEffect } from "react";
import { actionService } from "../services/api.js";
import {
  Card, CardTitle, Badge, Button, Spinner, Skeleton, ErrorState, Field, Input, Select,
} from "../components/ui.jsx";
import {
  CheckSquare, ClipboardList, Plus, Calendar, AlertTriangle, AlertCircle, X, ShieldAlert, Sparkles
} from "lucide-react";

const priorityVariant = (p) => (p === "High" ? "error" : p === "Medium" ? "warning" : "neutral");

export default function ActionCenter() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filter, setFilter] = useState("PENDING"); // PENDING | COMPLETED | ALL
  
  // Custom Action Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAction, setNewAction] = useState({
    field: "West Field",
    recommendation: "",
    priority: "Medium",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Feedback Modal
  const [selectedActionForFeedback, setSelectedActionForFeedback] = useState(null);
  const [outcomeText, setOutcomeText] = useState("");
  const [subsequentObs, setSubsequentObs] = useState("NDVI and Moisture stabilized");

  const fetchActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await actionService.listActions();
      setActions(data);
    } catch (e) {
      setError("Failed to fetch actions from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleCreateAction = async () => {
    if (!newAction.recommendation.trim()) return;
    try {
      const created = await actionService.createAction({
        ...newAction,
        source: "Farmer Manual Entry"
      });
      setActions(prev => [...prev, created]);
      setShowAddModal(false);
      setNewAction({
        field: "West Field",
        recommendation: "",
        priority: "Medium",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissAction = async (id) => {
    try {
      await actionService.updateAction(id, "DISMISSED");
      setActions(prev => prev.map(a => a.id === id ? { ...a, status: "DISMISSED" } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenFeedback = (action) => {
    setSelectedActionForFeedback(action);
    setOutcomeText("");
    setSubsequentObs("NDVI and Moisture stabilized");
  };

  const handleLogFeedback = async () => {
    if (!outcomeText.trim() || !selectedActionForFeedback) return;
    try {
      await actionService.logFeedback({
        actionId: selectedActionForFeedback.id,
        action: selectedActionForFeedback.recommendation,
        field: selectedActionForFeedback.field,
        previousRisk: selectedActionForFeedback.priority,
        outcome: outcomeText,
        subsequentObservations: subsequentObs
      });
      
      // Update local state
      setActions(prev => prev.map(a => a.id === selectedActionForFeedback.id ? { ...a, status: "COMPLETED" } : a));
      setSelectedActionForFeedback(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredActions = actions.filter(a => {
    if (filter === "ALL") return a.status !== "DISMISSED";
    return a.status === filter;
  });

  return (
    <div>
      <div className="tp-page-head">
        <h1>Farm Action Center</h1>
        <p>Log, coordinate, and review agricultural decision actions. Maintain a verifiable ledger of management interventions.</p>
      </div>

      {error && (
        <Card style={{ marginBottom: 20 }}>
          <ErrorState message={error} onRetry={fetchActions} />
        </Card>
      )}

      {/* Tabs & Add Actions Bar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", border: "2.5px solid #111827", borderRadius: 8, overflow: "hidden" }}>
            {["PENDING", "COMPLETED", "ALL"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: "6px 14px",
                  border: "none",
                  background: filter === tab ? "#111827" : "#ffffff",
                  color: filter === tab ? "#ffffff" : "#111827",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "all 0.1s"
                }}
              >
                {tab === "PENDING" ? "PENDING ACTIONS" : tab === "COMPLETED" ? "COMPLETED LEDGER" : "ALL ACTIVE"}
              </button>
            ))}
          </div>

          <Button variant="primary" onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Custom Action
          </Button>
        </div>
      </Card>

      {/* Actions List */}
      {loading ? (
        <div className="tp-stack" style={{ gap: 12 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} h={90} />)}
        </div>
      ) : filteredActions.length === 0 ? (
        <Card>
          <div className="tp-state" style={{ padding: 40 }}>
            <ClipboardList size={48} style={{ color: "var(--tp-neutral-300)" }} />
            <div className="tp-state-title">No actions found</div>
            <p>Select another filter or add a custom agronomic action to get started.</p>
          </div>
        </Card>
      ) : (
        <div className="tp-stack" style={{ gap: 16 }}>
          {filteredActions.map((act) => {
            const isCompleted = act.status === "COMPLETED";
            return (
              <Card 
                key={act.id} 
                style={{ 
                  borderLeft: isCompleted ? "8px solid var(--tp-green-600)" : act.priority === "High" ? "8px solid var(--tp-error)" : "8px solid var(--tp-warning)",
                  background: isCompleted ? "var(--tp-neutral-50)" : "#ffffff"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                  <div className="tp-grow">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <strong style={{ fontSize: "0.95rem" }}>{act.field}</strong>
                      <Badge variant="neutral">{act.source || "System"}</Badge>
                      <Badge variant={priorityVariant(act.priority)}>{act.priority} Priority</Badge>
                      {isCompleted && <Badge variant="success">Completed</Badge>}
                    </div>

                    <p style={{ fontSize: "0.9rem", color: "var(--tp-neutral-800)", marginBottom: 8, fontWeight: 550 }}>
                      {act.recommendation}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--tp-neutral-500)" }}>
                      <Calendar size={14} /> Due Date: {act.dueDate}
                    </div>
                  </div>

                  {!isCompleted && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="secondary" size="sm" onClick={() => handleDismissAction(act.id)}>
                        Dismiss
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleOpenFeedback(act)}>
                        Mark Complete
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Custom Add Action Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20
        }}>
          <Card style={{ width: "100%", maxWidth: 500, border: "3px solid #111827", boxShadow: "var(--tp-shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <CardTitle icon={Plus}>Add Custom Action</CardTitle>
              <button onClick={() => setShowAddModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div className="tp-stack" style={{ gap: 16 }}>
              <Field label="Field Selector">
                <Select value={newAction.field} onChange={(e) => setNewAction({...newAction, field: e.target.value})}>
                  <option value="West Field">West Field (Cotton)</option>
                  <option value="North Field">North Field (Wheat)</option>
                  <option value="East Field">East Field (Sugarcane)</option>
                  <option value="South Field">South Field (Fallow)</option>
                </Select>
              </Field>

              <Field label="Recommendation / Action Description" required>
                <textarea
                  className="tp-select"
                  rows={3}
                  value={newAction.recommendation}
                  onChange={(e) => setNewAction({...newAction, recommendation: e.target.value})}
                  placeholder="e.g. Apply 15 kg organic nitrogen compost before sowing season..."
                  style={{ resize: "none", padding: 8, fontSize: "0.86rem" }}
                />
              </Field>

              <div className="tp-grid tp-grid-2">
                <Field label="Priority">
                  <Select value={newAction.priority} onChange={(e) => setNewAction({...newAction, priority: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </Select>
                </Field>

                <Field label="Due Date">
                  <Input type="date" value={newAction.dueDate} onChange={(e) => setNewAction({...newAction, dueDate: e.target.value})} />
                </Field>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateAction} disabled={!newAction.recommendation.trim()}>Save Action</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Decision Feedback Loop Modal */}
      {selectedActionForFeedback && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20
        }}>
          <Card style={{ width: "100%", maxWidth: 500, border: "3px solid #111827", boxShadow: "var(--tp-shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <CardTitle icon={Sparkles}>Decision Feedback Loop</CardTitle>
              <button onClick={() => setSelectedActionForFeedback(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: "0.84rem", color: "var(--tp-neutral-600)", marginBottom: 12 }}>
              To complete this action, please record the physical outcomes. This provides auditability and helps Gemini improve future recommendations.
            </p>

            <div className="tp-stack" style={{ gap: 16 }}>
              <div style={{ padding: 10, background: "var(--tp-neutral-50)", border: "2px solid #111827", borderRadius: 8, fontSize: "0.84rem" }}>
                <strong>Action Description:</strong> {selectedActionForFeedback.recommendation}
              </div>

              <Field label="Observed Outcome / Action Report" required>
                <textarea
                  className="tp-select"
                  rows={3}
                  value={outcomeText}
                  onChange={(e) => setOutcomeText(e.target.value)}
                  placeholder="e.g. Applied 12mm watering. Soil moisture rose to 42%, crop leaf turgor restored."
                  style={{ resize: "none", padding: 8, fontSize: "0.86rem" }}
                />
              </Field>

              <Field label="Subsequent Visual Observations">
                <input
                  className="tp-select"
                  type="text"
                  value={subsequentObs}
                  onChange={(e) => setSubsequentObs(e.target.value)}
                  placeholder="e.g. NDVI and Moisture stabilized"
                  style={{ padding: 8, fontSize: "0.86rem" }}
                />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <Button variant="secondary" onClick={() => setSelectedActionForFeedback(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleLogFeedback} disabled={!outcomeText.trim()}>Log Outcome & Close</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
