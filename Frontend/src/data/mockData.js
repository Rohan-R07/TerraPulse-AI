// Centralized mock data for TerraPulse AI.
// Realistic agricultural demo values. Backend will replace these via services.

export const farm = {
  name: "Green Valley Farm",
  location: "Pune District, Maharashtra, India",
  totalAcres: 124,
  healthScore: 78,
  healthTrend: +3.2,
  status: "Good",
  riskLevel: "Low",
};

export const fields = [
  {
    id: "north",
    name: "North Field",
    crop: "Wheat",
    acres: 32,
    health: 82,
    ndvi: 0.72,
    moisture: 41,
    risk: "Low",
    vegetation: "Healthy",
    stress: "Low",
    soilType: "Loamy",
    recommendations: [
      "Maintain current irrigation schedule",
      "Monitor for rust fungus in next 2 weeks",
      "Apply foliar spray at flowering stage",
    ],
    // polygon in local SVG coordinate space (0-100 x, 0-100 y)
    polygon: [[8, 12], [44, 8], [48, 38], [12, 42]],
  },
  {
    id: "south",
    name: "South Field",
    crop: "Soybean",
    acres: 28,
    health: 64,
    ndvi: 0.54,
    moisture: 28,
    risk: "Medium",
    vegetation: "Moderate stress",
    stress: "Medium",
    soilType: "Clay",
    recommendations: [
      "Increase irrigation frequency",
      "Inspect for potassium deficiency",
      "Introduce cover crop after harvest",
    ],
    polygon: [[8, 50], [46, 48], [50, 86], [10, 88]],
  },
  {
    id: "east",
    name: "East Field",
    crop: "Cotton",
    acres: 36,
    health: 71,
    ndvi: 0.63,
    moisture: 35,
    risk: "Low",
    vegetation: "Healthy",
    stress: "Low",
    soilType: "Sandy Loam",
    recommendations: [
      "Apply bio-fertilizer in 10 days",
      "Maintain pest monitoring traps",
      "Plan crop rotation with legumes next season",
    ],
    polygon: [[56, 10], [92, 14], [88, 44], [58, 40]],
  },
  {
    id: "west",
    name: "West Field",
    crop: "Maize",
    acres: 28,
    health: 55,
    ndvi: 0.41,
    moisture: 22,
    risk: "High",
    vegetation: "High stress",
    stress: "High",
    soilType: "Sandy",
    recommendations: [
      "Immediate irrigation required",
      "Test soil for organic matter",
      "Apply compost amendment",
      "Consider drought-tolerant cover crop",
    ],
    polygon: [[58, 50], [94, 52], [90, 88], [56, 86]],
  },
];

export const ndviHistory = [
  { month: "Jan", ndvi: 0.38 },
  { month: "Feb", ndvi: 0.42 },
  { month: "Mar", ndvi: 0.51 },
  { month: "Apr", ndvi: 0.58 },
  { month: "May", ndvi: 0.64 },
  { month: "Jun", ndvi: 0.69 },
  { month: "Jul", ndvi: 0.72 },
  { month: "Aug", ndvi: 0.68 },
];

export const moistureHistory = [
  { month: "Jan", moisture: 38 },
  { month: "Feb", moisture: 34 },
  { month: "Mar", moisture: 30 },
  { month: "Apr", moisture: 33 },
  { month: "May", moisture: 36 },
  { month: "Jun", moisture: 41 },
  { month: "Jul", moisture: 39 },
  { month: "Aug", moisture: 32 },
];

export const recentScans = [
  { id: "s1", date: "2026-08-18", type: "Plant", field: "North Field", result: "Leaf Rust (early)", severity: "Low", status: "Reviewed" },
  { id: "s2", date: "2026-08-16", type: "Soil", field: "West Field", result: "Low organic matter", severity: "High", status: "Action needed" },
  { id: "s3", date: "2026-08-14", type: "Plant", field: "East Field", result: "Healthy", severity: "None", status: "Clear" },
  { id: "s4", date: "2026-08-11", type: "Soil", field: "South Field", result: "Compaction detected", severity: "Medium", status: "Reviewed" },
  { id: "s5", date: "2026-08-09", type: "Plant", field: "South Field", result: "Potassium deficiency", severity: "Medium", status: "Action needed" },
];

export const recommendations = [
  { id: "r1", title: "Adjust irrigation — West Field", detail: "Soil moisture at 22% is below threshold. Increase watering by 15% this week.", priority: "High", icon: "droplet" },
  { id: "r2", title: "Inspect North Field for rust", detail: "Early leaf rust detected in recent scan. Schedule field inspection within 48 hours.", priority: "Medium", icon: "search" },
  { id: "r3", title: "Apply bio-fertilizer — East Field", detail: "Cotton at vegetative stage benefits from nitrogen-fixing bio-fertilizer application.", priority: "Medium", icon: "flask" },
  { id: "r4", title: "Introduce cover crop — South Field", detail: "Post-harvest legume cover crop will improve nitrogen and reduce erosion.", priority: "Low", icon: "sprout" },
  { id: "r5", title: "Monitor disease risk — West Field", detail: "Stress conditions elevate disease susceptibility. Increase monitoring frequency.", priority: "Medium", icon: "alert" },
];

