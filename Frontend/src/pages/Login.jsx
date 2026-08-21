import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { Card, CardTitle, Field, Input, Button, Tabs } from "../components/ui.jsx";
import { ShieldCheck, Mail, Lock, User, Sparkles } from "lucide-react";
import logo from "../assets/logo.png";

export default function Login() {
  const [tab, setTab] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "radial-gradient(circle at 10% 20%, rgb(240, 253, 244) 0%, rgb(248, 250, 252) 90%)",
      padding: 20
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={logo} alt="TerraPulse AI" style={{ height: 50, objectFit: "contain", marginBottom: 12 }} />
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--tp-neutral-900)" }}>
            Agronomic Intelligence Node
          </h2>
          <p className="tp-hint" style={{ marginTop: 4 }}>
            Secure sign in to your regenerative farm network
          </p>
        </div>

        <Card>
          <div style={{ marginBottom: 20 }}>
            <Tabs
              tabs={[
                { id: "signin", label: "Sign In" },
                { id: "signup", label: "Create Account" }
              ]}
              active={tab}
              onChange={(t) => { setTab(t); setError(""); }}
            />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div className="tp-error-text" style={{
                background: "#fef2f2",
                border: "2px solid #ef4444",
                padding: "10px 14px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: "0.85rem"
              }}>
                {error}
              </div>
            )}

            {tab === "signup" && (
              <Field label="Full Name" required>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tp-neutral-500)" }} />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </Field>
            )}

            <Field label="Email Address" required>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tp-neutral-500)" }} />
                <Input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </Field>

            <Field label="Password" required>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tp-neutral-500)" }} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </Field>

            <Button variant="primary" type="submit" disabled={loading} style={{ width: "100%", height: 44, marginTop: 8 }}>
              {loading ? "Authenticating..." : (
                <span className="tp-row" style={{ justifyContent: "center", gap: 8 }}>
                  <ShieldCheck size={18} />
                  {tab === "signin" ? "Sign In to Farm" : "Register Farm Account"}
                </span>
              )}
            </Button>
          </form>
        </Card>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: "0.78rem", color: "var(--tp-neutral-500)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Sparkles size={12} /> Powered by Firebase Auth & MongoDB Persistent Ledger
        </div>
      </div>
    </div>
  );
}
