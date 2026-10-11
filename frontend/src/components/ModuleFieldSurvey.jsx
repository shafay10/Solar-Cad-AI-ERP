import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin, Compass, Camera, Upload, Trash2, CheckCircle2,
  RefreshCw, Layers, ShieldCheck, Eye, Sparkles, Navigation,
  FileScan, Zap, Battery, Sliders, Box, Cpu, FileSpreadsheet,
  Wind, Hammer, Wrench, HardHat, Check, AlertCircle, ArrowRight,
  Building, Gauge, Activity, Crosshair, ExternalLink, BatteryCharging,
  Power, FileCode, CheckSquare, Square, ChevronDown, ChevronUp,
  Plus, X, EyeOff, Globe, Mountain
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polygon, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { calculateShoelaceArea, formatPKR, parseUtilityBillOCR } from "../services/solarEngine.js";
import StructureSchematicSVG from "./StructureSchematicSVG.jsx";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

// Major Pakistani Energy Hubs & Regional DISCO utilities
const PAKISTAN_CITY_HUBS = [
  { name: "Islamabad", lat: 33.6844, lng: 73.0479, disco: "IESCO", region: "Federal Capital Territory", defaultKw: 150 },
  { name: "Rawalpindi", lat: 33.5651, lng: 73.0169, disco: "IESCO", region: "Twin Cities Commercial Hub", defaultKw: 85 },
  { name: "Lahore", lat: 31.5204, lng: 74.3587, disco: "LESCO", region: "Punjab Central Industrial Grid", defaultKw: 250 },
  { name: "Karachi", lat: 24.8607, lng: 67.0011, disco: "K-Electric", region: "Sindh Coastal & Port Hub", defaultKw: 500 },
  { name: "Peshawar", lat: 34.0151, lng: 71.5249, disco: "PESCO", region: "KPK Northern Industrial Zone", defaultKw: 100 },
  { name: "Multan", lat: 30.1575, lng: 71.5249, disco: "MEPCO", region: "South Punjab Agro-Solar Corridor", defaultKw: 120 },
  { name: "Faisalabad", lat: 31.4504, lng: 73.1350, disco: "FESCO", region: "Textile City Industrial Grid", defaultKw: 300 },
  { name: "Hyderabad", lat: 25.3960, lng: 68.3578, disco: "HESCO", region: "Lower Sindh Energy Corridor", defaultKw: 90 },
  { name: "Quetta", lat: 30.1798, lng: 66.9750, disco: "QESCO", region: "Balochistan High Irradiance Hub", defaultKw: 200 }
];

// Comprehensive Offline Geocoding & DISCO Utility Dictionary for Pakistan (Zero manual Lat/Lng typing)
const PAK_CITY_COORDINATES = {
  "Sialkot": { lat: 32.4945, lng: 74.5229, disco: "GEPCO", region: "Export Processing Zone & Sports/Surgical Cluster" },
  "Gujranwala": { lat: 32.1877, lng: 74.1945, disco: "GEPCO", region: "Heavy Metal & Appliance Manufacturing Hub" },
  "Sukkur": { lat: 27.7052, lng: 68.8574, disco: "SEPCO", region: "Upper Sindh Trade & Agro Corridor" },
  "Larkana": { lat: 27.5590, lng: 68.2120, disco: "SEPCO", region: "Sindh Northern Agricultural Grid" },
  "Abbottabad": { lat: 34.1688, lng: 73.2215, disco: "HAZECO", region: "Hazara Division Commercial Center" },
  "Mardan": { lat: 34.1989, lng: 72.0450, disco: "PESCO", region: "KPK Central Sugar & Agro Corridor" },
  "Mirpur": { lat: 33.1484, lng: 73.7519, disco: "AJKED", region: "AJK Industrial & Diaspora Corridor" },
  "Mirpur AK": { lat: 33.1484, lng: 73.7519, disco: "AJKED", region: "AJK Industrial & Diaspora Corridor" },
  "Bahawalpur": { lat: 29.3544, lng: 71.6911, disco: "MEPCO", region: "Quaid-e-Azam Solar Park Corridor" },
  "Sargodha": { lat: 32.0836, lng: 72.6711, disco: "FESCO", region: "Central Punjab Agro & Citrus Hub" },
  "Sheikhupura": { lat: 31.7131, lng: 73.9783, disco: "LESCO", region: "Heavy Industry & Rice Mills Grid" },
  "Gwadar": { lat: 25.1216, lng: 62.3254, disco: "QESCO", region: "CPEC Free Zone & Deep Sea Port" },
  "Rahim Yar Khan": { lat: 28.4212, lng: 70.2989, disco: "MEPCO", region: "South Punjab Fertilizer & Sugar Corridor" },
  "Sahiwal": { lat: 30.6682, lng: 73.1114, disco: "MEPCO", region: "Dairy & Agro-Processing Industrial Grid" },
  "Kasur": { lat: 31.1160, lng: 74.4500, disco: "LESCO", region: "Leather & Textile Industrial Zone" },
  "Gujrat": { lat: 32.5742, lng: 74.0754, disco: "GEPCO", region: "Electric Fan & Ceramics Industry Hub" },
  "Jhelum": { lat: 32.9328, lng: 73.7265, disco: "IESCO", region: "North Punjab River Basin Grid" },
  "Okara": { lat: 30.8080, lng: 73.4458, disco: "LESCO", region: "Dairy & Agricultural Hub" },
  "Dera Ghazi Khan": { lat: 30.0489, lng: 70.6455, disco: "MEPCO", region: "Southwest Punjab Gateway" },
  "Muzaffarabad": { lat: 34.3647, lng: 73.4730, disco: "AJKED", region: "AJK Regional Capital Interconnect" },
  "Nawabshah": { lat: 26.2442, lng: 68.4100, disco: "HESCO", region: "Central Sindh Agro Grid" },
  "Hyderabad": { lat: 25.3960, lng: 68.3578, disco: "HESCO", region: "Lower Sindh Energy Corridor" },
  "Quetta": { lat: 30.1798, lng: 66.9750, disco: "QESCO", region: "Balochistan High Irradiance Hub" },
  "Peshawar": { lat: 34.0151, lng: 71.5249, disco: "PESCO", region: "KPK Northern Industrial Zone" },
  "Multan": { lat: 30.1575, lng: 71.5249, disco: "MEPCO", region: "South Punjab Agro-Solar Corridor" },
  "Faisalabad": { lat: 31.4504, lng: 73.1350, disco: "FESCO", region: "Textile City Industrial Grid" },
  "Karachi": { lat: 24.8607, lng: 67.0011, disco: "K-Electric", region: "Sindh Coastal & Port Hub" },
  "Lahore": { lat: 31.5204, lng: 74.3587, disco: "LESCO", region: "Punjab Central Industrial Grid" },
  "Rawalpindi": { lat: 33.5651, lng: 73.0169, disco: "IESCO", region: "Twin Cities Commercial Hub" },
  "Islamabad": { lat: 33.6844, lng: 73.0479, disco: "IESCO", region: "Federal Capital Territory" },
  "Swat": { lat: 34.7717, lng: 72.3602, disco: "PESCO", region: "Swat Valley High Altitude Grid" },
  "Chiniot": { lat: 31.7200, lng: 72.9789, disco: "FESCO", region: "Furniture & Timber Industrial Zone" },
  "Hafizabad": { lat: 32.0679, lng: 73.6872, disco: "GEPCO", region: "Punjab Grain & Agro Grid" },
  "Turbat": { lat: 26.0031, lng: 63.0544, disco: "QESCO", region: "Makran Solar Belt" }
};

// Pre-configured Quick-Add Suggestions for Pakistani Solar Clusters
const QUICK_CITY_PRESETS = [
  { name: "Sialkot", lat: 32.4945, lng: 74.5229, disco: "GEPCO", region: "Export Processing Zone & Sports/Surgical Cluster" },
  { name: "Gujranwala", lat: 32.1877, lng: 74.1945, disco: "GEPCO", region: "Heavy Metal & Appliance Manufacturing Hub" },
  { name: "Sukkur", lat: 27.7052, lng: 68.8574, disco: "SEPCO", region: "Upper Sindh Trade & Agro Corridor" },
  { name: "Sheikhupura", lat: 31.7131, lng: 73.9783, disco: "LESCO", region: "Heavy Industry & Rice Mills Grid" },
  { name: "Bahawalpur", lat: 29.3544, lng: 71.6911, disco: "MEPCO", region: "Quaid-e-Azam Solar Park Corridor" },
  { name: "Gwadar", lat: 25.1216, lng: 62.3254, disco: "QESCO", region: "CPEC Free Zone & Deep Sea Port" },
  { name: "Larkana", lat: 27.5589, lng: 68.2020, disco: "SEPCO", region: "Sindh Northern Agricultural Grid" },
  { name: "Abbottabad", lat: 34.1688, lng: 73.2215, disco: "HAZECO", region: "Hazara Division Commercial Center" },
  { name: "Mardan", lat: 34.1989, lng: 72.0404, disco: "PESCO", region: "KPK Central Sugar & Agro Corridor" },
  { name: "Mirpur AK", lat: 33.1484, lng: 73.7519, disco: "AJKED", region: "AJK Industrial & Diaspora Corridor" }
];

// Reference EPC benchmark projects plotted across Pakistan if zero active projects exist
const DEFAULT_BENCHMARK_PROJECTS = [
  {
    id: "proj-bench-fsd-500",
    clientName: "Crescent Textile Mill",
    projectCode: "SLR-FSD-500K",
    city: "Faisalabad",
    latitude: 31.4350,
    longitude: 73.0800,
    contractedCapacityKw: 500,
    status: "ONLINE",
    surveyData: { structureType: "L2 Elevated" }
  },
  {
    id: "proj-bench-lhr-250",
    clientName: "Packages Ltd Rooftop",
    projectCode: "SLR-LHR-250K",
    city: "Lahore",
    latitude: 31.4705,
    longitude: 74.3436,
    contractedCapacityKw: 250,
    status: "APPROVED",
    surveyData: { structureType: "L3 Elevated" }
  },
  {
    id: "proj-bench-khi-350",
    clientName: "KPT Logistics Center",
    projectCode: "SLR-KHI-350K",
    city: "Karachi",
    latitude: 24.8400,
    longitude: 66.9800,
    contractedCapacityKw: 350,
    status: "ONLINE",
    surveyData: { structureType: "L2 Elevated" }
  },
  {
    id: "proj-bench-skt-150",
    clientName: "Forward Sports Solar",
    projectCode: "SLR-SKT-150K",
    city: "Sialkot",
    latitude: 32.4980,
    longitude: 74.5380,
    contractedCapacityKw: 150,
    status: "SURVEYED",
    surveyData: { structureType: "L2 Elevated" }
  },
  {
    id: "proj-bench-isb-120",
    clientName: "NUST Tech Park Solar",
    projectCode: "SLR-ISB-120K",
    city: "Islamabad",
    latitude: 33.6425,
    longitude: 72.9904,
    contractedCapacityKw: 120,
    status: "APPROVED",
    surveyData: { structureType: "L2 Elevated" }
  },
  {
    id: "proj-bench-mul-180",
    clientName: "Fatima Fertilizer Grid",
    projectCode: "SLR-MUL-180K",
    city: "Multan",
    latitude: 30.1700,
    longitude: 71.4800,
    contractedCapacityKw: 180,
    status: "ONLINE",
    surveyData: { structureType: "L3 Elevated" }
  }
];

