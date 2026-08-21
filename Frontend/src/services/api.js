import * as mock from "../data/mockData.js";
import { auth } from "./firebase.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Helper: safe fetch with fallback to mock data
async function safeFetch(endpoint, options = {}, fallbackData = null) {
  const isDemoMode = (localStorage.getItem("tp-app-mode") || "demo") === "demo";
  if (isDemoMode && fallbackData !== null) {
    if (typeof fallbackData === "function") {
      return fallbackData();
    }
    return fallbackData;
  }

  const headers = { ...options.headers };
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch (e) {
      console.warn("Failed to fetch Firebase ID token:", e);
    }
  }

  try {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok || contentType.includes("text/html")) {
      const errBody = await res.text();
      let msg = `API error ${res.status}`;
      try {
        const parsed = JSON.parse(errBody);
        msg = parsed.detail || parsed.error?.message || msg;
      } catch (_) {}
      throw new Error(msg);
    }

    const textData = await res.text();
    if (textData.trim().startsWith("<")) {
      throw new Error("Backend returned HTML page instead of JSON.");
    }
    return JSON.parse(textData);
  } catch (err) {
    console.warn(`Backend API failed for ${endpoint}: ${err.message}. Using fallback data.`);
    if (fallbackData !== null) {
      return typeof fallbackData === "function" ? fallbackData() : fallbackData;
    }
    throw err;
  }
}


export const dashboardService = {
  async getOverview() {
    return safeFetch("/dashboard/overview", {}, {
      healthScore: mock.farm.healthScore,
      status: mock.farm.status,
      healthTrend: mock.farm.healthTrend,
      dataSource: "DEMO — Sample Dataset"
    });
  },
  async getFields() {
    return safeFetch("/dashboard/fields", {}, mock.fields);
  },
  async getNdviHistory() {
    return safeFetch("/dashboard/ndvi-history", {}, mock.ndviHistory);
  },
  async getMoistureHistory() {
    return safeFetch("/dashboard/moisture-history", {}, mock.moistureHistory);
  },
  async getRecentScans() {
    return safeFetch("/dashboard/recent-scans", {}, mock.recentScans);
  },
  async getRecommendations() {
    return safeFetch("/dashboard/recommendations", {}, mock.recommendations);
  },
  async getCarbonMetrics() {
    return safeFetch("/dashboard/carbon-metrics", {}, mock.carbonMetrics);
  },
};

export const farmService = {
  async getFields() {
    return safeFetch("/fields", {}, mock.fields);
  },
  async getField(id) {
    return safeFetch(`/fields/${id}`, {}, () => mock.fields.find((f) => f.id === id));
  },
  async getSatelliteSources() {
    return mock.satelliteSources;
  },
  async getCoverCrops() {
    return mock.coverCrops;
  },
  async getBioFertilizers() {
    return mock.bioFertilizers;
  },
};

export const scannerService = {
  async analyzePlant(file) {
    const formData = new FormData();
    formData.append("image", file);
    return safeFetch("/scanner/plant", {
      method: "POST",
      body: formData
    }, {
      crop: "Cotton",
      disease: mock.plantScanResult.detectedCondition,
      confidence: mock.plantScanResult.confidence / 100,
      analysis: `AI-ASSISTED DIAGNOSIS: This assessment is based on machine learning vision analysis. Please verify on-field.
      
Visible Symptoms: yellowing of leaves, brown spots, leaf curling.
Immediate Actions: Apply neem oil spray, isolate infected plants, improve air circulation.
Prevention: Crop rotation, disease-resistant seed choice.
Inspection: Highly recommended.`,
      dataSource: "DEMO — Sample Dataset"
    });
  },
  async analyzeSoil(file) {
    const formData = new FormData();
    formData.append("image", file);
    return safeFetch("/scanner/soil", {
      method: "POST",
      body: formData
    }, {
      analysis: `VISUAL OBSERVATION: Soil appears dry, crumbly, and low in organic matter. Light brown color indicates sandy loam characteristics with signs of wind erosion.
      
LABORATORY WARNING: Visual inspection cannot replace chemical laboratory soil analysis. This tool does NOT measure exact nitrogen, phosphorus, potassium, or pH percentages. Please run a wet-lab test for exact metrics.
      
INFERRED DEGRADATION RISK: Medium
      
REGENERATIVE RECOMMENDATIONS: Plant Daikon Radish cover crop to break soil compaction. Add organic compost and apply no-till conservation practices.`,
      dataSource: "DEMO — Sample Dataset"
    });
  },
  getRecommendations(lang = "en") {
    return mock.translatedRecommendations[lang] || mock.translatedRecommendations.en;
  },
};

