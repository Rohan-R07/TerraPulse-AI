# TerraPulse AI — Regenerative Agriculture & Carbon Intelligence Platform

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind & CSS Tokens](https://img.shields.io/badge/Styling-CSS%20Design%20System-06B6D4)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Status](https://img.shields.io/badge/Status-Production%20Ready%20%7C%20Full%20Stack-emerald)](#development-status)

TerraPulse AI is an agricultural intelligence and regenerative farming platform designed to empower farmers, agronomists, land managers, and carbon credit evaluators. By combining satellite land diagnostics, AI-driven plant and soil health analysis, and multi-year carbon sequestration forecasting, TerraPulse AI turns complex environmental data into actionable insights for sustainable land stewardship.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Environment Variables](#-environment-variables)
- [Development Status](#-development-status)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Project Overview

### The Problem
Global agricultural land faces severe degradation, loss of Soil Organic Carbon (SOC), unpredictable climate risks, and escalating crop disease outbreaks. At the same time, transitioning to regenerative practices (cover cropping, no-till, crop rotation) is often inhibited by a lack of accessible satellite monitoring tools and complex, unverified carbon credit estimation models.

### The Solution
TerraPulse AI provides an intuitive, high-performance platform that unifies real-time farm health diagnostics and predictive carbon modeling:
- **Satellite Health Tracking:** Monitor vegetation vigor (NDVI) and soil moisture levels across registered fields.
- **AI Diagnostics:** Scan plant leaves and soil samples for instant disease detection, severity ratings, and treatment guidance.
- **Carbon Simulator:** Simulate 3-year crop rotation scenarios to project SOC gains, crop resilience, and estimated voluntary carbon credits over a 5-year timeline.

---

## ✨ Key Features

### 📊 Executive Dashboard
- **Core Agronomic Metrics:** Real-time visibility into average Soil Organic Carbon (SOC %), NDVI index, soil moisture percentage, and estimated annual carbon credits ($tCO_2e/yr$).
- **Interactive Field Selector:** Switch between registered farm parcels (e.g., North Valley Field, East Meadow) to inspect localized telemetry.
- **Trend Charts:** Visual tracking of historical NDVI and moisture trends powered by interactive Recharts line graphs.
- **Disease & Advisory Feed:** Instant alerts on recent field scans and prioritized regenerative recommendations.

### 🛰️ Farm Health & Satellite Monitoring
- **Dual-Layer Map Visualization:** Toggle between Normalized Difference Vegetation Index (NDVI) and Soil Moisture Heatmap visual overlays.
- **Multi-Satellite Source Selector:** Inspect data resolution across Sentinel-2 (10m), PlanetScope (3m), and Landsat-9 (30m) providers.
- **Agronomic Action Plans:** Field-specific recommendations including cover crop selection (e.g., Crimson Clover, Hairy Vetch) and bio-fertilizers (e.g., Mycorrhizal Inoculants).

### 🔬 AI Plant & Soil Scanner
- **Dual-Mode Diagnostics:** Dedicated upload & analysis workflows for **Plant Leaf Health** and **Soil Degradation**.
- **Interactive Scan Workflow:** Step-by-step image upload, simulated neural network analysis, and diagnostic report generation.
- **Comprehensive Diagnostic Reports:**
  - Disease/Condition identification with confidence score.
  - Severity level assessment (e.g., Moderate, Severe).
  - Symptom breakdown and root cause analysis.
  - Localized treatment and prevention protocols.
  - Soil organic matter estimation and nutrient deficiency breakdown.

### 🌱 Regenerative Carbon Simulator
- **Interactive Crop Rotation Builder:** Configure 3-year crop sequences (e.g., Corn $\rightarrow$ Soybeans $\rightarrow$ Crimson Clover) across custom acreage.
- **Soil Baseline Selector:** Choose baseline soil types (e.g., Silt Loam, Clay Loam, Sandy Loam) and enter historical yield baselines.
- **Predictive Engine:**
  - **Soil Organic Carbon (SOC %)** trajectory over 5 years.
  - **Climate Resilience Score** improvements.
  - **Carbon Sequestration Rate** ($tCO_2e/\text{acre}/\text{year}$).
  - **Annual Carbon Credit Forecast** ($tCO_2e$) for voluntary carbon markets.

### 🌐 Global Multilingual Localization System
- **Unified Global Locale**: Immediate, client-side, page-reload-free language switching across the entire dashboard application.
- **Regional Languages**: Fully supports 5 major agricultural languages of India:
  - English (`en-IN`)
  - Hindi (`hi-IN`)
  - Bengali (`bn-IN`)
  - Marathi (`mr-IN`)
  - Kannada (`kn-IN`)
- **Backend LLM Localization**: Passes the selected language context to the backend Gemini AI generation prompts. Translates AI strategic analyses, RAG outputs, scanner descriptions, and copilot responses on-the-fly while strictly keeping JSON schemas in English to maintain visual compatibility.
- **T-Hook Enhancements**: Built-in default string parameter fallbacks on hook queries to guarantee zero unlocalized UI glitches.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               TerraPulse AI Web Client                 │
│      (React + Vite + Recharts + Lucide Icons)          │
└───────────────┬───────────────────────────▲────────────┘
                │                           │
           HTTP Requests              WebSocket/Stream
                │                           │
                ▼                           │
┌───────────────────────────────────────────┴────────────┐
│              FastAPI Application Server                │
│    (Uvicorn + Pydantic Settings + Custom CORS)         │
└───────────────┬────────────────────────────────────────┘
                │
        ┌───────┼───────────────┬──────────────┐
        ▼       ▼               ▼              ▼
┌───────────┐┌─────────────┐┌──────────────┐┌───────────┐
│  Gemini   ││ OpenRouter  ││ Earth Engine ││ Firestore │
│  Service  ││ API Service ││  Satellite   ││ Database  │
│ (Advisory)││  (Scanner)  ││  Telemetry   ││  Storage  │
└───────────┘└─────────────┘└──────────────┘└───────────┘
```

> **Note on Architecture:** The application operates in dual-mode (Toggleable between **DEMO** and **LIVE** mode from the Topbar). 
> - **DEMO Mode:** Front-end queries intercept requests to return high-fidelity local datasets instantly.
> - **LIVE Mode:** Requests route to the production FastAPI backend. The backend uses OpenRouter (Gemma 4 free-tier multimodal model) for image scans and the official Google Gemini SDK for advisory diagnostics, falling back to mock schemas gracefully on API failures.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** [React 18](https://react.dev/) (SPA Architecture)
- **Build Tool:** [Vite 5](https://vitejs.dev/)
- **Routing:** [React Router DOM v7](https://reactrouter.com/)
- **Data Visualization:** [Recharts 3](https://recharts.org/)
- **Iconography:** [Lucide React](https://lucide.dev/)
- **Styling:** Vanilla CSS design tokens with organic green accents, pill selectors, custom interactive badges, and clean layouts.

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **WSGI/ASGI Server:** [Uvicorn](https://www.uvicorn.org/)
- **AI Integrations:** Official `google-generativeai` SDK (Gemini) & [OpenRouter API](https://openrouter.ai/) (`google/gemma-4-26b-a4b-it:free` multimodal model).
- **Environment Management:** `Pydantic-Settings` for secure, type-safe config loading.
- **Database / Cache Adapters:** Firestore & Local fallback engines.
- **Testing:** Complete `pytest` suite covering carbon calculations, telemetry aggregation, and risk analysis.

---

## 📁 Project Structure

```text
TerraPulse-AI/
├── Backend/                    # Python Backend API & ML Engine (In Development)
│   ├── main.py                 # Backend service entrypoint
│   ├── requirements.txt        # Python package dependencies
│   └── venv/                   # Local Python virtual environment
│
├── Frontend/                   # Vite + React Frontend Application
│   ├── public/                 # Static public assets (favicons, icons)
│   ├── src/
│   │   ├── assets/             # Visual assets and SVGs
│   │   ├── components/         # Reusable UI components (Layout, FarmMap, UI primitives)
│   │   ├── data/               # Mock agronomic datasets & simulation parameters
│   │   ├── hooks/              # Custom React state & async execution hooks
│   │   ├── pages/              # Application views
│   │   │   ├── Landing.jsx          # Public product landing page
│   │   │   ├── Dashboard.jsx        # Agronomic telemetry dashboard
│   │   │   ├── FarmHealth.jsx       # Satellite field health monitoring
│   │   │   ├── AIScanner.jsx        # Leaf & Soil AI disease scanner
│   │   │   └── CarbonSimulator.jsx  # Multi-year carbon & yield simulator
│   │   ├── services/           # Decoupled service layer for API data fetching
│   │   │   └── api.js          # Async service interfaces (Dashboard, Farm, Scanner, Simulator)
│   │   ├── styles/             # Modular CSS design system
│   │   │   ├── tokens.css      # HSL color palettes, typography, spacing tokens
│   │   │   ├── app.css         # Main application layout styles
│   │   │   └── landing.css     # Landing page custom animations & styles
│   │   └── main.jsx            # Application entrypoint & React Router provider
│   ├── eslint.config.js        # ESLint code hygiene rules
│   ├── index.html              # HTML DOM container
│   ├── package.json            # Node.js dependencies & scripts
│   └── vite.config.js          # Vite build & plugin settings
│
├── .gitignore                  # Git untracked path rules
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Frontend Setup

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

4. **Build for production:**
   ```bash
   npm run build
   ```
   The optimized production bundle will be generated in `Frontend/dist/`.

5. **Preview the production build locally:**
   ```bash
   npm run preview
   ```

---

### Backend Setup *(In Development)*

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Create and activate a Python virtual environment:**
   - **Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Python packages:**
   ```bash
   pip install -r requirements.txt
   ```

---

## 🔐 Environment Variables

The frontend service layer supports environment configuration. Create a `.env` file in the `Frontend/` directory based on `.env.example`:

```env
# Frontend Environment Configuration (.env.example)

# Base URL for Backend REST API
VITE_API_BASE_URL=http://localhost:8000/api

# Enable mock data fallback when backend service is offline
VITE_ENABLE_MOCK_SERVICES=true
```

> **Security Note:** Never commit `.env` or files containing secret API keys, tokens, or credentials to version control.

---

## 📈 Development Status

| Component | Status | Details |
| :--- | :---: | :--- |
| **UI/UX & Design System** | ✅ **Completed** | Full responsive graphic design system with bold 2.5px black outlines & fresh organic green accents |
| **Landing Page** | ✅ **Completed** | Feature showcase, problem statement, CTA navigation |
| **Executive Dashboard** | ✅ **Completed** | Interactive metric summaries, Recharts graphs, field switcher |
| **Farm Health Satellite View** | ✅ **Completed** | Dual-layer NDVI / Soil Moisture map toggle & satellite provider selector |
| **AI Disease & Soil Scanner** | ✅ **Completed** | Interactive upload & diagnostic workflow powered by OpenRouter free-tier multimodal model (`google/gemma-4-26b-a4b-it:free`) |
| **Carbon Simulator** | ✅ **Completed** | 3-year crop rotation builder with 5-year SOC & carbon credit math engine |
| **Service Layer Abstraction** | ✅ **Completed** | Asynchronous service contracts (`api.js`) fully integrated with the FastAPI backend |
| **Backend REST API** | ✅ **Completed** | High-performance FastAPI server with 11 router endpoints, integrated config loaders, and schema validation |
| **Live Satellite Proxy** | ✅ **Completed** | Earth Engine Service telemetry computation and simulation for all registered farm fields |
| **AI Advisory & Copilot** | ✅ **Completed** | Gemini-powered local and regional agricultural advice & contextual chat system |
| **Global Multilingual System** | ✅ **Completed** | Unified localization supporting English, Hindi, Bengali, Marathi, and Kannada across all pages and AI prompts |

---

## 🔮 Future Enhancements

- **Live Satellite Data Pipeline:** Integration with Copernicus Sentinel-2 API for automated 5-day NDVI updates.
- **IoT Telemetry Ingestion:** Support for MQTT soil moisture & temperature sensor streams.
- **PDF Certification Export:** Exportable carbon sequestration verification reports for voluntary market auditors.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Repository.
2. Create a Feature Branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. Push to the Branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request.

---

## 📄 License

This project is developed for hackathon demonstration and evaluation. Check the repository repository settings for specific license terms.