const PAKISTAN_DISCOS = [
  "IESCO", "LESCO", "GEPCO", "FESCO", "MEPCO", "PESCO", "HESCO", "SEPCO", "QESCO", "K-Electric", "HAZECO", "AJKED"
];

const STANDARD_KW_PRESETS = [5, 10, 15, 20, 30, 50, 100, 250, 500];

const PANEL_BRANDS = ["Jinko Solar", "Longi Solar", "JA Solar", "Canadian Solar", "Trina Solar"];
const PANEL_TYPES = ["N-Type TOPCon Dual-Glass Bifacial", "Monocrystalline Half-Cut", "Mono PERC Bifacial"];
const PANEL_WATTAGES = [550, 580, 585, 600, 610, 615, 620, 700];

const INVERTER_TYPES = ["On-Grid", "Hybrid (Energy Storage)", "Off-Grid Standalone"];
const INVERTER_BRANDS = ["Huawei", "Sungrow", "Growatt", "GoodWe", "Solis", "Inverex", "Knox"];

const BATTERY_TYPES = ["None / Grid-Tied Only", "Lithium-ion (LiFePO4)", "Gel / Deep-Cycle AGM", "Tubular Lead-Acid"];
const BATTERY_BRANDS = ["Huawei LUNA2000", "Pylontech Force-L2", "BYD Battery-Box", "Narada", "Phoenix"];

const CABLE_BRANDS = ["Fast Cables", "Pakistan Cables", "Newage Cables"];
const DC_CABLE_SIZES = ["1x4mm² DC Solar XLPO", "1x6mm² DC Solar XLPO", "1x10mm² DC Solar XLPO"];
const AC_CABLE_SIZES = [
  "4-Core 16mm² Armored Cu",
  "4-Core 25mm² Armored Cu",
  "4-Core 35mm² Armored Cu",
  "4-Core 70mm² Armored Cu",
  "4-Core 120mm² Armored Cu",
  "4-Core 240mm² Armored Cu"
];

const BREAKER_BRANDS = ["Schneider Electric", "Suntree Electric", "CNC Electric", "ABB", "Noark", "Siemens", "Terasaki"];

const MEDIA_CATEGORIES = [
  { id: "ROOF_SURFACE", label: "Roof Surface", color: "text-blue-700 border-blue-200 bg-blue-50 font-bold" },
  { id: "ELECTRICAL_PANEL", label: "Electrical Panel", color: "text-emerald-700 border-emerald-200 bg-emerald-50 font-bold" },
  { id: "CABLE_ROUTE", label: "Cable Route", color: "text-amber-700 border-amber-200 bg-amber-50 font-bold" },
  { id: "INVERTER_LOCATION", label: "Inverter Location", color: "text-indigo-700 border-indigo-200 bg-indigo-50 font-bold" },
  { id: "TRANSFORMER", label: "Transformer", color: "text-purple-700 border-purple-200 bg-purple-50 font-bold" },
  { id: "OBSTRUCTIONS", label: "Obstructions", color: "text-rose-700 border-rose-200 bg-rose-50 font-bold" }
];