export const simulatorService = {
  async runSimulation(input) {
    return safeFetch("/simulator/carbon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soilType: input.soilType,
        acreage: input.acreage,
        historicalYield: input.historicalYield,
        rotationA: input.rotation || ["corn", "soybeans", "fallow"],
        rotationB: ["cover-crop", "soybeans", "wheat"],
        rotationC: ["cover-crop", "sunnhemp", "wheat"]
      })
    }, () => computeSimulation(input));
  },
};

export const copilotService = {
  async sendMessage(messages, context) {
    return safeFetch("/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, context })
    }, {
      response: `OBSERVED:
- Crop: ${context.crop || "Cotton"} (${context.cropStage || "Flowering"})
- Soil moisture: ${context.moisture || 28}% (Low)
- NDVI: ${context.ndvi || 0.54} (Decreasing)

INFERRED:
- The crop is undergoing moderate water stress, leading to a drop in NDVI vigor.

RECOMMENDED:
- Initiate irrigation in the West Field within 24 hours.
- Consider alternate wetting and drying methods to conserve water.`
    });
  },
  async transcribeAudio(audioBlob, languageCode) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("language", languageCode);
    return safeFetch("/speech-to-text", {
      method: "POST",
      body: formData
    }, {
      transcript: languageCode === "hi-IN" ? "NDVI का स्तर क्यों गिर गया है?" : "Why did NDVI fall?"
    });
  },
  async textToSpeech(text, languageCode) {
    const formData = new FormData();
    formData.append("text", text);
    formData.append("language", languageCode);
    return safeFetch("/text-to-speech", {
      method: "POST",
      body: formData
    }, {
      audioContent: "",
      fallback: true
    });
  }
};

export const actionService = {
  async listActions() {
    return safeFetch("/actions", {}, [
      { id: "1", field: "West Field", recommendation: "Irrigate crop immediately to alleviate water stress", priority: "High", dueDate: "2026-08-21", source: "AI Advisory", status: "PENDING" },
      { id: "2", field: "North Field", recommendation: "Inspect for Leaf Curl disease symptoms", priority: "Medium", dueDate: "2026-08-23", source: "AI Scanner", status: "PENDING" }
    ]);
  },
  async createAction(action) {
    return safeFetch("/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action)
    }, { ...action, id: Math.random().toString(), status: "PENDING" });
  },
  async updateAction(actionId, status) {
    return safeFetch(`/actions/${actionId}?status=${status}`, {
      method: "PATCH"
    }, { id: actionId, status });
  },
  async logFeedback(feedback) {
    return safeFetch("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback)
    }, feedback);
  }
};

