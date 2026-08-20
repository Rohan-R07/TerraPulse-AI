import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./services/firebase.js";
import "./styles/app.css";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FarmHealth from "./pages/FarmHealth.jsx";
import AIScanner from "./pages/AIScanner.jsx";
import CarbonSimulator from "./pages/CarbonSimulator.jsx";
import AICopilot from "./pages/AICopilot.jsx";
import ActionCenter from "./pages/ActionCenter.jsx";
import IndiaIntelligence from "./pages/IndiaIntelligence.jsx";
import { AppLayout } from "./components/Layout.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          element={
            <AppLayout>
              <Outlet />
            </AppLayout>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farm-health" element={<FarmHealth />} />
          <Route path="/ai-scanner" element={<AIScanner />} />
          <Route path="/carbon-simulator" element={<CarbonSimulator />} />
          <Route path="/copilot" element={<AICopilot />} />
          <Route path="/actions" element={<ActionCenter />} />
          <Route path="/india-intelligence" element={<IndiaIntelligence />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