export const carbonMetrics = {
  socCurrent: 0.82,
  socProjected: 1.18,
  sequestrationRate: 1.4,
  estimatedCredits: 38,
  period: "annual",
  trend: [
    { year: "2024", soc: 0.74 },
    { year: "2025", soc: 0.82 },
    { year: "2026", soc: 0.91 },
    { year: "2027", soc: 1.02 },
    { year: "2028", soc: 1.18 },
  ],
};

export const satelliteSources = [
  { id: "sentinel2", name: "Sentinel-2", resolution: "10m", revisit: "5 days", bands: "13 spectral" },
  { id: "landsat9", name: "Landsat 9", resolution: "30m", revisit: "16 days", bands: "11 spectral" },
];

export const satelliteLayers = [
  { id: "ndvi", name: "NDVI" },
  { id: "moisture", name: "Soil Moisture" },
  { id: "true", name: "True Color" },
  { id: "false", name: "False Color (Vegetation)" },
];

export const satelliteDates = [
  "2026-08-20", "2026-08-15", "2026-08-10", "2026-08-05", "2026-07-30",
];

export const coverCrops = [
  { crop: "Cowpea", purpose: "Nitrogen fixation", benefit: "Adds 40-80 kg N/ha", suitability: 92, timing: "Jun-Aug" },
  { crop: "Sunhemp", purpose: "Biomass + nitrogen", benefit: "Improves soil structure", suitability: 88, timing: "Jun-Sep" },
  { crop: "Sorghum-Sudan", purpose: "Organic matter", benefit: "Deep rooting breaks compaction", suitability: 76, timing: "May-Jul" },
  { crop: "Clover", purpose: "Nitrogen fixation", benefit: "Ground cover, erosion control", suitability: 71, timing: "Oct-Feb" },
  { crop: "Mustard", purpose: "Biofumigation", benefit: "Suppresses soil pathogens", suitability: 64, timing: "Oct-Nov" },
];

export const bioFertilizers = [
  { field: "North Field", product: "Rhizobium", timing: "At sowing", reason: "Legume nodulation support", status: "Scheduled" },
  { field: "East Field", product: "Azotobacter", timing: "Aug 25", reason: "Nitrogen fixation for cotton", status: "Pending" },
  { field: "South Field", product: "Mycorrhizae", timing: "Sep 02", reason: "Phosphorus uptake", status: "Pending" },
  { field: "West Field", product: "Compost Tea", timing: "Aug 22", reason: "Restore microbial activity", status: "Urgent" },
];

export const cropOptions = [
  { id: "wheat", name: "Wheat", type: "cereal", carbonFactor: 0.9, resilienceFactor: 0.85 },
  { id: "soybean", name: "Soybean", type: "legume", carbonFactor: 1.3, resilienceFactor: 1.05 },
  { id: "cotton", name: "Cotton", type: "cash", carbonFactor: 0.7, resilienceFactor: 0.75 },
  { id: "maize", name: "Maize", type: "cereal", carbonFactor: 1.1, resilienceFactor: 0.9 },
  { id: "chickpea", name: "Chickpea", type: "legume", carbonFactor: 1.25, resilienceFactor: 1.0 },
  { id: "groundnut", name: "Groundnut", type: "legume", carbonFactor: 1.2, resilienceFactor: 0.95 },
  { id: "sorghum", name: "Sorghum", type: "cereal", carbonFactor: 1.0, resilienceFactor: 1.1 },
  { id: "mustard", name: "Mustard", type: "oilseed", carbonFactor: 0.85, resilienceFactor: 0.88 },
  { id: "cowpea", name: "Cowpea (cover)", type: "cover", carbonFactor: 1.4, resilienceFactor: 1.15 },
  { id: "sunhemp", name: "Sunhemp (cover)", type: "cover", carbonFactor: 1.45, resilienceFactor: 1.2 },
];

export const soilTypes = [
  { id: "sandy", name: "Sandy", socBase: 0.6, drainFactor: 1.3 },
  { id: "loamy", name: "Loamy", socBase: 0.9, drainFactor: 1.0 },
  { id: "clay", name: "Clay", socBase: 1.1, drainFactor: 0.7 },
  { id: "sandy-loam", name: "Sandy Loam", socBase: 0.75, drainFactor: 1.15 },
];