export const satelliteService = {
  async getSatelliteData(fieldId, isLive) {
    return safeFetch(`/satellite/${fieldId}?mode=${isLive ? "live" : "demo"}`, {}, () => {
      const ndviMap = { north: 0.72, south: 0.54, east: 0.63, west: 0.41 };
      const prevNdviMap = { north: 0.70, south: 0.60, east: 0.67, west: 0.58 };
      const statusMap = {
        north: "Healthy",
        south: "Moderate stress",
        east: "Healthy",
        west: "Vegetation stress detected"
      };
      const ndvi = ndviMap[fieldId] || 0.60;
      return {
        fieldId,
        dataSource: isLive ? "LIVE — Google Earth Engine (Sentinel-2)" : "DEMO — Sentinel-2 Sample Dataset",
        isLive,
        ndvi,
        prevNdvi: prevNdviMap[fieldId] || 0.65,
        acquisitionDate: isLive ? "2026-08-18" : "2026-08-10",
        cloudCover: 1.2,
        resolution: "10m",
        status: statusMap[fieldId] || "Healthy"
      };
    });
  },
  async ndviChangeDetection(data) {
    return safeFetch("/ndvi-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }, () => {
      const current = data.current_ndvi || 0.6;
      const prev = data.prev_ndvi || 0.7;
      const changePct = prev > 0 ? +(((current - prev) / prev) * 100).toFixed(1) : 0;
      const stressLevel = changePct < -15 ? "High" : changePct < -5 ? "Medium" : "Low";
      return {
        changePct,
        stressLevel,
        explanation: `OBSERVED SATELLITE FACTS:
- Current NDVI index is ${current} compared to the previous baseline of ${prev} (${changePct}% change).
- Ground soil moisture is observed at ${data.moisture || 35}%.
- Current temperature is ${data.temperature || 34}°C.

AI-INFERRED CAUSES:
- ${changePct < 0 ? "The vegetation index shows a noticeable decrease, suggesting crop stress from low moisture levels or thermal acceleration." : "Vigor levels are stable or improving, indicating healthy crop development and adequate maintenance."}`
      };
    });
  },
  async calculateRisk(data) {
    return safeFetch("/risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }, () => {
      const ndvi = data.ndvi || 0.6;
      const change = data.ndvi_change || 0;
      const moisture = data.moisture || 35;
      const temp = data.temperature || 34;
      const diseases = data.diseases || "None";
      
      let score = 15.0;
      if (change < 0) score += Math.abs(change) * 1.5;
      if (moisture < 35) score += (35 - moisture) * 1.8;
      if (temp > 38) score += (temp - 38) * 2.0;
      if (diseases.toLowerCase() !== "none" && diseases !== "") score += 25.0;
      score = Math.min(100.0, Math.max(0.0, score));
      score = +score.toFixed(1);
      
      const status = score <= 30 ? "LOW" : score <= 60 ? "MEDIUM" : score <= 80 ? "HIGH" : "CRITICAL";
      return {
        riskScore: score,
        riskStatus: status,
        explanation: `The agricultural risk is rated ${status} (${score}/100) primarily driven by:
- Vigor variation (NDVI change: ${change}%).
- Soil moisture levels (${moisture}%).
- Local field factors: ${diseases.toLowerCase() !== "none" ? diseases : "No active diseases detected"}.`,
        urgency: status === "HIGH" || status === "CRITICAL" ? "Immediate (24 hours)" : "Watchful (72 hours)"
      };
    });
  },
  async getAdvisory(data) {
    return safeFetch("/advisory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }, () => {
      const field = data.field_id || "Field";
      const crop = data.crop || "Crop";
      const ndvi = data.ndvi || 0.6;
      const moisture = data.moisture || 35;
      const riskStatus = ndvi < 0.45 || moisture < 25 ? "HIGH" : ndvi < 0.6 ? "MEDIUM" : "LOW";
      
      return {
        advisory: `FIELD HEALTH STATUS: ${riskStatus === "HIGH" ? "Critical stress" : riskStatus === "MEDIUM" ? "Moderate stress" : "Good stability"}.
      
PRIMARY RISK: ${riskStatus === "HIGH" ? "Water-Stress & crop dehydration" : "Standard monitoring requirements"}.

IMMEDIATE ACTIONS:
1. Apply irrigation immediately (${field}).
2. Monitor soil moisture tensiometer trends.
3. Apply neem-based organic shielding if pests are detected.

WATER MANAGEMENT: Implement Alternate Wetting and Drying (AWD) water conservation.
REGENERATIVE ADVISORY: Introduce sunn-hemp cover cropping to hold clay moisture.`,
        riskScore: riskStatus === "HIGH" ? 75.0 : riskStatus === "MEDIUM" ? 52.0 : 25.0,
        riskStatus,
        dataSource: "DEMO — Google Gemini Agro-Advisory"
      };
    });
  }
};

export const indiaService = {
  async getIndiaIntelligence(state, district, crop, season) {
    return safeFetch(`/india-intelligence?state=${state}&district=${district}&crop=${crop}&season=${season}`, {}, {
      stats: { monitoredFarms: 1200, cropStress: 22, diseaseTrend: "Upward (Blast)", waterStress: 35, regenAdoption: 28, risk: "High" },
      dataSource: "DEMO — National Aggregation Engine"
    });
  },
  async getCooperativeInsights(state, crop) {
    return safeFetch(`/cooperative-insights?state=${state}&crop=${crop}`, {}, {
      insights: [
        { title: "Rice Blast Alert (Telangana)", detail: "High humidity is accelerating Rice Blast spreading. 18% of farms affected. Recommended spray: Pseudomonas fluorescens.", severity: "High" },
        { title: "Water Stress Warning (Punjab)", detail: "Tubewell irrigation over-extraction. AWD adoption saves 22% water. Joint community actions recommended.", severity: "Critical" }
      ],
      dataSource: "DEMO — Cooperative Intelligence Pool"
    });
  }
};

export const ragService = {
  async queryRag(query, crop = null) {
    return safeFetch("/knowledge-rag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, crop })
    }, {
      answer: `According to ICAR Wheat Cultivation Guidelines:
- The optimal wheat sowing window for the Indo-Gangetic Plains is November 1 to 25.
- The Crown Root Initiation (CRI) stage at 21 days is the most critical irrigation window.
- Zero-tillage conservation improves SOC by 0.15% over 3 years.
      
Source: ICAR Wheat Guidelines (Region: Indo-Gangetic Plains)`,
      dataSource: "DEMO — RAG Local Retrieval"
    });
  }
};