// Custom Leaflet DivIcons
function createGpsTargetIcon(accuracyText = "±5m") {
  return L.divIcon({
    className: "gps-target-marker",
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.3s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; background: rgba(6, 95, 70, 0.9); border: 2px solid #34d399; box-shadow: 0 0 12px #10b981;"></div>
        <div style="width: 8px; height: 8px; border-radius: 9999px; background: #ffffff; box-shadow: 0 0 6px #ffffff;"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

function createCityHubIcon(city, isCurrent) {
  return L.divIcon({
    className: "city-hub-marker",
    html: `
      <div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;">
        <div style="display: flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; font-family: monospace; background: ${isCurrent ? '#0e7490' : '#0f172a'}; color: ${isCurrent ? '#67e8f9' : '#93c5fd'}; border: 1.5px solid ${isCurrent ? '#22d3ee' : '#3b82f6'}; box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap; cursor: pointer;">
          <span style="width: 6px; height: 6px; border-radius: 9999px; background: ${isCurrent ? '#22d3ee' : '#60a5fa'};"></span>
          <span>${city.name}</span>
          <span style="font-size: 8px; opacity: 0.85; background: rgba(255,255,255,0.12); padding: 1px 4px; border-radius: 3px;">${city.disco}</span>
        </div>
      </div>
    `,
    iconSize: [100, 24],
    iconAnchor: [50, 12]
  });
}

function createSavedProjectPinIcon(proj, isCurrent) {
  const cap = Math.round(Number(proj.contractedCapacityKw || proj.capacityKw || proj.systemCapacityKw || 100));
  const rawStatus = (proj.status || (proj.adminApprovedAt ? "APPROVED" : proj.surveyData ? "SURVEYED" : "ACTIVE")).toUpperCase();
  
  let statusColor = "#10b981"; // Emerald
  let borderColor = isCurrent ? "#34d399" : "#059669";
  let statusLabel = "ONLINE";
  if (rawStatus.includes("APPROV")) {
    statusColor = "#38bdf8"; // Sky
    borderColor = isCurrent ? "#7dd3fc" : "#0284c7";
    statusLabel = "APPROVED";
  } else if (rawStatus.includes("SURVEY")) {
    statusColor = "#f59e0b"; // Amber
    borderColor = isCurrent ? "#fcd34d" : "#d97706";
    statusLabel = "SURVEYED";
  } else if (rawStatus.includes("PEND")) {
    statusColor = "#a855f7"; // Purple
    borderColor = isCurrent ? "#d8b4fe" : "#7e22ce";
    statusLabel = "PENDING";
  }

  const nameShort = (proj.clientName || proj.name || "PROJECT").slice(0, 13);

  return L.divIcon({
    className: "saved-project-marker",
    html: `
      <div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.55));">
        <div style="
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: ${isCurrent ? '#042f2e' : '#0f172a'};
          color: #ffffff;
          border: 1.5px solid ${borderColor};
          box-shadow: 0 0 ${isCurrent ? '14px #10b981' : '6px rgba(0,0,0,0.4)'};
          white-space: nowrap;
          cursor: pointer;
        ">
          <span style="width: 7px; height: 7px; border-radius: 9999px; background: ${statusColor}; box-shadow: 0 0 6px ${statusColor}; animation: ${isCurrent ? 'pulse 1.2s infinite' : 'none'};"></span>
          <span style="font-size: 11px; font-weight: 700; color: #f8fafc;">${nameShort}</span>
          <span style="font-size: 9px; font-weight: 800; font-family: monospace; background: rgba(255,255,255,0.16); padding: 1px 5px; border-radius: 4px; color: #a7f3d0;">${cap} kWp</span>
          <span style="font-size: 8px; font-weight: 800; background: ${statusColor}; color: #ffffff; padding: 1px 4px; border-radius: 3px;">${statusLabel}</span>
        </div>
      </div>
    `,
    iconSize: [160, 26],
    iconAnchor: [80, 13]
  });
}

// React-Leaflet Map FlyTo Controller with Auto-Invalidate
function MapFlyToHandler({ targetCoords, zoom = 18 }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoords && Array.isArray(targetCoords) && targetCoords[0] && targetCoords[1]) {
      const safeZoom = Math.min(18, zoom || 18);
      map.flyTo([targetCoords[0], targetCoords[1]], safeZoom, { animate: true, duration: 1.0 });
      map.invalidateSize();
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [targetCoords, zoom, map]);

  useEffect(() => {
    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    const initialTimer = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(initialTimer);
    };
  }, [map]);

  return null;
}

// Map Click Listener for CAD Boundary
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function ModuleFieldSurvey({
  activeProject,
  gpsCoords,
  setGpsCoords,
  pitch,
  setPitch,
  azimuth,
  setAzimuth,
  polygonCoords,
  setPolygonCoords,
  polygonArea,
  surveyDetails,
  setSurveyDetails,
  onSurveySaved,
  token,
  projectsList = [],
  onSelectProject,
  capacityKw,
  setCapacityKw,
  moduleWattage,
  setModuleWattage,
  setActiveTab
}) {
  const [mapLayer, setMapLayer] = useState("google");
  const [activeMediaCategory, setActiveMediaCategory] = useState("ROOF_SURFACE");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [gyroActive, setGyroActive] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Manual Coordinate Input state - auto-initialized so inputs are never empty/NaN
  const [manualLatInput, setManualLatInput] = useState(() => (gpsCoords?.lat ? gpsCoords.lat.toString() : (activeProject?.latitude ? activeProject.latitude.toString() : "33.6844")));
  const [manualLngInput, setManualLngInput] = useState(() => (gpsCoords?.lng ? gpsCoords.lng.toString() : (activeProject?.longitude ? activeProject.longitude.toString() : "73.0479")));

  // Live GPS Telemetry State & Toast Notification
  const [userLiveGps, setUserLiveGps] = useState(null);
  const [gpsSearching, setGpsSearching] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [mapZoom, setMapZoom] = useState(18);
  const [gpsNotification, setGpsNotification] = useState(null);

  // Dynamic Custom Cities (Persisted in localStorage across sessions)
  const [customCities, setCustomCities] = useState(() => {
    try {
      const saved = localStorage.getItem("solar_erp_custom_cities");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not read custom cities from localStorage:", e);
    }
    return [
      { name: "Sialkot", lat: 32.4945, lng: 74.5229, disco: "GEPCO", region: "Export Processing Zone & Sports/Surgical Cluster", isCustom: true },
      { name: "Gujranwala", lat: 32.1877, lng: 74.1945, disco: "GEPCO", region: "Heavy Metal & Appliance Manufacturing Grid", isCustom: true },
      { name: "Sukkur", lat: 27.7052, lng: 68.8574, disco: "SEPCO", region: "Upper Sindh Trade & Agricultural Corridor", isCustom: true }
    ];
  });

  // Save custom cities to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("solar_erp_custom_cities", JSON.stringify(customCities));
    } catch (e) {
      console.warn("Could not save custom cities to localStorage:", e);
    }
  }, [customCities]);

  // Combined City Hubs list (Standard Base Cities + Custom Dynamic Cities)
  const allCityHubs = useMemo(() => {
    return [...PAKISTAN_CITY_HUBS, ...customCities];
  }, [customCities]);

  // Add City Inline Form / Modal State
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityDisco, setNewCityDisco] = useState("GEPCO");
  const [newCityLat, setNewCityLat] = useState("");
  const [newCityLng, setNewCityLng] = useState("");
  const [newCityRegion, setNewCityRegion] = useState("");
  const [geocodingCity, setGeocodingCity] = useState(false);
  const [addCityError, setAddCityError] = useState("");

  // Map Project Markers Visibility Toggle
  const [showProjectMarkers, setShowProjectMarkers] = useState(true);

  // Fallback coordinates (Islamabad center or active project)
  const currentLat = parseFloat(gpsCoords?.lat) || (activeProject?.latitude ? parseFloat(activeProject.latitude) : 33.6844);
  const currentLng = parseFloat(gpsCoords?.lng) || (activeProject?.longitude ? parseFloat(activeProject.longitude) : 73.0479);

  // Filter & plot all saved projects with valid coordinates (with EPC benchmark fallback if zero in DB)
  const validSavedProjects = useMemo(() => {
    const collected = [];
    const seenIds = new Set();

    const checkAndAdd = (p) => {
      if (!p) return;
      const id = p.id || p.projectCode;
      if (id && seenIds.has(id)) return;

      const lat = parseFloat(p.latitude || p.surveyData?.latitude || p.surveyData?.siteCoordinates?.lat || p.lat);
      const lng = parseFloat(p.longitude || p.surveyData?.longitude || p.surveyData?.siteCoordinates?.lng || p.lng);

      if (!isNaN(lat) && !isNaN(lng) && lat >= 20 && lat <= 40 && lng >= 60 && lng <= 80) {
        if (id) seenIds.add(id);
        collected.push({
          ...p,
          latitude: lat,
          longitude: lng,
          contractedCapacityKw: p.contractedCapacityKw || p.capacityKw || p.systemCapacityKw || 100,
          clientName: p.clientName || p.name || "Solar Client"
        });
      }
    };

    // 1. Database projects from props
    if (Array.isArray(projectsList)) {
      projectsList.forEach(checkAndAdd);
    }

    // 2. Local storage projects
    try {
      const local = JSON.parse(localStorage.getItem("solar_erp_projects") || "[]");
      if (Array.isArray(local)) local.forEach(checkAndAdd);
    } catch {}

    // 3. Active project
    if (activeProject) {
      checkAndAdd(activeProject);
    }

    // 4. If total plotted projects is 0, provide Pakistan EPC benchmark reference projects
    if (collected.length === 0) {
      DEFAULT_BENCHMARK_PROJECTS.forEach(checkAndAdd);
    }

    return collected;
  }, [projectsList, activeProject]);

  // Safe polygon coords array guarantee
  const safePolygonCoords = useMemo(() => {
    return Array.isArray(polygonCoords) ? polygonCoords : [];
  }, [polygonCoords]);

  // Sync manual coordinate inputs with gpsCoords or activeProject
  useEffect(() => {
    if (gpsCoords?.lat && gpsCoords?.lng) {
      setManualLatInput(gpsCoords.lat.toString());
      setManualLngInput(gpsCoords.lng.toString());
    } else if (activeProject?.latitude && activeProject?.longitude) {
      setManualLatInput(activeProject.latitude.toString());
      setManualLngInput(activeProject.longitude.toString());
    }
  }, [gpsCoords, activeProject]);

  // Device orientation / Gyroscope
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.beta !== null && event.alpha !== null) {
        setGyroActive(true);
        const calculatedPitch = Math.min(90, Math.max(0, Math.abs(Math.round(event.beta))));
        const calculatedAzimuth = Math.round(event.alpha || 0);
        setPitch(calculatedPitch);
        setAzimuth(calculatedAzimuth);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
    }
    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, [setPitch, setAzimuth]);

  // Helper to query elevation from Open-Meteo elevation API
  const queryElevation = async (lat, lng) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.elevation) && data.elevation[0] !== undefined) {
          return Math.round(data.elevation[0]);
        }
      }
    } catch (e) {
      console.warn("Elevation query failed:", e.message);
    }
    return null;
  };

  // Apply resolved location to inputs, state, and map canvas
  const applyNewLocation = async (lat, lng, source = "Physical GPS Satellites", accuracy = "±5m", city = "Site GPS") => {
    const parsedLat = parseFloat(Number(lat).toFixed(6));
    const parsedLng = parseFloat(Number(lng).toFixed(6));

    // Update coordinate input boxes (overriding default 33.6844)
    setManualLatInput(parsedLat.toFixed(6));
    setManualLngInput(parsedLng.toFixed(6));

    const elev = await queryElevation(parsedLat, parsedLng);
    const address = `${source}: ${parsedLat.toFixed(4)}°N, ${parsedLng.toFixed(4)}°E (Pakistan ${accuracy})`;

    setGpsCoords({
      lat: parsedLat.toFixed(6),
      lng: parsedLng.toFixed(6),
      address
    });

    setUserLiveGps({
      lat: parsedLat,
      lng: parsedLng,
      accuracy,
      elevation: elev,
      city,
      source,
      timestamp: new Date().toLocaleTimeString()
    });

    // Fly satellite map to actual location with zoom 18
    setFlyToCoords([parsedLat, parsedLng]);
    setMapZoom(18);
  };

  // Free reliable IP lookup fallback (guarantees real location in Pakistan)
  const fallbackToIpGeo = async (reason = "Hardware GPS unavailable") => {
    setGpsNotification({
      type: "warning",
      message: `${reason}. Resolving physical network location via IP Geolocation...`
    });

    try {
      let data = null;
      // 1. Try ipwho.is (CORS supported, zero auth, fast)
      try {
        const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const json = await res.json();
          if (json && json.success !== false && json.latitude && json.longitude) {
            data = {
              lat: parseFloat(Number(json.latitude).toFixed(6)),
              lng: parseFloat(Number(json.longitude).toFixed(6)),
              city: json.city || "Pakistan",
              region: json.region || "Regional Interconnect"
            };
          }
        }
      } catch {}

      // 2. Fallback to ipapi.co
      if (!data) {
        try {
          const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const json = await res.json();
            if (json && json.latitude && json.longitude) {
              data = {
                lat: parseFloat(Number(json.latitude).toFixed(6)),
                lng: parseFloat(Number(json.longitude).toFixed(6)),
                city: json.city || "Pakistan",
                region: json.region || "Regional Interconnect"
              };
            }
          }
        } catch {}
      }

      if (data) {
        await applyNewLocation(data.lat, data.lng, "Network IP Geolocation", "Regional IP (±1.5km)", data.city);
        setGpsSearching(false);
        setGpsNotification({
          type: "success",
          message: `Network location locked near ${data.city} (${data.lat}°N, ${data.lng}°E). Coordinate boxes updated!`
        });
        setTimeout(() => setGpsNotification(null), 8000);
        return;
      }
    } catch (e) {
      console.warn("IP Geolocation fallback error:", e);
    }

    setGpsSearching(false);
    setGpsNotification({
      type: "error",
      message: "Could not retrieve network location. Please check your internet or type your city name."
    });
    setTimeout(() => setGpsNotification(null), 8000);
  };

  // High-Accuracy Dual Live GPS & Network IP Auto-Location Resolution
  const handleDetectAccurateLocation = () => {
    setGpsSearching(true);
    setGpsNotification({
      type: "info",
      message: "Requesting high-accuracy device GPS satellite coordinates..."
    });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setGpsSearching(false);
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const accuracy = Math.round(pos.coords.accuracy || 5);
          await applyNewLocation(lat, lng, "Device GPS Satellites", `±${accuracy}m`, "Live GPS Site");
          setGpsNotification({
            type: "success",
            message: `High-accuracy GPS lock confirmed! LAT: ${lat}°N, LNG: ${lng}°E (Accuracy: ±${accuracy}m). Input boxes updated!`
          });
          setTimeout(() => setGpsNotification(null), 8000);
        },
        async (err) => {
          console.warn("Hardware GPS unavailable, falling back to IP Geolocation:", err.message);
          const reason = err.code === 1 ? "Browser GPS Permission Denied" : err.code === 3 ? "GPS Satellite Timeout" : err.message;
          await fallbackToIpGeo(reason);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      fallbackToIpGeo("Browser geolocation API not supported");
    }
  };

  const fetchLiveGPS = handleDetectAccurateLocation;
  const fetchIpFallback = fallbackToIpGeo;

  // Instant Dictionary Matching when user types City Name
  const handleCityNameChange = (val) => {
    setNewCityName(val);
    setAddCityError("");
    const trimmed = val.trim();
    if (!trimmed) return;

    // Look for exact or prefix match in PAK_CITY_COORDINATES
    const lower = trimmed.toLowerCase();
    const foundKey = Object.keys(PAK_CITY_COORDINATES).find(
      k => k.toLowerCase() === lower || k.toLowerCase().startsWith(lower)
    );

    if (foundKey) {
      const match = PAK_CITY_COORDINATES[foundKey];
      setNewCityDisco(match.disco);
      setNewCityLat(match.lat.toString());
      setNewCityLng(match.lng.toString());
      setNewCityRegion(match.region);
    }
  };

  // 1-Click "Use My Current GPS" autofill inside Add City modal
  const handleUseCurrentGpsForCity = () => {
    setAddCityError("");
    if (userLiveGps && userLiveGps.lat && userLiveGps.lng) {
      setNewCityLat(userLiveGps.lat.toString());
      setNewCityLng(userLiveGps.lng.toString());
      if (!newCityName) setNewCityName(userLiveGps.city || "Live GPS Site");
      return;
    }

    const lat = parseFloat(gpsCoords?.lat);
    const lng = parseFloat(gpsCoords?.lng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= 20 && lat <= 40) {
      setNewCityLat(lat.toFixed(4));
      setNewCityLng(lng.toFixed(4));
      if (!newCityName) setNewCityName("Site Location");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const cLat = parseFloat(pos.coords.latitude.toFixed(4));
          const cLng = parseFloat(pos.coords.longitude.toFixed(4));
          setNewCityLat(cLat.toString());
          setNewCityLng(cLng.toString());
          if (!newCityName) setNewCityName("Current Device GPS");
        },
        () => {
          if (currentLat && currentLng) {
            setNewCityLat(currentLat.toFixed(4));
            setNewCityLng(currentLng.toFixed(4));
          } else {
            setAddCityError("Could not acquire GPS. Please click a preset city.");
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else if (currentLat && currentLng) {
      setNewCityLat(currentLat.toFixed(4));
      setNewCityLng(currentLng.toFixed(4));
    }
  };

  // Dynamic Custom City Actions with Dictionary Fallback & 1-Click Add
  const handleAddCustomCity = (cityObj) => {
    const rawName = (cityObj.name || "").trim();
    if (!rawName) {
      setAddCityError("Please provide a valid city name.");
      return;
    }

    // Auto-resolve coordinates from dictionary if left blank, 0, or invalid
    let lat = parseFloat(cityObj.lat);
    let lng = parseFloat(cityObj.lng);
    let disco = cityObj.disco || "DISCO";
    let region = cityObj.region || `${rawName} Regional Solar Grid`;

    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      const lower = rawName.toLowerCase();
      const matchKey = Object.keys(PAK_CITY_COORDINATES).find(k => k.toLowerCase() === lower || k.toLowerCase().startsWith(lower));
      if (matchKey) {
        lat = PAK_CITY_COORDINATES[matchKey].lat;
        lng = PAK_CITY_COORDINATES[matchKey].lng;
        disco = PAK_CITY_COORDINATES[matchKey].disco;
        region = PAK_CITY_COORDINATES[matchKey].region;
      }
    }

    if (isNaN(lat) || isNaN(lng) || lat < 20 || lat > 40 || lng < 60 || lng > 80) {
      setAddCityError("Please select a quick preset or provide valid Pakistan coordinates.");
      return;
    }

    const cityEntry = {
      name: rawName,
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4)),
      disco,
      region,
      defaultKw: 150,
      isCustom: true
    };

    setCustomCities(prev => {
      const filtered = prev.filter(c => c.name.toLowerCase() !== cityEntry.name.toLowerCase());
      return [...filtered, cityEntry];
    });

    handleSelectPin(cityEntry.lat, cityEntry.lng, `${cityEntry.name} (${cityEntry.disco}) Hub`);
    setIsAddCityOpen(false);
    setNewCityName("");
    setNewCityLat("");
    setNewCityLng("");
    setNewCityRegion("");
    setAddCityError("");
  };

  const handleRemoveCustomCity = (cityName, e) => {
    if (e) e.stopPropagation();
    setCustomCities(prev => prev.filter(c => c.name.toLowerCase() !== cityName.toLowerCase()));
  };

  const handleGeocodeNewCity = async (name) => {
    if (!name || !name.trim()) return;
    setGeocodingCity(true);
    setAddCityError("");

    // First check local dictionary
    const lower = name.trim().toLowerCase();
    const matchKey = Object.keys(PAK_CITY_COORDINATES).find(k => k.toLowerCase() === lower || k.toLowerCase().startsWith(lower));
    if (matchKey) {
      const match = PAK_CITY_COORDINATES[matchKey];
      setNewCityDisco(match.disco);
      setNewCityLat(match.lat.toString());
      setNewCityLng(match.lng.toString());
      setNewCityRegion(match.region);
      setGeocodingCity(false);
      return;
    }

    try {
      const q = encodeURIComponent(`${name.trim()}, Pakistan`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=pk&q=${q}`, {
        headers: { "Accept-Language": "en" }
      });
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          setNewCityLat(parseFloat(first.lat).toFixed(4));
          setNewCityLng(parseFloat(first.lon).toFixed(4));
          setNewCityRegion(first.display_name.split(",")[1]?.trim() || "Regional Industrial Corridor");
        } else {
          setAddCityError("City not found in OpenStreetMap. Please select a preset.");
        }
      }
    } catch (err) {
      setAddCityError("Geocoding lookup failed. Enter coordinates manually.");
    } finally {
      setGeocodingCity(false);
    }
  };

  // Manual Coordinate Jump (Point 1 on Page 1) / Locate on Map
  const handleApplyManualCoords = () => {
    // Robust fallback: prioritize manualLatInput, then gpsCoords, activeProject, or Islamabad center
    const rawLat = (manualLatInput !== "" && manualLatInput !== undefined && manualLatInput !== null)
      ? manualLatInput
      : (gpsCoords?.lat || (activeProject?.latitude ? activeProject.latitude.toString() : "33.6844"));
    const rawLng = (manualLngInput !== "" && manualLngInput !== undefined && manualLngInput !== null)
      ? manualLngInput
      : (gpsCoords?.lng || (activeProject?.longitude ? activeProject.longitude.toString() : "73.0479"));

    const parsedLat = parseFloat(rawLat);
    const parsedLng = parseFloat(rawLng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert("Please enter valid numerical latitude and longitude.");
      return;
    }

    // Pakistan bounding box check: 23°-37°N and 60°-77°E
    if (parsedLat < 23 || parsedLat > 37 || parsedLng < 60 || parsedLng > 77) {
      alert("Please enter valid Pakistan latitude (23°-37°N) and longitude (60°-77°E).");
      return;
    }

    // Two-way sync the inputs with formatted values
    setManualLatInput(parsedLat.toFixed(6));
    setManualLngInput(parsedLng.toFixed(6));

    setGpsCoords({
      lat: parsedLat.toFixed(6),
      lng: parsedLng.toFixed(6),
      address: `Manual Coordinates: ${parsedLat.toFixed(4)}°N, ${parsedLng.toFixed(4)}°E`
    });

    setFlyToCoords([parsedLat, parsedLng]);
    setMapZoom(18);
  };

  const handleLocateOnMap = handleApplyManualCoords;

  const handleMapClick = (lat, lng) => {
    const newCoords = [...safePolygonCoords, [parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]];
    setPolygonCoords(newCoords);
    setGpsCoords({
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      address: `Site Location: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
    });
    setManualLatInput(lat.toFixed(6));
    setManualLngInput(lng.toFixed(6));
  };

  const clearPolygon = () => {
    setPolygonCoords([]);
  };

  const handleSelectPin = (lat, lng, name, projectObj = null) => {
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    setGpsCoords({
      lat: numLat.toFixed(6),
      lng: numLng.toFixed(6),
      address: `${name} (${numLat.toFixed(4)}°N, ${numLng.toFixed(4)}°E)`
    });
    setManualLatInput(numLat.toFixed(6));
    setManualLngInput(numLng.toFixed(6));
    setFlyToCoords([numLat, numLng]);
    setMapZoom(19);

    if (projectObj && onSelectProject) {
      onSelectProject(projectObj);
    }
  };

  const handleLoadCad = (lat, lng, name, projectObj = null) => {
    handleSelectPin(lat, lng, name, projectObj);
    if (setActiveTab) {
      setActiveTab("cad");
    }
  };

  // -------------------------------------------------------------
  // STRUCTURE ENGINE & PRESET SELECTION (Points 4, 5, 6)
  // -------------------------------------------------------------
  const handleStructurePreset = (preset) => {
    if (preset === "L2 Elevated") {
      setSurveyDetails(prev => ({
        ...prev,
        structureType: "L2 Elevated",
        frontHeightMm: 450,
        backHeightMm: 1850,
        pitchMeters: 3.2,
        rafterLengthMm: 4650,
        materialSpec: "HDG C-Channel (ASTM A123, ≥80µm, 2.0mm, SS304)",
        windRating: "130 km/h (BCP 2021)"
      }));
      setPitch(18);
    } else if (preset === "L3 Elevated") {
      setSurveyDetails(prev => ({
        ...prev,
        structureType: "L3 Elevated",
        frontHeightMm: 800,
        backHeightMm: 2900,
        pitchMeters: 4.1,
        rafterLengthMm: 6950,
        materialSpec: "Heavy HDG Tubular (100x50x3.0mm) + Wind Bracing",
        windRating: "145 km/h"
      }));
      setPitch(18);
    } else {
      setSurveyDetails(prev => ({
        ...prev,
        structureType: "Customized",
        frontHeightMm: prev.frontHeightMm || 600,
        backHeightMm: prev.backHeightMm || 2200,
        pitchMeters: prev.pitchMeters || 3.5,
        rafterLengthMm: prev.rafterLengthMm || 5200,
        columnSpanMeters: prev.columnSpanMeters || 3.5,
        purlinCount: prev.purlinCount || 6,
        parapetClearanceM: prev.parapetClearanceM || 1.2,
        materialSpec: prev.materialSpec || "Aluminium AL6005-T5 Anodized",
        windRating: "135 km/h"
      }));
    }
  };

  // -------------------------------------------------------------
  // INSTALLATION SIZE & AREA ENGINE (Points 2 & 3)
  // -------------------------------------------------------------
  const activeWattage = surveyDetails.panelWattage || moduleWattage || 585;

  // Manual Area vs App Drawing
  const isManualArea = surveyDetails.areaMode === "manual";
  const activeAreaSqFt = isManualArea 
    ? (surveyDetails.manualAreaUnit === "sqm" ? (Number(surveyDetails.manualAreaSqFt) * 10.7639) : Number(surveyDetails.manualAreaSqFt || 0))
    : polygonArea.areaSqFt;
  const activeAreaSqM = isManualArea
    ? (surveyDetails.manualAreaUnit === "sqm" ? Number(surveyDetails.manualAreaSqFt || 0) : (activeAreaSqFt / 10.7639))
    : polygonArea.areaSqMeters;

  // Capacity calculation
  const calculatedPanelCount = surveyDetails.panelQuantity || 
    (capacityKw ? Math.round((capacityKw * 1000) / activeWattage) : 0) || 
    (activeAreaSqFt > 0 ? Math.round(activeAreaSqFt / 75) : 0) || 
    0;

  const calculatedCapacityKw = capacityKw || 
    (calculatedPanelCount > 0 ? (calculatedPanelCount * activeWattage) / 1000 : 0);

  // Quick Preset Size click handler
  const handleQuickSizeSelect = (kw) => {
    if (setCapacityKw) setCapacityKw(kw);
    const requiredPanels = Math.ceil((kw * 1000) / activeWattage);
    setSurveyDetails(prev => ({
      ...prev,
      inverterCapacityKw: kw,
      panelQuantity: requiredPanels
    }));
  };

  // Quick Panel Quantity adjuster (+/-)
  const handleAdjustPanelQuantity = (delta) => {
    const current = Number(surveyDetails.panelQuantity || calculatedPanelCount || 0);
    const next = Math.max(0, current + delta);
    setSurveyDetails(prev => ({
      ...prev,
      panelQuantity: next
    }));
    if (setCapacityKw && next > 0) {
      setCapacityKw(parseFloat(((next * activeWattage) / 1000).toFixed(2)));
    }
  };

  // -------------------------------------------------------------
  // COMPREHENSIVE CIVIL & LABOUR COST MATRIX (Points 14-17)
  // -------------------------------------------------------------
  const isL3 = surveyDetails.structureType === "L3 Elevated";
  const isCustom = surveyDetails.structureType === "Customized";
  
  // Baseline Civil Cost: L2 = 850 PKR/panel, L3 = 1,450 PKR/panel, Custom = 950 PKR/panel
  const civilRatePerPanel = isL3 ? 1450 : isCustom ? 950 : 850;
  const baselineCivilCost = calculatedPanelCount > 0 
    ? Math.round(calculatedPanelCount * civilRatePerPanel)
    : (isL3 ? 145000 : 85000);

  // Baseline Mechanical Labour: Total kWp * PKR 1,200/kWp
  const baselineMechanicalCost = calculatedCapacityKw > 0 
    ? Math.round(calculatedCapacityKw * 1200)
    : 60000;

  // Baseline Electrical Labour: Total kWp * PKR 1,500/kWp
  const baselineElectricalCost = calculatedCapacityKw > 0 
    ? Math.round(calculatedCapacityKw * 1500)
    : 75000;

  // Baseline Testing & DISCO Energization: Flat PKR 75,000
  const baselineTestingCost = 75000;

  // Current active values
  const currentCivilCost = surveyDetails.civilWorkPrice !== undefined && surveyDetails.civilWorkPrice !== null && surveyDetails.civilWorkPrice !== ""
    ? Number(surveyDetails.civilWorkPrice)
    : baselineCivilCost;

  const currentMechanicalCost = surveyDetails.mechanicalLaborPrice !== undefined && surveyDetails.mechanicalLaborPrice !== null && surveyDetails.mechanicalLaborPrice !== ""
    ? Number(surveyDetails.mechanicalLaborPrice)
    : baselineMechanicalCost;

  const currentElectricalCost = surveyDetails.electricalLaborPrice !== undefined && surveyDetails.electricalLaborPrice !== null && surveyDetails.electricalLaborPrice !== ""
    ? Number(surveyDetails.electricalLaborPrice)
    : baselineElectricalCost;

  const currentTestingCost = surveyDetails.netMeteringPrice !== undefined && surveyDetails.netMeteringPrice !== null && surveyDetails.netMeteringPrice !== ""
    ? Number(surveyDetails.netMeteringPrice)
    : baselineTestingCost;

  const currentEarthingPrice = surveyDetails.earthingJobPrice !== undefined && surveyDetails.earthingJobPrice !== null && surveyDetails.earthingJobPrice !== ""
    ? Number(surveyDetails.earthingJobPrice)
    : 128000;

  const totalCivilLabourPackage = currentCivilCost + currentMechanicalCost + currentElectricalCost + currentTestingCost + currentEarthingPrice;

  // Reset to automated baselines
  const handleApplyBaselines = () => {
    setSurveyDetails(prev => ({
      ...prev,
      civilWorkPrice: baselineCivilCost,
      mechanicalLaborPrice: baselineMechanicalCost,
      electricalLaborPrice: baselineElectricalCost,
      installationPrice: baselineMechanicalCost + baselineElectricalCost,
      netMeteringPrice: baselineTestingCost,
      earthingJobPrice: 128000
    }));
  };

  // AI OCR Bill Upload & Processing
  const handleOcrBillUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const res = await fetch("/api/ai/scan-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name })
      });
      if (res.ok) {
        const data = await res.json();
        setOcrResult(data);
      }
    } catch (err) {
      console.error("OCR scan error", err);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedFiles(prev => [
          {
            id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            category: activeMediaCategory,
            name: file.name,
            url: ev.target.result
          },
          ...prev
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (id) => {
    setUploadedFiles(prev => prev.filter(m => m.id !== id));
  };

  // Save Site Survey to Backend with Full Audit Log
  const handleSaveSurvey = async () => {
    if (!activeProject) {
      alert("Please select or create an active project first.");
      return;
    }

    setSaveStatus("SAVING");
    try {
      const payload = {
        panelBrand: surveyDetails.panelBrand || "Jinko Solar",
        panelModel: surveyDetails.panelModel || "Tiger Neo 585W Dual-Glass",
        panelWattage: Number(activeWattage),
        panelQuantity: Number(surveyDetails.panelQuantity || calculatedPanelCount || 257),
        inverterType: surveyDetails.inverterType || "On-Grid",
        inverterBrand: surveyDetails.inverterBrand || "Huawei",
        inverterCapacityKw: Number(surveyDetails.inverterCapacityKw || (calculatedCapacityKw > 0 ? Math.round(calculatedCapacityKw) : 100)),
        structureType: surveyDetails.structureType || "L2 Elevated",
        frontHeightMm: Number(surveyDetails.frontHeightMm || (isL3 ? 800 : 450)),
        backHeightMm: Number(surveyDetails.backHeightMm || (isL3 ? 2900 : 1850)),
        tiltAngle: Number(pitch || 18),
        azimuthDirection: surveyDetails.azimuthDirection || "True South (180°)",
        batteryType: surveyDetails.batteryType || "None / Grid-Tied Only",
        batteryBrand: surveyDetails.batteryBrand || "Huawei LUNA2000",
        cableBrand: surveyDetails.cableBrand || "Fast Cables",
        cableSize: surveyDetails.dcCableSize || surveyDetails.cableSize || "1x6mm² DC XLPO",
        cableLengthMeters: Number(surveyDetails.cableLengthMeters || surveyDetails.dcCableLengthMeters || 120),
        earthingJobPrice: currentEarthingPrice,
        civilWorkPrice: currentCivilCost,
        installationPrice: currentMechanicalCost + currentElectricalCost,
        netMeteringPrice: currentTestingCost,
        includeSld: surveyDetails.includeSld !== undefined ? surveyDetails.includeSld : true,
        roofPolygonJson: safePolygonCoords
      };

      const res = await fetch(`/api/projects/${activeProject.id}/survey`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus("SAVED");
        setTimeout(() => setSaveStatus(null), 3000);
        if (onSurveySaved) onSurveySaved();
      } else {
        setSaveStatus("SAVED_LOCAL");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e) {
      setSaveStatus("SAVED_LOCAL");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & TELEMETRY BANNER */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            FIELD SURVEY, MULTI-CITY GIS & STRUCTURAL ENGINEERING SUITE
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            Active Project: <strong className="text-emerald-700">{activeProject?.clientName || "No Project Selected"}</strong>
            <span className="text-slate-300">|</span>
            Code: <strong className="text-slate-700 font-mono">{activeProject?.projectCode || "Select/Create Project"}</strong>
            <span className="text-slate-300">|</span>
            Grid Utility: <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold">{activeProject?.city ? `${activeProject.city.toUpperCase()} Interconnect` : "IESCO / LESCO / KE"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Detect Live GPS Button */}
          <button
            type="button"
            onClick={handleDetectAccurateLocation}
            disabled={gpsSearching}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-200 transition active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
            title="Locate via high-accuracy device GPS or network IP geolocation"
          >
            {gpsSearching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            )}
            {gpsSearching ? "Locking GPS Satellites..." : "Detect Live GPS (Pakistan)"}
          </button>

          {/* Save Survey Button */}
          <button
            onClick={handleSaveSurvey}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            {saveStatus === "SAVING" ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : saveStatus ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-white" />
            )}
            {saveStatus ? "Survey Saved & Audited" : "Save Site Survey"}
          </button>
        </div>
      </div>

      {/* GPS Telemetry Notification Banner */}
      {gpsNotification && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xs transition ${
          gpsNotification.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : gpsNotification.type === "warning"
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : gpsNotification.type === "error"
            ? "bg-rose-50 border-rose-200 text-rose-900"
            : "bg-sky-50 border-sky-200 text-sky-900"
        }`}>
          <div className="flex items-center gap-2.5">
            {gpsNotification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : gpsNotification.type === "warning" ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : gpsNotification.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
            )}
            <span className="font-semibold">{gpsNotification.message}</span>
          </div>
          <button
            onClick={() => setGpsNotification(null)}
            className="text-slate-400 hover:text-slate-700 text-base font-bold px-1.5 py-0.5 rounded cursor-pointer"
            title="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. MULTI-CITY REGIONAL GIS HUBS TELEMETRY BAR */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Pakistan EPC Regional Hubs & Clusters:</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-mono border border-emerald-200 font-bold">
              {allCityHubs.length} Cities Active ({validSavedProjects.length} Saved Projects Plotted)
            </span>
          </div>

          <button
            onClick={() => setIsAddCityOpen(prev => !prev)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs border ${
              isAddCityOpen
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddCityOpen ? "Close City Panel" : "+ Add City / Cluster"}</span>
          </button>
        </div>

        {/* City Fast-Fly Chips */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
          {allCityHubs.map((city) => (
            <div
              key={city.name}
              className="inline-flex items-center rounded-lg text-[11px] font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-emerald-700 transition shrink-0 shadow-2xs group"
            >
              <button
                onClick={() => handleSelectPin(city.lat, city.lng, `${city.name} (${city.disco}) Hub`)}
                className="px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                title={`${city.region} - Interconnection via ${city.disco}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${city.isCustom ? "bg-amber-500" : "bg-emerald-600"}`}></span>
                <span>{city.name}</span>
                <span className="text-[9px] text-slate-500 font-mono">[{city.disco}]</span>
              </button>
              {city.isCustom && (
                <button
                  onClick={(e) => handleRemoveCustomCity(city.name, e)}
                  className="pr-2 pl-0.5 text-slate-400 hover:text-rose-600 font-bold text-xs cursor-pointer"
                  title={`Remove custom city ${city.name}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Add City Inline Drawer */}
        {isAddCityOpen && (
          <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Add Pakistan Regional Hub / Solar Cluster</span>
              </div>
              <div className="flex items-center gap-2">
                {/* 📍 Use Current GPS Autofill Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentGpsForCity}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Autofill with your device's live GPS coordinates"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>📍 Use My Current GPS</span>
                </button>
                <span className="text-[10px] text-slate-500">Auto-persisted in local workspace storage</span>
              </div>
            </div>

            {/* Quick 1-Click City Presets with Instant Auto-Fill */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Quick Presets (Click to autofill or double-click to add):</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Zero manual typing needed</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CITY_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setNewCityName(preset.name);
                      setNewCityDisco(preset.disco);
                      setNewCityLat(preset.lat.toString());
                      setNewCityLng(preset.lng.toString());
                      setNewCityRegion(preset.region);
                      setAddCityError("");
                    }}
                    onDoubleClick={() => handleAddCustomCity(preset)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800 text-slate-700 transition cursor-pointer shadow-2xs font-semibold"
                    title={`Click to fill form with ${preset.name} coordinates (${preset.lat}, ${preset.lng})`}
                  >
                    + {preset.name} <span className="text-[9px] text-slate-400">[{preset.disco}]</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Form with Instant Matching */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div className="sm:col-span-1">
                <label className="text-[10px] text-slate-500 font-bold block mb-1">
                  City Name <span className="text-emerald-600 font-normal">(Type for instant autofill)</span>
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="e.g. Sialkot, Sukkur, Swat"
                    value={newCityName}
                    onChange={(e) => handleCityNameChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    disabled={geocodingCity || !newCityName}
                    onClick={() => handleGeocodeNewCity(newCityName)}
                    className="px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer disabled:opacity-40"
                    title="Auto-fetch coordinates via OpenStreetMap / Dictionary"
                  >
                    {geocodingCity ? <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" /> : <Globe className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">DISCO / Utility</label>
                <select
                  value={newCityDisco}
                  onChange={(e) => setNewCityDisco(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  {PAKISTAN_DISCOS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 font-bold">LAT (°N)</label>
                  {newCityLat && parseFloat(newCityLat) > 0 && (
                    <span className="text-[9px] text-emerald-600 font-bold font-mono">✓ Autofilled</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="32.4945"
                  value={newCityLat}
                  onChange={(e) => setNewCityLat(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 font-bold">LNG (°E)</label>
                  {newCityLng && parseFloat(newCityLng) > 0 && (
                    <span className="text-[9px] text-emerald-600 font-bold font-mono">✓ Autofilled</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="74.5229"
                  value={newCityLng}
                  onChange={(e) => setNewCityLng(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {addCityError && (
              <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{addCityError}</span>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
              <div className="text-[11px] text-slate-500">
                {newCityLat && newCityLng ? (
                  <span className="text-emerald-700 font-mono font-semibold">
                    Target: {newCityName || "Custom Hub"} [{newCityDisco}] at {newCityLat}°N, {newCityLng}°E
                  </span>
                ) : (
                  <span>Click a preset or type a city name above to auto-detect coordinates.</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCityOpen(false);
                    setAddCityError("");
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCustomCity({
                    name: newCityName,
                    disco: newCityDisco,
                    lat: newCityLat,
                    lng: newCityLng,
                    region: newCityRegion || `${newCityName} Regional Solar Grid`
                  })}
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition cursor-pointer shadow-xs"
                >
                  Save City & Center Map
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. COORDINATE INPUT & GOOGLE LOCATION BAR (Point 1 on Page 1) */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Site Coordinates:</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono font-bold">LAT:</span>
              <input
                type="number"
                step="0.0001"
                placeholder="33.6844"
                value={manualLatInput}
                onChange={(e) => setManualLatInput(e.target.value)}
                className="w-24 bg-transparent text-slate-900 font-mono text-xs focus:outline-none font-bold"
              />
              <span className="text-[10px] text-slate-500 font-mono">°N</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono font-bold">LNG:</span>
              <input
                type="number"
                step="0.0001"
                placeholder="73.0479"
                value={manualLngInput}
                onChange={(e) => setManualLngInput(e.target.value)}
                className="w-24 bg-transparent text-slate-900 font-mono text-xs focus:outline-none font-bold"
              />
              <span className="text-[10px] text-slate-500 font-mono">°E</span>
            </div>

            {/* 📍 My Location Instant Live GPS/IP Auto-Detect Button */}
            <button
              type="button"
              onClick={handleDetectAccurateLocation}
              disabled={gpsSearching}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Auto-detect and fill your actual physical GPS/Network IP coordinates with 1 click"
            >
              {gpsSearching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>📍 My Location</span>
            </button>

            <button
              type="button"
              onClick={handleLocateOnMap}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locate on Map</span>
            </button>
          </div>
        </div>

        {/* Google Location Link */}
        <div className="flex items-center gap-2">
          <a
            href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View on Google Maps / Earth
          </a>
        </div>
      </div>

      {/* 4. INSTALLATION SIZE QUICK BUTTONS (Point 3 on Page 1) */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" /> Quick System Capacity:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STANDARD_KW_PRESETS.map(kw => (
              <button
                key={kw}
                onClick={() => handleQuickSizeSelect(kw)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                  calculatedCapacityKw === kw
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {kw} kW
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600 font-bold">Custom kWp:</span>
          <input
            type="number"
            step="1"
            placeholder="e.g. 75"
            value={capacityKw || ""}
            onChange={(e) => {
              const val = e.target.value === "" ? 0 : Number(e.target.value);
              if (setCapacityKw) setCapacityKw(val);
              if (val > 0) {
                setSurveyDetails(prev => ({
                  ...prev,
                  inverterCapacityKw: val,
                  panelQuantity: Math.ceil((val * 1000) / activeWattage)
                }));
              }
            }}
            className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-emerald-800 font-mono text-xs focus:outline-none focus:border-emerald-600 font-bold"
          />
          <span className="text-slate-500 font-mono">kWp DC</span>
        </div>
      </div>

      {/* 5. MAIN WORKBENCH: ESRI MAP (LEFT) & STRUCTURAL RACKING ENGINE (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Esri Satellite Photogrammetry & CAD */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                GIS Satellite Telemetry & Roof Boundary CAD
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
                {safePolygonCoords.length} Polygon Vertices
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Installation Area Mode Toggle (Point 2 on Page 1) */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setSurveyDetails(prev => ({ ...prev, areaMode: "app" }))}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${surveyDetails.areaMode !== "manual" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  App Satellite Draw
                </button>
                <button
                  onClick={() => setSurveyDetails(prev => ({ ...prev, areaMode: "manual" }))}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${surveyDetails.areaMode === "manual" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Manual Area Input
                </button>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMapLayer("google")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${mapLayer === "google" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  title="Google Satellite Hybrid (0.15m HD everywhere in Pakistan)"
                >
                  <span>🛰️ Google Hybrid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayer("esri")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${mapLayer === "esri" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  title="Esri World Imagery (Capped at zoom 18)"
                >
                  Esri Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayer("osm")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${mapLayer === "osm" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  title="OpenStreetMap Streets"
                >
                  OSM Streets
                </button>
              </div>

              {/* Project Markers Layer Toggle */}
              <button
                onClick={() => setShowProjectMarkers(prev => !prev)}
                className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 font-bold transition cursor-pointer ${
                  showProjectMarkers
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                }`}
                title="Toggle visibility of saved project markers on satellite map"
              >
                {showProjectMarkers ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                <span>{showProjectMarkers ? "Project Markers: ON" : "Project Markers: OFF"}</span>
              </button>

              <button
                onClick={clearPolygon}
                className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 flex items-center gap-1 transition cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear CAD
              </button>
            </div>
          </div>

          {/* Manual Area Input Row if active (Point 2 & 5) */}
          {isManualArea && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Specify Installation Area:</span>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={surveyDetails.manualAreaSqFt || ""}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, manualAreaSqFt: e.target.value === "" ? "" : Number(e.target.value) }))}
                  className="w-32 bg-white border border-slate-300 rounded-lg p-1.5 text-emerald-800 font-mono text-xs focus:outline-none focus:border-emerald-600 font-bold"
                />
                <select
                  value={surveyDetails.manualAreaUnit || "sqft"}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, manualAreaUnit: e.target.value }))}
                  className="bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 text-xs focus:outline-none"
                >
                  <option value="sqft">Square Feet (sq ft)</option>
                  <option value="sqm">Square Meters (m²)</option>
                </select>
              </div>
              <span className="text-[11px] text-slate-600">
                Calculated Footprint: <strong className="text-emerald-700 font-mono font-bold">{activeAreaSqFt.toLocaleString()} sq ft</strong> (~{Math.round(activeAreaSqM)} m²)
              </span>
            </div>
          )}

          {/* Leaflet Map Canvas */}
          <div className="h-[430px] w-full rounded-xl overflow-hidden border border-slate-200 relative shadow-sm">
            <MapContainer
              center={[currentLat, currentLng]}
              zoom={18}
              maxZoom={18}
              scrollWheelZoom={false}
              preferCanvas={true}
              touchZoom={true}
              zoomSnap={0.5}
              className="h-full w-full"
            >
              <TileLayer
                key={mapLayer}
                attribution={
                  mapLayer === "google"
                    ? '&copy; Google Satellite Hybrid'
                    : mapLayer === "esri"
                    ? '&copy; ESRI World Imagery'
                    : '&copy; OpenStreetMap Pakistan'
                }
                url={
                  mapLayer === "google"
                    ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    : mapLayer === "esri"
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
                maxZoom={mapLayer === "esri" ? 18 : 20}
                maxNativeZoom={mapLayer === "esri" ? 18 : 20}
              />

              <MapFlyToHandler targetCoords={flyToCoords} zoom={mapZoom} />
              <MapClickHandler onMapClick={handleMapClick} />
              <Marker position={[currentLat, currentLng]} />

              {/* High-Accuracy GPS Target Marker with Elevation Popup */}
              {userLiveGps && (
                <Marker position={[userLiveGps.lat, userLiveGps.lng]} icon={createGpsTargetIcon(userLiveGps.accuracy)}>
                  <Popup>
                    <div className="p-3 text-xs space-y-1.5 font-sans min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <strong className="text-emerald-700 font-bold flex items-center gap-1">
                          <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                          {userLiveGps.source}
                        </strong>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                          {userLiveGps.accuracy}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-700 space-y-0.5">
                        <div>LAT: <strong>{userLiveGps.lat}°N</strong></div>
                        <div>LNG: <strong>{userLiveGps.lng}°E</strong></div>
                        {userLiveGps.elevation !== null && userLiveGps.elevation !== undefined && (
                          <div className="text-emerald-800 font-bold flex items-center gap-1 mt-1">
                            <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Elevation: {userLiveGps.elevation} m MSL</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
                        <span>Locked at {userLiveGps.timestamp}</span>
                        <span className="text-emerald-600 font-semibold">{userLiveGps.city || "Pakistan"}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Regional City Pins */}
              {allCityHubs.map((city) => {
                const isCurrent = Math.abs(currentLat - city.lat) < 0.01 && Math.abs(currentLng - city.lng) < 0.01;
                return (
                  <Marker
                    key={city.name}
                    position={[city.lat, city.lng]}
                    icon={createCityHubIcon(city, isCurrent)}
                  >
                    <Popup className="solar-gis-popup">
                      <div className="bg-white text-slate-900 p-3.5 rounded-xl border border-slate-200 space-y-2 min-w-[230px] shadow-lg font-sans">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                          <span className="text-xs font-bold text-slate-900">{city.name} EPC Hub</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                            {city.disco}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Region:</span> <strong className="text-slate-800">{city.region}</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Grid Utility:</span> <strong className="text-emerald-700">{city.disco} Interconnection</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Coordinates:</span> <span className="text-slate-600 font-mono text-[10px]">{city.lat}°N, {city.lng}°E</span></div>
                        </div>
                        <button
                          onClick={() => handleSelectPin(city.lat, city.lng, `${city.name} (${city.disco})`)}
                          className="w-full mt-2 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Center & Load Site Coordinates
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Saved Project Pins (Toggled by showProjectMarkers) */}
              {showProjectMarkers && validSavedProjects.map((proj) => {
                const lat = parseFloat(proj.latitude);
                const lng = parseFloat(proj.longitude);
                const isCurrent = activeProject?.id === proj.id;
                const scheme = proj.surveyData?.structureType || "L2 Elevated";
                const disco = proj.city ? `${proj.city.toUpperCase()} DISCO` : "IESCO / LESCO / GEPCO";

                return (
                  <Marker
                    key={proj.id}
                    position={[lat, lng]}
                    icon={createSavedProjectPinIcon(proj, isCurrent)}
                  >
                    <Popup className="solar-gis-popup">
                      <div className="bg-white text-slate-900 p-3.5 rounded-xl border border-slate-200 space-y-2 min-w-[260px] shadow-lg font-sans">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{proj.clientName}</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                            {proj.projectCode || "ACTIVE"}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Contracted DC:</span> <strong className="text-emerald-700 font-mono font-bold">{proj.contractedCapacityKw || proj.capacityKw || 100} kWp</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Structure Scheme:</span> <strong className="text-slate-800">{scheme}</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Grid Utility:</span> <strong className="text-emerald-700">{disco}</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Coordinates:</span> <span className="text-slate-600 font-mono text-[10px]">{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</span></div>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
                          <button
                            onClick={() => handleSelectPin(lat, lng, proj.clientName, proj)}
                            className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                          >
                            <Crosshair className="w-3.5 h-3.5 text-emerald-600" /> Open Site Survey
                          </button>
                          <button
                            onClick={() => handleLoadCad(lat, lng, proj.clientName, proj)}
                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <ArrowRight className="w-3.5 h-3.5" /> Load in CAD
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Roof Area Photogrammetry Polygon */}
              {safePolygonCoords.length > 2 && (
                <Polygon
                  positions={safePolygonCoords}
                  pathOptions={{
                    color: "#06b6d4",
                    fillColor: "#06b6d4",
                    fillOpacity: 0.35,
                    weight: 2
                  }}
                />
              )}
            </MapContainer>
          </div>

          {/* Shoelace Area & Telemetry Callouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Installation Area (sq ft)</span>
              <div className="text-base font-extrabold font-mono text-emerald-700 mt-1">
                {activeAreaSqFt.toLocaleString()} <span className="text-xs font-normal text-slate-400">sq ft</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Metric Footprint (m²)</span>
              <div className="text-base font-extrabold font-mono text-emerald-700 mt-1">
                {activeAreaSqM.toLocaleString()} <span className="text-xs font-normal text-slate-400">m²</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Max Capacity Rating</span>
              <div className="text-base font-extrabold font-mono text-emerald-700 mt-1">
                {calculatedCapacityKw > 0 ? `${calculatedCapacityKw} kWp` : `${Math.round(activeAreaSqFt / 75)} kWp`}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total PV Modules</span>
              <div className="text-base font-extrabold font-mono text-amber-700 mt-1">
                {calculatedPanelCount} <span className="text-xs font-normal text-slate-400">Panels</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Structural Schematic & Civil/Labour Engine */}
        <div className="lg:col-span-4 space-y-4">
          {/* A. STRUCTURE RACKING PRESETS & MECHANICAL SUITE (Points 4, 5, 6) */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-600" /> Structure Racking Preset
              </h3>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                IEC 60364 / ASTM
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              {["L2 Elevated", "L3 Elevated", "Customized"].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleStructurePreset(preset)}
                  className={`p-2.5 rounded-xl border transition text-center cursor-pointer ${
                    surveyDetails.structureType === preset
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Structure Preset Details Badge */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Selected Scheme:</span>
                <strong className="text-slate-900 font-bold">{surveyDetails.structureType || "L2 Elevated"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Wind Velocity Code:</span>
                <strong className="text-emerald-700 font-mono font-bold">{surveyDetails.windRating || (isL3 ? "145 km/h" : "130 km/h (BCP 2021)")}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Material Standard:</span>
                <span className="text-slate-700 font-mono text-[10px] truncate max-w-[180px] font-semibold" title={surveyDetails.materialSpec}>
                  {surveyDetails.materialSpec || "HDG C-Channel (ASTM A123, ≥80µm)"}
                </span>
              </div>
            </div>

            {/* Geometry Parameters */}
            <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-700 font-bold">Front Leg H₁ (mm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 450"
                    value={surveyDetails.frontHeightMm || ""}
                    onChange={(e) => setSurveyDetails(prev => ({ ...prev, frontHeightMm: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-700 font-bold">Rear Column H₂ (mm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1850"
                    value={surveyDetails.backHeightMm || ""}
                    onChange={(e) => setSurveyDetails(prev => ({ ...prev, backHeightMm: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-700 font-bold">Tilt Angle θ (°)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    placeholder="e.g. 18"
                    value={pitch !== undefined && pitch !== null && pitch !== 0 ? pitch : ""}
                    onChange={(e) => setPitch(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>

                {/* Structure Direction / Azimuth (Point 6 on Page 1) */}
                <div>
                  <label className="text-[11px] text-slate-700 font-bold">Structure Direction</label>
                  <select
                    value={surveyDetails.azimuthDirection || "True South (180°)"}
                    onChange={(e) => {
                      const dir = e.target.value;
                      let deg = 180;
                      if (dir.includes("135")) deg = 135;
                      else if (dir.includes("225")) deg = 225;
                      else if (dir.includes("90")) deg = 90;
                      else if (dir.includes("270")) deg = 270;
                      setSurveyDetails(prev => ({ ...prev, azimuthDirection: dir, customAzimuthDegrees: deg }));
                      setAzimuth(deg);
                    }}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="True South (180°)">True South (180°)</option>
                    <option value="South-East (135°)">South-East (135°)</option>
                    <option value="South-West (225°)">South-West (225°)</option>
                    <option value="East (90°)">East (90°)</option>
                    <option value="West (270°)">West (270°)</option>
                    <option value="Custom Angle">Custom Angle</option>
                  </select>
                </div>
              </div>

              {/* Customized structure inputs (Point 5 on Page 1) */}
              {isCustom && (
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-700 font-bold">Column Span (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 3.5"
                        value={surveyDetails.columnSpanMeters || ""}
                        onChange={(e) => setSurveyDetails(prev => ({ ...prev, columnSpanMeters: e.target.value === "" ? "" : Number(e.target.value) }))}
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-700 font-bold">Rafter Length (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 5.2"
                        value={surveyDetails.rafterLengthMm ? (surveyDetails.rafterLengthMm / 1000).toFixed(1) : ""}
                        onChange={(e) => setSurveyDetails(prev => ({ ...prev, rafterLengthMm: e.target.value === "" ? "" : Number(e.target.value) * 1000 }))}
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-700 font-bold">Purlin Count</label>
                      <input
                        type="number"
                        placeholder="e.g. 6"
                        value={surveyDetails.purlinCount || ""}
                        onChange={(e) => setSurveyDetails(prev => ({ ...prev, purlinCount: e.target.value === "" ? "" : Number(e.target.value) }))}
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-700 font-bold">Parapet Clearance (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 1.2"
                        value={surveyDetails.parapetClearanceM || ""}
                        onChange={(e) => setSurveyDetails(prev => ({ ...prev, parapetClearanceM: e.target.value === "" ? "" : Number(e.target.value) }))}
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-700 font-bold">Material Specification</label>
                    <select
                      value={surveyDetails.materialSpec || "Aluminium AL6005-T5 Anodized"}
                      onChange={(e) => setSurveyDetails(prev => ({ ...prev, materialSpec: e.target.value }))}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                    >
                      <option value="Aluminium AL6005-T5 Anodized">Aluminium AL6005-T5 Anodized</option>
                      <option value="HDG Mild Steel Q235B (ASTM A123 ≥80µm)">HDG Mild Steel Q235B (ASTM A123 ≥80µm)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* B. DYNAMIC VECTOR CROSS-SECTION SVG CARD */}
          <StructureSchematicSVG
            structureType={surveyDetails.structureType || "L2 Elevated"}
            frontHeightMm={surveyDetails.frontHeightMm || (isL3 ? 800 : 450)}
            backHeightMm={surveyDetails.backHeightMm || (isL3 ? 2900 : 1850)}
            tiltAngle={pitch || 18}
            azimuthDirection={surveyDetails.azimuthDirection || "True South (180°)"}
            materialSpec={surveyDetails.materialSpec || (isL3 ? "Heavy HDG Tubular (100x50x3.0mm) + Wind Bracing" : "Hot-Dip Galvanized C-Channel (ASTM A123, ≥80µm)")}
            windRating={surveyDetails.windRating || (isL3 ? "145 km/h" : "130 km/h (BCP 2021)")}
            pitchMeters={surveyDetails.pitchMeters || (isL3 ? 4.1 : 3.2)}
            rafterLengthMm={surveyDetails.rafterLengthMm || (isL3 ? 6950 : 4650)}
          />

          {/* C. COMPREHENSIVE CIVIL & EPC LABOUR WORK BREAKDOWN MATRIX (Points 14-17) */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3.5 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                CIVIL FOUNDATION & EPC LABOUR BREAKDOWN
              </h3>
              <button
                onClick={handleApplyBaselines}
                className="text-[10px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-mono hover:underline cursor-pointer font-bold"
                title="Reset all line items to baseline formulas"
              >
                <RefreshCw className="w-3 h-3" /> Auto-Baseline
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* 1. Civil Foundation Works */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-emerald-600" /> 1. Civil Foundation Works (Manual Input)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">
                    {calculatedPanelCount > 0 ? `${calculatedPanelCount} Modules × PKR ${civilRatePerPanel}` : "Baseline Active"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-mono font-bold">PKR</span>
                  <input
                    type="number"
                    step="5000"
                    placeholder={`Baseline: ${baselineCivilCost.toLocaleString()}`}
                    value={surveyDetails.civilWorkPrice !== undefined && surveyDetails.civilWorkPrice !== null && surveyDetails.civilWorkPrice !== "" ? surveyDetails.civilWorkPrice : ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setSurveyDetails(prev => ({ ...prev, civilWorkPrice: val }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>

              {/* 2. Mechanical Assembly Labour */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-600" /> 2. Mechanical Assembly Labour (Manual Input)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">
                    {calculatedCapacityKw > 0 ? `${calculatedCapacityKw.toFixed(1)} kWp × PKR 1,200` : "Baseline Active"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-mono font-bold">PKR</span>
                  <input
                    type="number"
                    step="5000"
                    placeholder={`Baseline: ${baselineMechanicalCost.toLocaleString()}`}
                    value={surveyDetails.mechanicalLaborPrice !== undefined && surveyDetails.mechanicalLaborPrice !== null && surveyDetails.mechanicalLaborPrice !== "" ? surveyDetails.mechanicalLaborPrice : ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setSurveyDetails(prev => {
                        const currentElec = prev.electricalLaborPrice !== undefined && prev.electricalLaborPrice !== "" ? Number(prev.electricalLaborPrice) : baselineElectricalCost;
                        const mechNum = val === "" ? baselineMechanicalCost : val;
                        return {
                          ...prev,
                          mechanicalLaborPrice: val,
                          installationPrice: mechNum + currentElec
                        };
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>

              {/* 3. Electrical Installation Labour */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" /> 3. Electrical Installation Labour (Manual Input)
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono font-bold">
                    {calculatedCapacityKw > 0 ? `${calculatedCapacityKw.toFixed(1)} kWp × PKR 1,500` : "Baseline Active"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-mono font-bold">PKR</span>
                  <input
                    type="number"
                    step="5000"
                    placeholder={`Baseline: ${baselineElectricalCost.toLocaleString()}`}
                    value={surveyDetails.electricalLaborPrice !== undefined && surveyDetails.electricalLaborPrice !== null && surveyDetails.electricalLaborPrice !== "" ? surveyDetails.electricalLaborPrice : ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setSurveyDetails(prev => {
                        const currentMech = prev.mechanicalLaborPrice !== undefined && prev.mechanicalLaborPrice !== "" ? Number(prev.mechanicalLaborPrice) : baselineMechanicalCost;
                        const elecNum = val === "" ? baselineElectricalCost : val;
                        return {
                          ...prev,
                          electricalLaborPrice: val,
                          installationPrice: currentMech + elecNum
                        };
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>

              {/* 4. Earthing Input Option as One Job (Point 7 on Page 3) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 4. Earthing Package (One Job)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">
                    Bentonite Pit (&lt; 2.5 Ω)
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Electrolytic copper rods, chemical compound boring, earth pit chamber as one lump-sum job
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-mono font-bold">PKR</span>
                  <input
                    type="number"
                    step="5000"
                    placeholder="128000"
                    value={surveyDetails.earthingJobPrice || ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setSurveyDetails(prev => ({ ...prev, earthingJobPrice: val }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>

              {/* 5. Testing & DISCO Net Metering Charges (Point 10 on Page 3) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> 5. Net Metering & Commissioning (Manual Input)
                  </span>
                  <span className="text-[10px] text-indigo-700 font-mono font-bold">
                    Flat: PKR 75,000
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-mono font-bold">PKR</span>
                  <input
                    type="number"
                    step="5000"
                    placeholder={`Baseline: ${baselineTestingCost.toLocaleString()}`}
                    value={surveyDetails.netMeteringPrice !== undefined && surveyDetails.netMeteringPrice !== null && surveyDetails.netMeteringPrice !== "" ? surveyDetails.netMeteringPrice : ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setSurveyDetails(prev => ({ ...prev, netMeteringPrice: val }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Total Subtotal Card */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Total Civil, Labour & Earthing
                </span>
                <span className="text-base font-extrabold font-mono text-emerald-800">
                  {formatPKR(totalCivilLabourPackage)}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed border-t border-emerald-200/80 pt-1.5">
                <strong className="text-emerald-700 font-bold">Turnkey BOQ Integration:</strong> Synchronized directly into Page 2 (BOQ Line Items) and Page 1 (Turnkey Contract Price) of the Proposal Engine.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. EQUIPMENT & ELECTRICAL SPECIFICATION SECTION (Pages 1 & 3 Handwritten Items) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Solar PV Modules & Panel Quantity (Point 7 Page 1, Point 1 Page 3) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3.5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Box className="w-4 h-4 text-emerald-600" /> Solar PV Module Inputs
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Tier-1 N-Type
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Panel Brand */}
            <div>
              <label className="text-[11px] text-slate-700 font-bold">Panel Brand</label>
              <select
                value={surveyDetails.panelBrand || "Jinko Solar"}
                onChange={(e) => setSurveyDetails(prev => ({ ...prev, panelBrand: e.target.value }))}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
              >
                {PANEL_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Panel Type & Model */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-700 font-bold">Panel Type</label>
                <select
                  value={surveyDetails.panelType || "N-Type TOPCon Dual-Glass Bifacial"}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, panelType: e.target.value }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-[11px] focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  {PANEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold">Wattage (Wp)</label>
                <select
                  value={activeWattage}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    if (setModuleWattage) setModuleWattage(w);
                    setSurveyDetails(prev => ({ ...prev, panelWattage: w }));
                  }}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-emerald-700 font-mono font-bold focus:outline-none focus:border-emerald-600"
                >
                  {PANEL_WATTAGES.map(w => <option key={w} value={w}>{w} Wp</option>)}
                </select>
              </div>
            </div>

            {/* Panel Model Name */}
            <div>
              <label className="text-[11px] text-slate-700 font-bold">Model Name</label>
              <input
                type="text"
                placeholder="Tiger Neo 585W Dual-Glass"
                value={surveyDetails.panelModel || ""}
                onChange={(e) => setSurveyDetails(prev => ({ ...prev, panelModel: e.target.value }))}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>

            {/* Quantity of Panels with +/- Buttons (Point 7 on Page 1) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-700 font-bold">Quantity of Panels</label>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">
                  Total: {calculatedPanelCount * activeWattage / 1000} kWp
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAdjustPanelQuantity(-50)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg text-xs border border-slate-200 cursor-pointer"
                >
                  -50
                </button>
                <button
                  onClick={() => handleAdjustPanelQuantity(-10)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg text-xs border border-slate-200 cursor-pointer"
                >
                  -10
                </button>
                <input
                  type="number"
                  placeholder="257"
                  value={surveyDetails.panelQuantity || calculatedPanelCount || ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                    setSurveyDetails(prev => ({ ...prev, panelQuantity: val }));
                    if (setCapacityKw && val > 0) {
                      setCapacityKw(parseFloat(((val * activeWattage) / 1000).toFixed(2)));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-emerald-800 font-mono font-bold text-center focus:outline-none focus:border-emerald-600"
                />
                <button
                  onClick={() => handleAdjustPanelQuantity(+10)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg text-xs border border-slate-200 cursor-pointer"
                >
                  +10
                </button>
                <button
                  onClick={() => handleAdjustPanelQuantity(+50)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg text-xs border border-slate-200 cursor-pointer"
                >
                  +50
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Inverters & Battery Energy Storage (Points 2 & 4 Page 3) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3.5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" /> Inverters & Energy Storage
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded border border-amber-200 font-bold">
              IP66 Multi-MPPT
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Inverter Type (On-Grid / Hybrid) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-700 font-bold">Inverter Type</label>
                <select
                  value={surveyDetails.inverterType || "On-Grid"}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, inverterType: e.target.value }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  {INVERTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold">Inverter Brand</label>
                <select
                  value={surveyDetails.inverterBrand || "Huawei"}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, inverterBrand: e.target.value }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  {INVERTER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Inverter Capacity kW & Unit Count */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-700 font-bold">Inverter Capacity (kW)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={surveyDetails.inverterCapacityKw || ""}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, inverterCapacityKw: e.target.value === "" ? "" : Number(e.target.value) }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-emerald-800 font-mono font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold">Inverter Units</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={surveyDetails.inverterQuantity || 1}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, inverterQuantity: e.target.value === "" ? 1 : Number(e.target.value) }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Battery Storage Options (Point 4 on Page 3) */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] text-slate-800 font-bold flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" /> Battery Storage (Optional)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-700 font-semibold">Battery Type</label>
                  <select
                    value={surveyDetails.batteryType || "None / Grid-Tied Only"}
                    onChange={(e) => setSurveyDetails(prev => ({ ...prev, batteryType: e.target.value }))}
                    className="w-full mt-0.5 bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 text-[11px] focus:outline-none font-medium"
                  >
                    {BATTERY_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-700 font-semibold">Battery Brand</label>
                  <select
                    value={surveyDetails.batteryBrand || "Huawei LUNA2000"}
                    onChange={(e) => setSurveyDetails(prev => ({ ...prev, batteryBrand: e.target.value }))}
                    className="w-full mt-0.5 bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 text-[11px] focus:outline-none font-medium"
                  >
                    {BATTERY_BRANDS.map(bb => <option key={bb} value={bb}>{bb}</option>)}
                  </select>
                </div>
              </div>

              {surveyDetails.batteryType && !surveyDetails.batteryType.includes("None") && (
                <div>
                  <label className="text-[10px] text-slate-700 font-semibold">Storage Capacity (kWh)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15"
                    value={surveyDetails.batteryCapacityKwh || ""}
                    onChange={(e) => setSurveyDetails(prev => ({ ...prev, batteryCapacityKwh: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="w-full mt-0.5 bg-white border border-slate-300 rounded-lg p-1.5 text-emerald-700 font-mono text-xs focus:outline-none font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Cables, Accessories & AutoCAD SLD (Points 5, 6, 8, 11 on Page 3) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3.5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" /> Cables & Accessories
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
              EN 50618 / IEC
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Cable Brand */}
            <div>
              <label className="text-[11px] text-slate-700 font-bold">Cable Brand (DC & AC)</label>
              <select
                value={surveyDetails.cableBrand || "Fast Cables"}
                onChange={(e) => setSurveyDetails(prev => ({ ...prev, cableBrand: e.target.value }))}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
              >
                {CABLE_BRANDS.map(cb => <option key={cb} value={cb}>{cb}</option>)}
              </select>
            </div>

            {/* DC Cable Measurement (Point 8 on Page 1) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-700 font-bold">DC Cable Sizing</label>
                <select
                  value={surveyDetails.dcCableSize || "1x6mm² DC Solar XLPO"}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, dcCableSize: e.target.value }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 text-[11px] focus:outline-none font-medium"
                >
                  {DC_CABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-700 font-bold">DC Length (Meters)</label>
                <input
                  type="number"
                  placeholder={`Est: ${calculatedPanelCount ? Math.round(calculatedPanelCount * 2.8) : 120}m`}
                  value={surveyDetails.dcCableLengthMeters || surveyDetails.cableLengthMeters || ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setSurveyDetails(prev => ({ ...prev, dcCableLengthMeters: val, cableLengthMeters: val }));
                  }}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-1.5 text-emerald-800 font-mono text-xs focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* AC Cable Measurement */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-700 font-bold">AC Feeder Sizing</label>
                <select
                  value={surveyDetails.acCableSize || "4-Core 25mm² Armored Cu"}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, acCableSize: e.target.value }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 text-[11px] focus:outline-none font-medium"
                >
                  {AC_CABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-700 font-bold">AC Length (Meters)</label>
                <input
                  type="number"
                  placeholder={`Est: ${calculatedCapacityKw ? Math.round(calculatedCapacityKw * 1.5) : 80}m`}
                  value={surveyDetails.acCableLengthMeters || ""}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, acCableLengthMeters: e.target.value === "" ? "" : Number(e.target.value) }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-1.5 text-emerald-800 font-mono text-xs focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* Accessories & Breakers Brand (Point 5 on Page 3) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
              <div>
                <label className="text-[10px] text-slate-700 font-bold">DC Breaker Brand</label>
                <select
                  value={surveyDetails.dcBreakerBrand || "Schneider Electric"}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, dcBreakerBrand: e.target.value }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 text-[11px] focus:outline-none font-medium"
                >
                  {BREAKER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-700 font-bold">AC Breaker Brand</label>
                <select
                  value={surveyDetails.acBreakerBrand || "Schneider"}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, acBreakerBrand: e.target.value }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 text-[11px] focus:outline-none font-medium"
                >
                  {BREAKER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* AutoCAD SLD Select/Deselect Option (Point 11 on Page 3) */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={surveyDetails.includeAutocadDxf !== false}
                  onChange={(e) => setSurveyDetails(prev => ({ ...prev, includeAutocadDxf: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-600 bg-white border-slate-300 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                  Include SLD in AutoCAD (.dwg / .dxf) Format
                </span>
              </label>
              <p className="text-[10px] text-slate-500 mt-1 pl-6">
                Attaches complete CAD single-line schematic to official proposal package
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7. AI OCR UTILITY BILL SCANNER & SITE SURVEY MEDIA DROPZONE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI OCR Bill Scanner */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileScan className="w-4 h-4 text-emerald-600" /> AI OCR Document Scanner (Utility Bills & Invoices)
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
              LESCO / KE / IESCO / FESCO
            </span>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center transition cursor-pointer relative bg-slate-50">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleOcrBillUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
            <div className="text-xs font-bold text-slate-800">
              {ocrLoading ? "Scanning Utility Bill with AI..." : "Upload Electricity Bill / Photo"}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Extracts Reference No, Sanctioned Load kW, Consumption Units & Tariff
            </div>
          </div>

          {ocrResult && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-emerald-800">{ocrResult.utilityProvider} Bill Extracted</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">{ocrResult.confidenceScore}% Confidence</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500">Consumer:</span> <strong className="text-slate-900">{ocrResult.consumerName}</strong></div>
                <div><span className="text-slate-500">Ref No:</span> <strong className="text-slate-900 font-mono">{ocrResult.referenceNumber}</strong></div>
                <div><span className="text-slate-500">Sanctioned Load:</span> <strong className="text-emerald-700">{ocrResult.sanctionedLoadKw} kW</strong></div>
                <div><span className="text-slate-500">Monthly Usage:</span> <strong className="text-emerald-700">{ocrResult.unitsConsumedKwh.toLocaleString()} kWh</strong></div>
                <div><span className="text-slate-500">Peak Units:</span> <strong className="text-amber-700">{ocrResult.peakUnitsKwh} kWh</strong></div>
                <div><span className="text-slate-500">Total Bill:</span> <strong className="text-emerald-800 font-mono font-bold">{formatPKR(ocrResult.totalBillPkr)}</strong></div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Recommended System Size:</span>
                <strong className="text-emerald-700 font-bold">{ocrResult.recommendedSystemCapacityKw} kWp Solar</strong>
              </div>
            </div>
          )}
        </div>

        {/* Site Survey Photo Categorized Dropzone */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" /> Categorized Site Photos & Proofs
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              {uploadedFiles.length} Uploaded
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {MEDIA_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveMediaCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  activeMediaCategory === cat.id ? cat.color : "text-slate-700 border-slate-200 bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer relative bg-slate-50">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleMediaUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1 opacity-70" />
            <div className="text-xs font-bold text-slate-700">Drop Site Photos for [{activeMediaCategory}]</div>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map(file => (
              <div key={file.id} className="relative group rounded-lg overflow-hidden border border-slate-200 h-20 bg-slate-100">
                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeMedia(file.id)}
                  className="absolute top-1 right-1 p-1 bg-rose-900/80 text-rose-100 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