// AI scanner mock results
export const plantScanResult = {
  detectedCondition: "Early Blight (Alternaria solani)",
  confidence: 87,
  severity: "Medium",
  possibleDisease: "Alternaria leaf blight",
  symptoms: [
    "Dark brown concentric ring lesions on lower leaves",
    "Yellowing halo around affected tissue",
    "Leaf chlorosis beginning at margins",
  ],
  recommendedAction: "Remove affected lower leaves and apply copper-based organic fungicide. Avoid overhead irrigation.",
  prevention: [
    "Rotate with non-host crops (legumes/cereals) for 2 seasons",
    "Ensure adequate plant spacing for airflow",
    "Apply mulch to reduce soil splash onto leaves",
    "Use drip irrigation to keep foliage dry",
  ],
};

export const soilScanResult = {
  soilCondition: "Degraded — Low Organic Matter",
  degradationLevel: "Moderate",
  moistureCondition: "Below optimal (22%)",
  deficiencies: ["Nitrogen", "Potassium", "Organic carbon"],
  organicMatter: 0.6,
  soilRisks: ["Compaction", "Erosion risk", "Reduced water retention"],
  regenerativeActions: [
    "Apply 4-6 tonnes/ha composted organic matter",
    "Introduce legume cover crop next season",
    "Reduce tillage to preserve soil structure",
    "Add biochar to improve carbon retention",
  ],
};

export const languages = [
  { id: "en", name: "English" },
  { id: "hi", name: "हिंदी (Hindi)" },
  { id: "mr", name: "मराठी (Marathi)" },
  { id: "ta", name: "தமிழ் (Tamil)" },
  { id: "te", name: "తెలుగు (Telugu)" },
  { id: "kn", name: "ಕನ್ನಡ (Kannada)" },
];

export const translatedRecommendations = {
  en: [
    "Apply compost to restore organic matter",
    "Introduce legume cover crop for nitrogen fixation",
    "Use drip irrigation to conserve water",
    "Practice crop rotation to break pest cycles",
  ],
  hi: [
    "जैव पदार्थ बहाल करने के लिए कंपोस्ट लगाएं",
    "नाइट्रोजन स्थिरीकरण के लिए फलीदार आवरण फसल लगाएं",
    "पानी बचाने के लिए ड्रिप सिंचाई का उपयोग करें",
    "कीट चक्र को तोड़ने के लिए फसल चक्र अपनाएं",
  ],
  mr: [
    "सेंद्रिय पदार्थ पुनर्संचयित करण्यासाठी कंपोस्ट लावा",
    "नायट्रोजन निश्चितीसाठी कडधारी आच्छादन पीक घाला",
    "पाणी वाचवण्यासाठी ठिबक सिंचन वापरा",
    "कीड चक्र तोडण्यासाठी पीक रोटेशन करा",
  ],
  ta: [
    "கரிமப் பொருளை மீட்டெடுக்க கம்போஸ்ட் இடவும்",
    "நைட்ரஜன் நிலைநிறுத்த பயன்பயிர் சேர்க்கவும்",
    "நீரை மிச்சப்படுத்த டிரிப் நீர்ப்பாசன பயன்படுத்தவும்",
    "பூச்சி சுழற்சியை உடைக்க பயிர் சுழற்சி கடைப்பிடிக்கவும்",
  ],
  te: [
    "సేంద్రీయ పదార్థం పునరుద్ధరించడానికి కంపోస్ట్ వేయండి",
    "నత్రజని స్థిరీకరణ కోసం పప్పుదాసు ఆవరణ పంట పండించండి",
    "నీటిని ఆదా చేయడానికి డ్రిప్ నీటిపారుదల ఉపయోగించండి",
    "పురుగు చక్రాన్ని తెంచడానికి పంట మార్పిడి పాటించండి",
  ],
  kn: [
    "ಸಾವಯವ ವಸ್ತುವನ್ನು ಮರುಸ್ಥಾಪಿಸಲು ಕಂಪೋಸ್ಟ್ ಹಾಕಿ",
    "ಸಾರಜನಕ ಸ್ಥಿರೀಕರಣಕ್ಕೆ ಕಾಳಾಯಿ ಆವರಣ ಬೆಳೆ ಪರಿಚಯಿಸಿ",
    "ನೀರು ಉಳಿಸಲು ಡ್ರಿಪ್ ನೀರಾವಿ ಬಳಸಿ",
    "ಕೀಟ ಚಕ್ರ ಮುರಿಯಲು ಬೆಳೆ ಪರಿವರ್ತನೆ ಅಳವಡಿಸಿ",
  ],
};

export const scannerProcessingSteps = [
  "Uploading image",
  "Pre-processing",
  "Analyzing visual features",
  "Assessing condition",
  "Generating recommendations",
];