// Original Carbon Simulator formula for default frontend fallback
function computeSimulation(input) {
  const soil = mock.soilTypes.find((s) => s.id === input.soilType) || mock.soilTypes[1];
  const acreage = Math.max(1, Number(input.acreage) || 0);
  const histYield = Math.max(0, Number(input.historicalYield) || 0);

  const crops = input.rotation.map((id) => mock.cropOptions.find((c) => c.id === id)).filter(Boolean);
  const avgCarbon = crops.length
    ? crops.reduce((sum, c) => sum + c.carbonFactor, 0) / crops.length
    : 1;
  const avgResilience = crops.length
    ? crops.reduce((sum, c) => sum + c.resilienceFactor, 0) / crops.length
    : 1;

  const legumeBonus = crops.filter((c) => c.type === "legume" || c.type === "cover").length * 0.08;

  const socCurrent = soil.socBase;
  const socProjected = +(soil.socBase * (1 + 0.18 * avgCarbon + legumeBonus)).toFixed(2);

  const resilienceBaseline = 60;
  const resilienceProjected = Math.min(95, Math.round(resilienceBaseline + 25 * (avgResilience - 0.9) + legumeBonus * 20));

  const seqRate = +(0.4 * avgCarbon + legumeBonus).toFixed(2);
  const totalSeq = +(seqRate * acreage).toFixed(1);
  const annualCredits = +(totalSeq * 0.9).toFixed(1);

  const years = ["2026", "2027", "2028", "2029", "2030"];
  const socSeries = years.map((y, i) => ({
    year: y,
    soc: +(socCurrent + (socProjected - socCurrent) * (i / (years.length - 1))).toFixed(2),
  }));
  const resilienceSeries = years.map((y, i) => ({
    year: y,
    resilience: Math.round(resilienceBaseline + (resilienceProjected - resilienceBaseline) * (i / (years.length - 1))),
  }));
  const seqSeries = years.map((y, i) => ({
    year: y,
    sequestration: +(seqRate * (0.6 + 0.1 * i)).toFixed(2),
  }));
  const creditSeries = years.map((y, i) => ({
    year: y,
    credits: +(annualCredits * (0.5 + 0.12 * i)).toFixed(1),
  }));

  const yieldBaseline = histYield || 1.8;
  const yieldProjected = +(yieldBaseline * (1 + 0.12 * avgResilience + legumeBonus)).toFixed(2);

  return {
    scenarioA: {
      socCurrent,
      socProjected,
      sequestrationRate: seqRate,
      totalSequestration: totalSeq,
      annualCredits,
      waterDemand: 65,
      resilience: resilienceBaseline,
      yieldDirection: "Stable"
    },
    scenarioB: {
      socCurrent,
      socProjected: +(socProjected * 1.1).toFixed(2),
      sequestrationRate: +(seqRate * 1.2).toFixed(2),
      totalSequestration: +(totalSeq * 1.2).toFixed(1),
      annualCredits: +(annualCredits * 1.2).toFixed(1),
      waterDemand: 45,
      resilience: resilienceProjected,
      yieldDirection: "Increase (+8%)"
    },
    scenarioC: {
      socCurrent,
      socProjected: +(socProjected * 0.95).toFixed(2),
      sequestrationRate: +(seqRate * 0.9).toFixed(2),
      totalSequestration: +(totalSeq * 0.9).toFixed(1),
      annualCredits: +(annualCredits * 0.9).toFixed(1),
      waterDemand: 30,
      resilience: Math.round(resilienceBaseline + 15),
      yieldDirection: "Stable"
    },
    strategyAnalysis: `RECOMMENDED STRATEGY: Scenario B (Regenerative Agriculture)
    
WHY: Scenario B yields the highest long-term soil organic carbon improvements and generates substantial voluntary carbon credits ($${annualCredits * 1.2} tCO2e/yr) while offering excellent climate resilience.
    
TRADE-OFFS: Regenerative cover cropping seed cost of Sunn Hemp vs high chemical nitrogen cost savings.
    
TIMELINE: Year 1: Cover crops in fallow. Year 2: Reduce tillage. Year 3: Localized organic composting.`,
    dataSource: "DEMO — Scenario Engine fallback"
  };
}

export const userService = {
  async getProfile() {
    return safeFetch("/users/me", {}, {
      uid: "mock-uid",
      email: "farmer@terrapulse.org",
      displayName: "Demo Farmer",
      farmName: "Green Valley Farm",
      location: "Pune, Maharashtra",
      acreage: 30
    });
  },
  async updateProfile(data) {
    return safeFetch("/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }, data);
  }
};

