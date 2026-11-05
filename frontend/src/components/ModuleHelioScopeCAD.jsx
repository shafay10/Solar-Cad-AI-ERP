import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  MapPin, Compass, Box, Sliders, Zap, Sun, ShieldCheck,
  RefreshCw, Layers, SlidersHorizontal, AlertTriangle, CheckCircle2,
  Trash2, Plus, Eye, EyeOff, FileText, Download, RotateCcw,
  Sparkles, Calendar, Clock, BarChart3, TrendingUp, Cpu, Crosshair, Navigation,
  Square, Hand, BoxSelect, Maximize2, PenTool, CheckSquare, Building2, Package,
  ArrowRight, Move, Check
} from "lucide-react";
import L from "leaflet";
if (typeof window !== "undefined") { window.L = L; globalThis.L = L; }
import {
  MODULE_PHYSICAL_SPECS,
  calculateCentroid,
  calculateGeodesicArea,
  calculateWinterShadowSpacing,
  packModulesOnRoof,
  calculateSolarPosition,
  calculateObstacleShadow,
  calculateAutomatedStringing,
  simulateHelioScopeProduction,
  isPointInPolygon,
  latLngToMeters
} from "../services/helioscopeEngine.js";
import { formatPKR } from "../services/solarEngine.js";
import { buildInverterOptions, getInverterSpec } from "../services/catalogData.js";
import HelioScopeCanvasOverlay from "./HelioScopeCanvasOverlay.jsx";
import HelioScope3DView from "./HelioScope3DView.jsx";
import HelioScopeCatalog from "./HelioScopeCatalog.jsx";
import HelioScopeSiteSetup from "./HelioScopeSiteSetup.jsx";
import HelioScopeShadingAnalysis from "./HelioScopeShadingAnalysis.jsx";
import HelioScopeElectricalDesign from "./HelioScopeElectricalDesign.jsx";
import HelioScopeProductionReport from "./HelioScopeProductionReport.jsx";
import HelioScopeReportExport from "./HelioScopeReportExport.jsx";

// Regional Pakistani Solar Hubs (Default strictly to Pakistan)
const PAKISTAN_HUBS = [
  { name: "Islamabad (Capital)", lat: 33.6844, lng: 73.0479 },
  { name: "Lahore (Punjab)", lat: 31.5204, lng: 74.3587 },
  { name: "Karachi (Sindh)", lat: 24.8607, lng: 67.0011 },
  { name: "Multan (South Punjab)", lat: 30.1575, lng: 71.5249 },
  { name: "Faisalabad (Industrial)", lat: 31.4504, lng: 73.1350 },
  { name: "Peshawar (KPK)", lat: 34.0151, lng: 71.5249 },
  { name: "Quetta (Balochistan)", lat: 30.1798, lng: 66.9750 }
];

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

/**
 * ModuleHelioScopeCAD — v3.1 (Phase 2B)
 * ★ Shading tab merged with CAD map (sidebar compact panel + shared map)
 * ★ v3.1: simOverride prop — Shading tab pe CAD internal Sim OFF,
 *   sun position parent (Shading sliders) se aati hai → shadows live move
 * ★ v3.1: Shading tab pe panel click-to-remove band (accidental deletes khatam)
 */
export default function ModuleHelioScopeCAD({
  activeProject,
  surveyDetails,
  setSurveyDetails,
  capacityKw,
  setCapacityKw,
  moduleWattage,
  setModuleWattage,
  isLocked,
  onSyncWithBOQ
}) {
  // 1. HARD MAP LOCK & LEAFLET LIFECYCLE
  const mapRef = useRef(null);
  const map = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const tileLayerRef = useRef(null);
  const centroidMarkerRef = useRef(null);

  const [systemStats, setSystemStats] = useState({ modulesCount: 0, kwp: 0 });
  const [cachedPanels, setCachedPanels] = useState([]);

  const [activeCadTool, setActiveCadTool] = useState("MANUAL_INSPECT");
  const [viewportMode, setViewportMode] = useState("2D");
  const is3DMode = viewportMode === "3D";
  const setIs3DMode = (val) => setViewportMode(typeof val === "function" ? (val(viewportMode === "3D") ? "3D" : "2D") : (val ? "3D" : "2D"));
  const isDrawingMode = activeCadTool === "FIELD_SEGMENT" || activeCadTool === "ROOF_BOX" || activeCadTool === "OBSTACLE_CIRCLE";
  const [mapLayer, setMapLayer] = useState("esri");

  const defaultLat = activeProject?.latitude ? parseFloat(activeProject.latitude) : 33.6844;
  const defaultLng = activeProject?.longitude ? parseFloat(activeProject.longitude) : 73.0479;

  const [siteLat, setSiteLat] = useState(defaultLat);
  const [siteLng, setSiteLng] = useState(defaultLng);
  const [locationLabel, setLocationLabel] = useState(
    activeProject?.clientName ? activeProject.siteAddress || "Site Location" : "Islamabad, Pakistan"
  );
  const [isLocating, setIsLocating] = useState(false);
  const [visualPlateScale, setVisualPlateScale] = useState(1.0);
  const [showCentroidMarker, setShowCentroidMarker] = useState(false);

  // 2. Roof Boundary Coordinates
  const [roofPolygon, setRoofPolygon] = useState(() => {
    const raw = surveyDetails?.roofPolygonJson;
    if (Array.isArray(raw) && raw.length >= 3) return raw;
    if (raw && typeof raw === "object" && Array.isArray(raw.polygonCoords) && raw.polygonCoords.length >= 3) return raw.polygonCoords;
    return [];
  });
  const [activeDrawingPoints, setActiveDrawingPoints] = useState([]);
  const activePolygon = roofPolygon;
  const setActivePolygon = setRoofPolygon;
  const [placedPanels, setPlacedPanels] = useState([]);
  const cachedPanelsRef = useRef([]);
  const overlayRef = useRef(null);

  useEffect(() => {
    cachedPanelsRef.current = cachedPanels;
  }, [cachedPanels]);

  // Auto-Fill Rooftop Field Segment Helper (at current map center)
  const handleGenerateDefaultArray = useCallback((widthMeters = 20, heightMeters = 14) => {
    let lat = siteLat || defaultLat;
    let lng = siteLng || defaultLng;

    if (map.current) {
      try {
        const center = map.current.getCenter();
        if (center && isFinite(center.lat) && isFinite(center.lng)) {
          lat = center.lat;
          lng = center.lng;
        }
      } catch (err) {
        console.warn("Could not get map center:", err);
      }
    }

    const dLat = heightMeters / 111139;
    const dLng = widthMeters / (111139 * Math.cos((lat * Math.PI) / 180));
    const newPoly = [
      [lat + dLat / 2, lng - dLng / 2],
      [lat + dLat / 2, lng + dLng / 2],
      [lat - dLat / 2, lng + dLng / 2],
      [lat - dLat / 2, lng - dLng / 2]
    ];
    setGridOffset({ x: 0, y: 0 });
    setRoofPolygon(newPoly);
    setActiveDrawingPoints([]);
    setRemovedModuleIds(new Set());
    setActiveCadTool("MANUAL_INSPECT");
    if (map.current) {
      try {
        const bounds = L.latLngBounds(newPoly);
        map.current.fitBounds(bounds, { padding: [30, 30], animate: false, maxZoom: 21 });
        if (map.current.getZoom() < 19) {
          map.current.setZoom(19, { animate: false });
        }
      } catch (err) {
        console.warn("fitBounds error:", err);
      }
    }
  }, [siteLat, siteLng, defaultLat, defaultLng]);

  // 3. Keepouts / Obstacles
  const [keepouts, setKeepouts] = useState([]);
  const [newObstacleHeight, setNewObstacleHeight] = useState(2.0);
  const [newObstacleRadius, setNewObstacleRadius] = useState(1.5);

  // 4. Array Layout Settings (HelioScope Left Accordion State)
  const [selectedModuleKey, setSelectedModuleKey] = useState("Jinko Solar Tiger Neo 585W");
  const [rackingType, setRackingType] = useState("Fixed Tilt / Flush Mount");
  const [orientation, setOrientation] = useState("PORTRAIT");
  const [tiltDegrees, setTiltDegrees] = useState(18);
  const [azimuthDegrees, setAzimuthDegrees] = useState(180);
  const [setbackMeters, setSetbackMeters] = useState(0.5);

  // HelioScope Mechanical Controls & Racking State
  const [frameSizeUp, setFrameSizeUp] = useState(1);
  const [frameSizeWide, setFrameSizeWide] = useState(1);
  const [rowSpacingM, setRowSpacingM] = useState(0.65);
  const [moduleSpacingM, setModuleSpacingM] = useState(0.025);
  const [frameSpacingM, setFrameSpacingM] = useState(0.0);
  const [gridAlignment, setGridAlignment] = useState("CENTER");
  const [arrayScale, setArrayScale] = useState(1.0);
  const [clearTrigger, setClearTrigger] = useState(0);

  // Target Capacity & Draggable Array Anchor State
  const [targetCapacityMode, setTargetCapacityMode] = useState("AUTO_FIT");
  const [targetKwp, setTargetKwp] = useState(35);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const [isAdjustingPosition, setIsAdjustingPosition] = useState(false);

  // Electrical Layer toggle (strings/inverters overlay)
  const [showElectricalLayer, setShowElectricalLayer] = useState(false);

  // 5. Sun Shadow Simulator States
  const [solarHour, setSolarHour] = useState(12.0);
  const [dayOfYear, setDayOfYear] = useState(355);
  const [showShadows, setShowShadows] = useState(true);

  // 6. Manual Module Edits (Removed module IDs)
  const [removedModuleIds, setRemovedModuleIds] = useState(new Set());

  // 7. Active Tab
  const [cadSubTab, setCadSubTab] = useState("LAYOUT");

  // 8. Manual Panel Segments (user-added kW groups)
  const [manualKwInput, setManualKwInput] = useState(5);
  const [manualSegments, setManualSegments] = useState([]);

  // Local debounced slider states for zero main-thread lag
  const [localTilt, setLocalTilt] = useState(tiltDegrees);
  const [localAzimuth, setLocalAzimuth] = useState(azimuthDegrees);
  const [localSetback, setLocalSetback] = useState(setbackMeters);
  const [localSolarHour, setLocalSolarHour] = useState(solarHour);

  useEffect(() => { setLocalTilt(tiltDegrees); }, [tiltDegrees]);
  useEffect(() => { setLocalAzimuth(azimuthDegrees); }, [azimuthDegrees]);
  useEffect(() => { setLocalSetback(setbackMeters); }, [setbackMeters]);
  useEffect(() => { setLocalSolarHour(solarHour); }, [solarHour]);

  const sliderTimersRef = useRef({});
  const debounceSlider = useCallback((key, setter, val, delay = 50) => {
    if (sliderTimersRef.current[key]) {
      clearTimeout(sliderTimersRef.current[key]);
    }
    sliderTimersRef.current[key] = setTimeout(() => {
      setter(Number(val));
    }, delay);
  }, []);

  const handleTiltChange = useCallback((val) => {
    const num = Number(val);
    const sanitized = (!isNaN(num) && Number.isFinite(num)) ? num : 18;
    setLocalTilt(sanitized);
    setTiltDegrees(sanitized);
  }, []);

  const handleAzimuthChange = useCallback((val) => {
    const num = Number(val);
    const sanitized = (!isNaN(num) && Number.isFinite(num)) ? num : 180;
    setLocalAzimuth(sanitized);
    setAzimuthDegrees(sanitized);
  }, []);

  const handleSetbackChange = useCallback((val) => {
    const num = Number(val);
    setLocalSetback(num);
    debounceSlider("setback", setSetbackMeters, num, 50);
  }, [debounceSlider]);

  const handleSolarHourChange = useCallback((val) => {
    const num = Number(val);
    setLocalSolarHour(num);
    debounceSlider("solarHour", setSolarHour, num, 50);
  }, [debounceSlider]);

  // GPS Locate Handler
  const handleGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setSiteLat(lat);
        setSiteLng(lng);
        setLocationLabel("Current Device GPS");
        if (map.current) {
          map.current.flyTo([lat, lng], 19, { animate: true });
        }
      },
      (err) => {
        setIsLocating(false);
        alert("GPS Error: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Center map directly onto the solar plates
  const handleJumpToPlates = useCallback(() => {
    if (!map.current) return;
    if (roofPolygon && roofPolygon.length >= 3) {
      try {
        const bounds = L.latLngBounds(roofPolygon);
        map.current.fitBounds(bounds, { padding: [40, 40], animate: false, maxZoom: 21 });
        if (map.current.getZoom() < 19) {
          map.current.setZoom(19, { animate: false });
        }
      } catch (e) {
        console.warn("Jump to plates error:", e);
      }
    } else {
      alert("No solar plates placed yet! Click '✦ Auto-Fill Roof' to place solar plates at your current map view, or 'New Field Segment' to outline a roof.");
    }
  }, [roofPolygon]);

  // Initialize Leaflet map safely
  useEffect(() => {
    if (!mapRef.current) return;

    if (map.current) {
      try {
        map.current.remove();
      } catch (err) {
        console.warn("Leaflet map cleanup:", err);
      }
      map.current = null;
    }

    if (mapRef.current._leaflet_id) {
      delete mapRef.current._leaflet_id;
    }

    const mapInstance = L.map(mapRef.current, {
      center: [siteLat || 33.6844, siteLng || 73.0479],
      zoom: 18,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true
    });

    const tileLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 20,
      maxNativeZoom: 19,
      crossOrigin: true
    }).addTo(mapInstance);

    tileLayerRef.current = tileLayer;
    map.current = mapInstance;
    setMapReady(true);

    const resizeTimer = setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
        if (roofPolygon && roofPolygon.length >= 3) {
          try {
            const bounds = L.latLngBounds(roofPolygon);
            map.current.fitBounds(bounds, { padding: [30, 30], animate: false, maxZoom: 21 });
            if (map.current.getZoom() < 19) {
              map.current.setZoom(19, { animate: false });
            }
          } catch (e) {
            console.warn("Initial fitBounds error:", e);
          }
        }
      }
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      if (map.current) {
        try {
          map.current.remove();
        } catch (err) {
          console.warn("Leaflet unmount error:", err);
        }
        map.current = null;
      }
      if (mapRef.current && mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
      }
      tileLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  // ResizeObserver
  useEffect(() => {
    if (!mapRef.current) return;
    const ro = new ResizeObserver(() => {
      if (map.current) {
        map.current.invalidateSize();
      }
    });
    ro.observe(mapRef.current);
    return () => ro.disconnect();
  }, [mapReady]);

  // Leaflet Invalidate Size Fix
  useEffect(() => {
    if (!map.current) return;
    const t1 = setTimeout(() => map.current?.invalidateSize(), 50);
    const t2 = setTimeout(() => map.current?.invalidateSize(), 250);
    const handleResize = () => map.current?.invalidateSize();
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", handleResize);
    };
  }, [mapReady, cadSubTab]);

  // Update Tile Layer
  useEffect(() => {
    if (!map.current || !tileLayerRef.current) return;
    map.current.removeLayer(tileLayerRef.current);

    let url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    let maxZoom = 20;
    let maxNativeZoom = 19;

    if (mapLayer === "google") {
      url = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";
      maxZoom = 21;
      maxNativeZoom = 20;
    } else if (mapLayer === "osm") {
      url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      maxZoom = 19;
      maxNativeZoom = 19;
    }

    const newLayer = L.tileLayer(url, { maxZoom, maxNativeZoom, crossOrigin: true }).addTo(map.current);
    tileLayerRef.current = newLayer;
  }, [mapLayer]);

  // Centroid reference marker
  useEffect(() => {
    if (!map.current) return;
    if (centroidMarkerRef.current) {
      map.current.removeLayer(centroidMarkerRef.current);
      centroidMarkerRef.current = null;
    }
    if (showCentroidMarker && siteLat && siteLng) {
      centroidMarkerRef.current = L.circleMarker([siteLat, siteLng], {
        radius: 6,
        fillColor: "#06b6d4",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.9
      }).addTo(map.current);
    }
  }, [showCentroidMarker, siteLat, siteLng]);

  // Inter-Row Winter Solstice Shadow Spacing Math
  const shadowAnalysis = useMemo(() => {
    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
    const modHeightM = orientation === "PORTRAIT" ? spec.lengthMm / 1000 : spec.widthMm / 1000;
    return calculateWinterShadowSpacing(modHeightM, tiltDegrees, siteLat);
  }, [selectedModuleKey, orientation, tiltDegrees, siteLat]);

  // Handle Array Calculation from Canvas
  const handleArrayCalculated = useCallback((data) => {
    if (!data) return;
    const manualKwp = manualSegments.reduce((sum, s) => sum + (Number(s.kwp) || 0), 0);
    const manualCount = manualSegments.reduce((sum, s) => sum + (Number(s.count) || 0), 0);
    const mainCount = data.modulesCount || 0;
    const mainKwp = data.kwp || 0;
    const totalCount = mainCount + manualCount;
    const totalKwp = Math.round((mainKwp + manualKwp) * 10) / 10;

    setSystemStats(prev => {
      if (prev && prev.modulesCount === totalCount && prev.kwp === totalKwp) return prev;
      return {
        modulesCount: totalCount,
        kwp: totalKwp
      };
    });
    setCachedPanels(data.panels || []);
    if (setCapacityKw && totalKwp > 0) {
      setCapacityKw(totalKwp);
    }
  }, [setCapacityKw, manualSegments]);

  // Ensure Racking, Azimuth, Tilt, Orientation & Pitch stay in sync (parent mirror)
  useEffect(() => {
    if (!roofPolygon || roofPolygon.length < 3) {
      setCachedPanels([]);
      setSystemStats({ modulesCount: 0, kwp: 0 });
      return;
    }
    const currentAzimuth = typeof azimuthDegrees === "number" && !isNaN(azimuthDegrees) ? azimuthDegrees : 180;
    const currentTilt = typeof tiltDegrees === "number" && !isNaN(tiltDegrees) ? tiltDegrees : 18;
    const currentRacking = rackingType || "L2_ELEVATED";

    const centroid = calculateCentroid(roofPolygon);
    const cLat = Array.isArray(centroid) ? centroid[0] : (centroid?.lat || 0);
    const cLng = Array.isArray(centroid) ? centroid[1] : (centroid?.lng || 0);

    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
    const shadowPitchVal = Number(shadowAnalysis?.totalRowPitchMeters) || Number(rowSpacingM) || 1.55;

    const selectedModule = spec;
    const activeWattage = Number(selectedModule?.wattage) || 585;
    const targetLimit = (targetCapacityMode === "TARGET_CAP" && targetKwp && Number(targetKwp) > 0)
      ? Math.max(1, Math.round((Number(targetKwp) * 1000) / activeWattage))
      : null;

    const updated = packModulesOnRoof(roofPolygon, {
      orientation,
      arrayScale,
      shadowPitch: shadowPitchVal,
      rowSpacing: rowSpacingM,
      rowSpacingM,
      colSpacing: moduleSpacingM,
      colSpacingM: moduleSpacingM,
      frameSizeUp,
      frameRows: frameSizeUp,
      frameSizeWide,
      frameCols: frameSizeWide,
      frameSpacing: frameSpacingM,
      gridOffset,
      gridAlignment,
      setback: setbackMeters,
      setbackMeters,
      moduleWidth: spec.widthMm / 1000,
      moduleLength: spec.lengthMm / 1000,
      azimuthDeg: currentAzimuth,
      azimuthDegrees: currentAzimuth,
      azimuth: currentAzimuth,
      tiltDeg: currentTilt,
      tiltDegrees: currentTilt,
      tilt: currentTilt,
      rackingType: currentRacking,
      targetCapacityMode,
      targetCount: targetLimit,
      targetKwp: targetCapacityMode === "TARGET_CAP" ? targetKwp : null,
      refLat: cLat,
      refLng: cLng,
      centroid: { lat: cLat, lng: cLng }
    });

    if (updated && updated.length > 0) {
      setCachedPanels(updated);
      const manualKwp = manualSegments.reduce((sum, s) => sum + (Number(s.kwp) || 0), 0);
      const manualCount = manualSegments.reduce((sum, s) => sum + (Number(s.count) || 0), 0);
      const mainKwp = Math.round(((updated.length * (spec.wattage || 585)) / 1000) * 10) / 10;
      setSystemStats({
        modulesCount: updated.length + manualCount,
        kwp: Math.round((mainKwp + manualKwp) * 10) / 10
      });
      if (setCapacityKw) {
        setCapacityKw(Math.round((mainKwp + manualKwp) * 10) / 10);
      }
    }
  }, [
    azimuthDegrees,
    tiltDegrees,
    rackingType,
    roofPolygon,
    targetCapacityMode,
    targetKwp,
    orientation,
    arrayScale,
    rowSpacingM,
    moduleSpacingM,
    frameSizeUp,
    frameSizeWide,
    frameSpacingM,
    setbackMeters,
    gridAlignment,
    gridOffset,
    selectedModuleKey,
    shadowAnalysis?.totalRowPitchMeters,
    manualSegments,
    setCapacityKw
  ]);

  // Module spec
  const currentModuleSpec = useMemo(() => {
    return MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
  }, [selectedModuleKey]);

  // Solar position
  const solarPosition = useMemo(() => {
    return calculateSolarPosition(siteLat, dayOfYear, solarHour);
  }, [siteLat, dayOfYear, solarHour]);

  // Roof Area calculation
  const roofArea = useMemo(() => {
    return calculateGeodesicArea(roofPolygon);
  }, [roofPolygon]);

  // Inverter & Stringing States
  const [selectedInverterModel, setSelectedInverterModel] = useState("HW-20KTL-M2");
  const [inverterCapacityKw, setInverterCapacityKw] = useState(20);
  const [targetPanelsPerString, setTargetPanelsPerString] = useState(14);

  const inverterOptions = useMemo(() => buildInverterOptions(), []);
  const TIER1_INVERTERS = inverterOptions;

  // ★ AUTO INVERTER MATCH (TDZ-SAFE: activeKwp inline calculate karta hai)
  const userOverrodeInverterRef = useRef(false);
  useEffect(() => {
    if (userOverrodeInverterRef.current) return;
    const total = systemStats.modulesCount || cachedPanels.length || 0;
    const activeCount = Math.max(0, total - (removedModuleIds?.size || 0));
    if (!activeCount || activeCount <= 0) return;
    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
    const currentKwp = Math.round(((activeCount * (spec?.wattage || 585)) / 1000) * 10) / 10;
    const targetAcKw = currentKwp / 1.25;
    let best = null, bestDiff = Infinity;
    inverterOptions.forEach(o => {
      const diff = Math.abs(o.kw - targetAcKw);
      if (diff < bestDiff) { bestDiff = diff; best = o; }
    });
    if (best && best.value !== selectedInverterModel) {
      setSelectedInverterModel(best.value);
      setInverterCapacityKw(best.kw);
    }
  }, [systemStats.modulesCount, cachedPanels.length, removedModuleIds, selectedModuleKey, inverterOptions, selectedInverterModel]);

  const [targetStringSize, setTargetStringSize] = useState(20);

  // ★ STRINGING VOLTAGE SAFETY
  const maxSafePanelsPerString = useMemo(() => {
    const inv = getInverterSpec(selectedInverterModel);
    const voc = currentModuleSpec?.voc || 49.7;
    const coeff = Math.abs(currentModuleSpec?.tempCoeffPmaxPct || 0.29) / 100;
    const coldFactor = 1 + coeff * 30; // -5°C winter
    const maxDc = inv?.maxDcVoltage || 1000;
    return Math.max(4, Math.floor(maxDc / (voc * coldFactor)));
  }, [selectedInverterModel, currentModuleSpec]);

  useEffect(() => {
    if (targetStringSize > maxSafePanelsPerString) setTargetStringSize(maxSafePanelsPerString);
    if (targetPanelsPerString > maxSafePanelsPerString) setTargetPanelsPerString(maxSafePanelsPerString);
  }, [maxSafePanelsPerString, targetStringSize, targetPanelsPerString]);

  useEffect(() => {
    if (cadSubTab === "STRINGING") setShowElectricalLayer(true);
  }, [cadSubTab]);

  const mainArrayModulesCount = useMemo(() => {
    return Math.max(0, (cachedPanels?.length || 0) - (removedModuleIds?.size || 0));
  }, [cachedPanels, removedModuleIds]);

  const manualSegmentsCount = useMemo(() => {
    return manualSegments.reduce((sum, seg) => sum + (seg.count || (seg.panels?.length || 0)), 0);
  }, [manualSegments]);

  const activeModulesCount = useMemo(() => {
    return mainArrayModulesCount + manualSegmentsCount;
  }, [mainArrayModulesCount, manualSegmentsCount]);

  const activeKwp = useMemo(() => {
    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
    const wattage = spec?.wattage || 585;
    const mainKwp = (mainArrayModulesCount * wattage) / 1000;
    const manualKwp = manualSegments.reduce((sum, seg) => sum + (Number(seg.kwp) || 0), 0);
    return Math.round((mainKwp + manualKwp) * 10) / 10;
  }, [mainArrayModulesCount, manualSegments, selectedModuleKey]);

  const stringingAnalysis = useMemo(() => {
    const spec = getInverterSpec(selectedInverterModel);
    return calculateAutomatedStringing({
      totalModules: activeModulesCount || 26,
      moduleKey: selectedModuleKey,
      inverterCapacityKw: inverterCapacityKw || spec?.kw || 20,
      targetPanelsPerString: targetPanelsPerString || 14,
      minWinterTempC: -5,
      maxSummerCellTempC: 65,
      inverterMaxDcVoltage: spec?.maxDcVoltage || 1000,
      inverterMpptMin: spec?.mpptMin || 160,
      inverterMpptMax: spec?.mpptMax || 950
    });
  }, [activeModulesCount, selectedModuleKey, inverterCapacityKw, targetPanelsPerString, selectedInverterModel]);

  const productionAnalysis = useMemo(() => {
    return simulateHelioScopeProduction({
      capacityDckW: activeKwp || 15.2,
      tiltDegrees,
      azimuthDegrees,
      siteLatitude: siteLat
    });
  }, [activeKwp, tiltDegrees, azimuthDegrees, siteLat]);

  // Clear All Drawing & Placed Panels
  const handleClearAll = useCallback(() => {
    if (isLocked) return;
    setActivePolygon([]);
    setPlacedPanels([]);
    if (cachedPanelsRef && cachedPanelsRef.current) {
      cachedPanelsRef.current = [];
    }
    if (overlayRef.current?.clearAll) {
      overlayRef.current.clearAll();
    }
    if (overlayRef.current?.requestRedraw) {
      overlayRef.current.requestRedraw();
    }
    setActiveDrawingPoints([]);
    setRoofPolygon([]);
    setSystemStats({ modulesCount: 0, kwp: 0 });
    setCachedPanels([]);
    setRemovedModuleIds(new Set());
    setClearTrigger((c) => c + 1);
    if (setCapacityKw) setCapacityKw(0);
    setActiveCadTool("MANUAL_INSPECT");

    if (map.current) {
      try {
        map.current.eachLayer((layer) => {
          if (layer.options && (layer.options.isTempDraw || layer.options.isRoofHandle || layer.options.pane === "solarModulesPane")) {
            map.current.removeLayer(layer);
          }
        });
      } catch (err) {
        console.warn("Error cleaning up layers:", err);
      }
    }
  }, [isLocked, setCapacityKw]);

  const handleClearDrawing = handleClearAll;
  const handleClearRoof = handleClearAll;

  // ── MANUAL PANEL SEGMENT ADD ──────────────────────────────────────────────
  // Generates a panel group for the requested kW at map center or offset from existing arrays
  const handleAddManualSegment = useCallback(() => {
    const kw = Math.max(0.5, Math.min(5000, Number(manualKwInput) || 5));
    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
    const wattage = spec.wattage || 585;
    const neededPanels = Math.max(1, Math.round((kw * 1000) / wattage));

    let lat = siteLat || defaultLat;
    let lng = siteLng || defaultLng;

    if (map.current) {
      try {
        const c = map.current.getCenter();
        if (c && isFinite(c.lat) && isFinite(c.lng)) {
          lat = c.lat;
          lng = c.lng;
        }
      } catch (e) { /* ignore */ }
    } else if (roofPolygon && roofPolygon.length >= 3) {
      const centroid = calculateCentroid(roofPolygon);
      if (centroid) {
        lat = Array.isArray(centroid) ? centroid[0] : (centroid.lat || lat);
        lng = Array.isArray(centroid) ? centroid[1] : (centroid.lng || lng);
      }
    }

    const isLandscapeLocal = String(orientation || "").toUpperCase().includes("LAND");
    const cols = Math.max(1, Math.ceil(Math.sqrt(neededPanels * 1.5)));
    const rows = Math.ceil(neededPanels / cols);
    const wM = (isLandscapeLocal ? Math.max(spec.lengthMm, spec.widthMm) : Math.min(spec.lengthMm, spec.widthMm)) / 1000;
    const lM = (isLandscapeLocal ? Math.min(spec.lengthMm, spec.widthMm) : Math.max(spec.lengthMm, spec.widthMm)) / 1000;
    const totalW = cols * (wM + 0.05) + 0.8;
    const totalH = rows * (lM + 0.65) + 0.8;

    if (manualSegments.length > 0) {
      lat -= (manualSegments.length * (totalH + 2.0)) / 111139;
    } else if (roofPolygon && roofPolygon.length >= 3) {
      const centroid = calculateCentroid(roofPolygon);
      const cLat = Array.isArray(centroid) ? centroid[0] : (centroid.lat || lat);
      const cLng = Array.isArray(centroid) ? centroid[1] : (centroid.lng || lng);
      if (Math.hypot(lat - cLat, lng - cLng) < 0.00015) {
        lat -= (totalH + 3.0) / 111139;
      }
    }

    const dLat = totalH / 111139;
    const dLng = totalW / (111139 * Math.cos((lat * Math.PI) / 180));

    const segPoly = [
      [lat + dLat / 2, lng - dLng / 2],
      [lat + dLat / 2, lng + dLng / 2],
      [lat - dLat / 2, lng + dLng / 2],
      [lat - dLat / 2, lng - dLng / 2]
    ];

    const packed = packModulesOnRoof(segPoly, {
      orientation,
      arrayScale: 1.0,
      rowSpacingM,
      colSpacingM: moduleSpacingM,
      frameSizeUp,
      frameSizeWide,
      frameSpacing: frameSpacingM,
      setback: 0.1,
      moduleWidth: spec.widthMm / 1000,
      moduleLength: spec.lengthMm / 1000,
      azimuthDeg: azimuthDegrees,
      tiltDeg: tiltDegrees,
      rackingType,
      targetCount: neededPanels,
      targetCapacityMode: "TARGET_CAP",
      targetKwp: kw,
      refLat: lat,
      refLng: lng,
      centroid: { lat, lng }
    });

    if (!packed || packed.length === 0) {
      alert("Could not place panels. Try a larger area or fewer kW.");
      return;
    }

    const actualKwp = Math.round(((packed.length * wattage) / 1000) * 10) / 10;
    const segId = `manual-${Date.now()}`;
    const newSeg = {
      id: segId,
      kwp: actualKwp,
      count: packed.length,
      panels: packed,
      label: `Manual Array ${manualSegments.length + 1} (${kw} kW)`
    };

    setManualSegments(prev => [...prev, newSeg]);
    if (overlayRef.current?.requestRedraw) overlayRef.current.requestRedraw();
  }, [
    manualKwInput, selectedModuleKey, siteLat, siteLng, defaultLat, defaultLng,
    orientation, arrayScale, rowSpacingM, moduleSpacingM, frameSizeUp, frameSizeWide,
    frameSpacingM, azimuthDegrees, tiltDegrees, rackingType, roofPolygon, manualSegments
  ]);

  const handleDeleteManualSegment = useCallback((segId) => {
    setManualSegments(prev => prev.filter(s => s.id !== segId));
    if (overlayRef.current?.requestRedraw) overlayRef.current.requestRedraw();
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const handleUndoPoint = useCallback(() => {
    if (isLocked) return;
    if (activeDrawingPoints && activeDrawingPoints.length > 0) {
      const updated = activeDrawingPoints.slice(0, -1);
      setActiveDrawingPoints(updated);
      if (updated.length === 0) {
        handleClearAll();
      } else if (overlayRef.current?.requestRedraw) {
        overlayRef.current.requestRedraw();
      }
      return;
    }

    setActivePolygon((prev) => {
      if (!prev || prev.length === 0) return [];
      const updated = prev.slice(0, -1);
      if (updated.length < 3) {
        handleClearAll();
        return [];
      }
      return updated;
    });
    if (overlayRef.current?.requestRedraw) {
      overlayRef.current.requestRedraw();
    }
  }, [isLocked, activeDrawingPoints, handleClearAll]);

  const handleUndoLastPoint = handleUndoPoint;

  const handleDeleteActiveSegment = useCallback((segmentId) => {
    handleClearAll();
  }, [handleClearAll]);

  // Hotkey keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClearAll();
      } else if (e.key === "Backspace" || (e.ctrlKey && (e.key === "z" || e.key === "Z"))) {
        e.preventDefault();
        handleUndoPoint();
      } else if (e.key === "Delete") {
        e.preventDefault();
        handleClearAll();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setArrayScale((prev) => Math.min(2.0, Number((prev + 0.05).toFixed(2))));
        if (overlayRef.current?.requestRedraw) overlayRef.current.requestRedraw();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setArrayScale((prev) => Math.max(0.4, Number((prev - 0.05).toFixed(2))));
        if (overlayRef.current?.requestRedraw) overlayRef.current.requestRedraw();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClearAll, handleUndoPoint]);

  // Load saved design from backend if activeProject exists
  useEffect(() => {
    if (!activeProject?.id) return;
    fetch(`/api/design/${activeProject.id}`)
      .then(r => r.json())
      .then(data => {
        if (data?.data) {
          const d = data.data;
          if (d.latitude && !isNaN(d.latitude)) setSiteLat(d.latitude);
          if (d.longitude && !isNaN(d.longitude)) setSiteLng(d.longitude);
          if (d.totalSystemKw && setCapacityKw) setCapacityKw(d.totalSystemKw);
        }
      })
      .catch(err => console.warn("Failed to load design:", err));
  }, [activeProject?.id]);

  // Save design to backend
  const handleSaveDesign = useCallback(async (extraPayload = {}) => {
    if (!activeProject?.id) return;
    try {
      const payload = {
        projectId: activeProject.id,
        siteAddress: activeProject.siteAddress || locationLabel,
        latitude: siteLat,
        longitude: siteLng,
        totalSystemKw: activeKwp,
        totalModuleCount: activeModulesCount,
        estimatedAnnualKwh: productionAnalysis?.netAnnualKwh || 0,
        performanceRatio: productionAnalysis?.performanceRatioPct || 81.5,
        ...extraPayload
      };
      await fetch(`/api/design/${activeProject.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Failed to auto-save design:", err);
    }
  }, [activeProject?.id, activeProject?.siteAddress, locationLabel, siteLat, siteLng, activeKwp, activeModulesCount, productionAnalysis]);

  // Invalidate Leaflet map size on tab switch
  useEffect(() => {
    if ((cadSubTab === "LAYOUT" || cadSubTab === "SHADING") && map.current) {
      const timer = setTimeout(() => {
        if (map.current) map.current.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cadSubTab]);

  return (
    <div className="w-full min-h-screen bg-slate-950 pb-20 text-slate-100">
      {/* 7-Section Solar Design Studio Sub-Navigation Bar */}
      <div className="h-11 shrink-0 bg-slate-900/95 border-b border-slate-800 px-3 flex items-center justify-between gap-2 text-xs z-30 backdrop-blur sticky top-0">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
          <div className="flex items-center gap-1.5 pr-2.5 mr-1 border-r border-slate-800 text-slate-200 font-bold hidden md:flex shrink-0">
            <Sun className="w-4 h-4 text-emerald-500" />
            <span className="text-xs tracking-wider uppercase font-black">HELIOSCOPE CAD</span>
          </div>
          <button
            onClick={() => { setCadSubTab("CATALOG"); setIs3DMode(false); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${cadSubTab === "CATALOG"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
          >
            <Package className="w-3.5 h-3.5" />
            1. Equipment
          </button>
          <button
            onClick={() => { setCadSubTab("SITE_SETUP"); setIs3DMode(false); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${cadSubTab === "SITE_SETUP"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            2. Site Setup
          </button>
          <button
            onClick={() => { setCadSubTab("LAYOUT"); setIs3DMode(false); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${cadSubTab === "LAYOUT" && !is3DMode
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
          >
            <Box className="w-3.5 h-3.5" />
            3. Array Designer
          </button>
          <button
            onClick={() => { setCadSubTab("SHADING"); setIs3DMode(false); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${cadSubTab === "SHADING"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
          >
            <Sun className="w-3.5 h-3.5" />
            4. Shading
          </button>
          <button
            onClick={() => { setCadSubTab("STRINGING"); setIs3DMode(false); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${cadSubTab === "STRINGING"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
          >
            <Zap className="w-3.5 h-3.5" />
            5. Electrical & SLD
          </button>
          <button
            onClick={() => { setCadSubTab("PRODUCTION"); setIs3DMode(false); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${cadSubTab === "PRODUCTION"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            6. Production
          </button>
          <button
            onClick={() => { setCadSubTab("REPORT"); setIs3DMode(false); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${cadSubTab === "REPORT"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            7. Proposal
          </button>
        </div>

        {(cadSubTab === "LAYOUT" || cadSubTab === "SHADING") && (
          <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg p-1 shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setViewportMode("2D");
                setTimeout(() => {
                  if (map.current) map.current.invalidateSize();
                }, 50);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${viewportMode === "2D"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
                }`}
            >
              2D CAD
            </button>
            <button
              type="button"
              onClick={() => setViewportMode("3D")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${viewportMode === "3D"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
                }`}
            >
              3D Perspective
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: ARRAY DESIGNER + ★ SECTION 4 MERGED (Shading bhi isi map pe) */}
      <div className={(cadSubTab === "LAYOUT" || cadSubTab === "SHADING") ? "flex flex-col lg:flex-row gap-5 p-4 items-stretch w-full max-w-[1700px] mx-auto" : "hidden"}>
        {/* Left Control Sidebar */}
        <div className="w-full lg:w-[410px] h-[670px] overflow-y-auto pr-2 bg-slate-900/95 rounded-2xl border border-slate-800 p-4 shrink-0 shadow-xl custom-scrollbar space-y-4 text-slate-100">
          {/* ★ SHADING MODE: CAD map ke sath merged shading sidebar (sync panel) */}
          {cadSubTab === "SHADING" && (
            <HelioScopeShadingAnalysis
              siteLat={siteLat}
              siteLng={siteLng}
              solarHour={solarHour}
              setSolarHour={setSolarHour}
              dayOfYear={dayOfYear}
              setDayOfYear={setDayOfYear}
              compactMode={true}
            />
          )}
          <div className={`bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-4 shadow-sm ${cadSubTab === "SHADING" ? "hidden" : ""}`}>
            {/* Field Segment Header */}
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    Field Segment 1
                    {roofPolygon && roofPolygon.length >= 3 ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/40 font-bold">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-700 text-slate-300 font-mono px-1.5 py-0.5 rounded border border-slate-600 font-bold">
                        READY
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {roofArea.areaSqFt > 0 ? `${roofArea.areaSqFt.toLocaleString()} sq ft (${roofArea.areaSqM} m²)` : "No roof array placed yet"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-emerald-400 font-mono block">
                  {activeKwp > 0 ? `${activeKwp.toFixed(1)} kWp` : "0.0 kWp"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeModulesCount} Modules
                </span>
              </div>
            </div>

            {/* Field Segments List */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wider">Field Segments</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleGenerateDefaultArray(20, 14)}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition"
                    title="Auto-place solar array at current map center"
                  >
                    <Plus className="w-3 h-3" /> Add Segment
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="checkbox" defaultChecked id="fs-shadows-check" className="rounded accent-emerald-500 cursor-pointer" />
                <label htmlFor="fs-shadows-check" className="cursor-pointer select-none font-medium">Field segments cast shadows</label>
              </div>

              {/* Segments Table */}
              <div className="rounded-lg border border-slate-700/80 overflow-hidden bg-slate-950 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-[9px] font-bold text-slate-300 uppercase border-b border-slate-700">
                      <th className="py-1.5 px-2.5">Description</th>
                      <th className="py-1.5 px-2">Modules</th>
                      <th className="py-1.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {roofPolygon && roofPolygon.length >= 3 ? (
                      <tr className="hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 font-bold text-slate-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Main Rooftop Array
                        </td>
                        <td className="py-2 px-2 font-mono text-emerald-400 font-bold">
                          {mainArrayModulesCount} ({((mainArrayModulesCount * (MODULE_PHYSICAL_SPECS[selectedModuleKey]?.wattage || 585)) / 1000).toFixed(1)} kW)
                        </td>
                        <td className="py-2 px-2 text-right space-x-1">
                          <button
                            type="button"
                            onClick={handleJumpToPlates}
                            className="px-1.5 py-0.5 hover:bg-blue-900/50 text-blue-400 rounded text-[10px] font-bold cursor-pointer transition"
                            title="Locate & center on array"
                          >
                            🎯
                          </button>
                          <button
                            type="button"
                            onClick={handleClearRoof}
                            className="px-1.5 py-0.5 hover:bg-rose-900/50 text-rose-400 rounded text-[10px] font-bold cursor-pointer transition"
                            title="Delete / Clear array"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-center text-slate-400 text-[11px]">
                          <div className="font-semibold text-slate-200 mb-0.5">No array added yet</div>
                          <span className="text-[10px] text-slate-400">
                            Click <strong className="text-emerald-400 cursor-pointer underline hover:text-emerald-300" onClick={() => handleGenerateDefaultArray(20, 14)}>Auto-Fill Roof</strong> to place here, or <strong className="text-amber-400 cursor-pointer underline hover:text-amber-300" onClick={() => { setActiveCadTool("FIELD_SEGMENT"); setIs3DMode(false); }}>New Field Segment</strong> to draw.
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ★ MANUAL PANEL ADD \u2014 enter kW, panels appear on map */}
              <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-700/50 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 border-b border-indigo-800/60 pb-2">
                  <Plus className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-black text-indigo-200 uppercase tracking-wider">Manual Add Panels</span>
                </div>

                {/* kW input + add button */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-1 bg-slate-900 border border-indigo-700/50 rounded-lg px-2 py-1.5">
                    <input
                      type="number"
                      min="0.5"
                      max="5000"
                      step="0.5"
                      value={manualKwInput}
                      onChange={e => setManualKwInput(parseFloat(e.target.value) || 5)}
                      className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                      placeholder="kW"
                    />
                    <span className="text-[10px] text-indigo-400 font-bold shrink-0">kW</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono shrink-0 w-16 text-center leading-tight">
                    {Math.round((manualKwInput * 1000) / (MODULE_PHYSICAL_SPECS[selectedModuleKey]?.wattage || 585))} panels
                  </div>
                  <button
                    type="button"
                    onClick={handleAddManualSegment}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg cursor-pointer transition flex items-center gap-1 shrink-0 shadow-sm"
                    title="Place panels at current map view center"
                  >
                    <Plus className="w-3 h-3" /> Add to Map
                  </button>
                </div>

                {/* Quick kW presets */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">Quick:</span>
                  {[3, 5, 10, 15, 20, 30, 50].map(kw => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setManualKwInput(kw)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border cursor-pointer transition ${manualKwInput === kw ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"}`}
                    >
                      {kw}k
                    </button>
                  ))}
                </div>

                {/* Manual segments list */}
                {manualSegments.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-indigo-800/40">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Added Segments:</span>
                    {manualSegments.map(seg => (
                      <div key={seg.id} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-2 py-1.5 border border-slate-700/50">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-300">{seg.label}</span>
                          <span className="text-[9px] text-slate-400 ml-2 font-mono">{seg.count} panels • {seg.kwp} kWp</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteManualSegment(seg.id)}
                          className="p-1 hover:bg-rose-900/40 text-rose-400 rounded cursor-pointer transition"
                          title="Remove this manual segment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Array Sizing Strategy & Target Capacity (kWp) Controls */}

              <div className="space-y-2 pt-2 border-t border-slate-700/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-200 font-bold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Sizing Mode
                  </span>
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setTargetCapacityMode("AUTO_FIT")}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${targetCapacityMode === "AUTO_FIT"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-100"
                        }`}
                    >
                      Auto-Fit
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetCapacityMode("TARGET_CAP")}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${targetCapacityMode === "TARGET_CAP"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-100"
                        }`}
                    >
                      Target kWp
                    </button>
                  </div>
                </div>

                {/* Module Array Scale Slider — controls packing area = panel COUNT, not module size */}
                <div className="flex flex-col gap-1 mt-2 p-2 bg-slate-900/60 rounded-lg border border-slate-700/60">
                  <div className="flex justify-between text-xs text-slate-300 font-semibold">
                    <span>Array Coverage <span className="text-slate-500 font-normal">(↑ more panels, ↓ fewer)</span>:</span>
                    <span className="font-mono text-emerald-400 font-bold">{Math.round(arrayScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={arrayScale}
                    onChange={(e) => {
                      setArrayScale(parseFloat(e.target.value));
                      if (overlayRef.current?.requestRedraw) overlayRef.current.requestRedraw();
                    }}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>

                {/* Target Capacity Input */}
                {targetCapacityMode === "TARGET_CAP" ? (
                  <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-emerald-300">Target System Size (kWp)</label>
                      <span className="text-[11px] font-mono font-extrabold text-emerald-400">{targetKwp} kWp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        step="1"
                        value={targetKwp}
                        onChange={(e) => setTargetKwp(Math.max(1, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-emerald-700/60 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. 50"
                      />
                      <span className="text-xs font-bold text-emerald-400 shrink-0">kWp</span>
                    </div>

                    <div className="text-[10px] text-emerald-300 flex items-center justify-between font-medium">
                      <span>Max Modules Limit:</span>
                      <span className="font-mono font-bold bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50">
                        {Math.floor(((targetKwp || 0) * 1000) / (MODULE_PHYSICAL_SPECS[selectedModuleKey]?.wattage || 585))} Modules
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Presets:</span>
                      {[10, 20, 35, 50, 100].map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => {
                            setTargetKwp(kw);
                            setTargetCapacityMode("TARGET_CAP");
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition cursor-pointer ${targetKwp === kw
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                            }`}
                        >
                          {kw}k
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic px-1">
                    Auto-Fit active: Array fills all available space within setback boundary.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleGenerateDefaultArray(
                      targetCapacityMode === "TARGET_CAP"
                        ? Math.max(16, Math.round(Math.sqrt((targetKwp * 1000 / (MODULE_PHYSICAL_SPECS[selectedModuleKey]?.wattage || 585)) * 3)))
                        : 20,
                      targetCapacityMode === "TARGET_CAP"
                        ? Math.max(12, Math.round(Math.sqrt((targetKwp * 1000 / (MODULE_PHYSICAL_SPECS[selectedModuleKey]?.wattage || 585)) * 1.8)))
                        : 14
                    )}
                    className="py-1.5 px-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Auto-Fill Roof
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridOffset({ x: 0, y: 0 })}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition border ${gridOffset.x !== 0 || gridOffset.y !== 0
                      ? "bg-amber-900/40 text-amber-300 border-amber-600 hover:bg-amber-900/60"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                    title="Reset array position to exact center of roof boundary"
                  >
                    <Move className="w-3 h-3 text-emerald-400" />
                    {gridOffset.x !== 0 || gridOffset.y !== 0
                      ? `Reset (Δ${gridOffset.x.toFixed(1)}, ${gridOffset.y.toFixed(1)}m)`
                      : "Anchor Center"}
                  </button>
                </div>
              </div>
            </div>

            {/* 1. Module Selection Dropdown */}
            <div>
              <label className="text-[11px] text-slate-300 font-bold block mb-1">
                Module Selection (Tier-1 TOPCon)
              </label>
              <select
                value={selectedModuleKey}
                onChange={(e) => {
                  setSelectedModuleKey(e.target.value);
                  setRemovedModuleIds(new Set());
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
              >
                {Object.keys(MODULE_PHYSICAL_SPECS).map(key => (
                  <option key={key} value={key}>
                    {key} ({MODULE_PHYSICAL_SPECS[key].lengthMm} × {MODULE_PHYSICAL_SPECS[key].widthMm} mm)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Racking Type */}
            <div>
              <label className="text-[11px] text-slate-300 font-bold block mb-1">
                Racking Type
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setRackingType("FLUSH_MOUNT")}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition truncate text-center cursor-pointer ${rackingType === "FLUSH_MOUNT" || rackingType.includes("Flush") || rackingType.includes("Fixed")
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                >
                  Flush Mount
                </button>
                <button
                  type="button"
                  onClick={() => setRackingType("L2_ELEVATED")}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition truncate text-center cursor-pointer ${rackingType === "L2_ELEVATED" || rackingType === "L2 Elevated" || (rackingType.includes("L2") && !rackingType.includes("L3"))
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                >
                  L2 Elevated
                </button>
                <button
                  type="button"
                  onClick={() => setRackingType("L3_ELEVATED")}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition truncate text-center cursor-pointer ${rackingType === "L3_ELEVATED" || rackingType === "L3 Elevated" || rackingType.includes("L3")
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                >
                  L3 Elevated
                </button>
              </div>
            </div>

            {/* 3. Azimuth Orientation */}
            <div className="space-y-2 p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-200 font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" /> Azimuth Orientation
                </span>
                <span className="text-emerald-400 font-mono font-extrabold">{localAzimuth}°</span>
              </div>

              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={localAzimuth}
                onChange={(e) => handleAzimuthChange(e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="grid grid-cols-6 gap-1 text-[10px] font-mono text-center">
                {[
                  { label: "N (0°)", val: 0 },
                  { label: "E (90°)", val: 90 },
                  { label: "SE (135°)", val: 135 },
                  { label: "S (180°)", val: 180 },
                  { label: "SW (225°)", val: 225 },
                  { label: "W (270°)", val: 270 }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleAzimuthChange(Number(item.val))}
                    className={`py-1.5 px-0.5 rounded border font-bold transition truncate cursor-pointer ${Number(localAzimuth) === Number(item.val)
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                <PenTool className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Right-click roof boundary line on map to snap azimuth parallel to wall.</span>
              </div>
            </div>

            {/* 4. Tilt Angle */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-300 font-bold">Tilt Angle (Slope)</span>
                <span className="text-emerald-400 font-mono font-extrabold">{localTilt}° Tilt</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={localTilt}
                onChange={(e) => handleTiltChange(e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="grid grid-cols-5 gap-1 pt-1 text-[10px] font-mono text-center">
                {[
                  { label: "0° (Flush)", val: 0 },
                  { label: "15°", val: 15 },
                  { label: "18°", val: 18 },
                  { label: "28°", val: 28 },
                  { label: "45°", val: 45 }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleTiltChange(Number(item.val))}
                    className={`py-1 px-1 rounded border font-bold transition truncate cursor-pointer ${Number(localTilt) === Number(item.val)
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. HelioScope Array Alignment Toolbar (4 Buttons) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300 font-bold block">
                  Array Alignment
                </span>
                <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">{gridAlignment}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGridAlignment("LEFT")}
                  className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${gridAlignment === "LEFT"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  title="Left-Align array against boundary"
                >
                  <span className="text-sm leading-none">⬅</span>
                  <span className="text-[9px]">Left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridAlignment("CENTER")}
                  className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${gridAlignment === "CENTER"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  title="Center-Align array within boundary"
                >
                  <span className="text-sm leading-none">⯀</span>
                  <span className="text-[9px]">Center</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridAlignment("RIGHT")}
                  className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${gridAlignment === "RIGHT"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  title="Right-Align array against boundary"
                >
                  <span className="text-sm leading-none">➡</span>
                  <span className="text-[9px]">Right</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridAlignment("JUSTIFY")}
                  className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${gridAlignment === "JUSTIFY"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  title="Justify modules across field segment"
                >
                  <span className="text-sm leading-none">⇿</span>
                  <span className="text-[9px]">Justify</span>
                </button>
              </div>
            </div>

            {/* 6. HelioScope Frame Size (Up x Wide) */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-2 text-xs">
              <span className="text-[11px] text-slate-300 font-bold block">Frame Size</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Up</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={frameSizeUp}
                      onChange={(e) => setFrameSizeUp(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-center font-bold"
                    />
                    <span className="text-slate-400 text-xs">up</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Wide</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={frameSizeWide}
                      onChange={(e) => setFrameSizeWide(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-center font-bold"
                    />
                    <span className="text-slate-400 text-xs">wide</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Mechanical Spacing Inputs */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-300 font-medium">Row Spacing (Pitch):</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    max="5"
                    value={rowSpacingM}
                    onChange={(e) => setRowSpacingM(Math.max(0.01, parseFloat(e.target.value) || 0.5))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-emerald-400 font-bold"
                  />
                  <span className="text-slate-400 font-mono text-xs">m</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-300 font-medium">Module Spacing (Clamp Gap):</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.005"
                    min="0.005"
                    max="0.2"
                    value={moduleSpacingM}
                    onChange={(e) => setModuleSpacingM(Math.max(0.005, parseFloat(e.target.value) || 0.02))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-slate-200 font-bold"
                  />
                  <span className="text-slate-400 font-mono text-xs">m</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-300 font-medium">Frame Spacing:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="5"
                    value={frameSpacingM}
                    onChange={(e) => setFrameSpacingM(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-slate-200 font-bold"
                  />
                  <span className="text-slate-400 font-mono text-xs">m</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-800 font-mono">
                <span>Shadow Safe Pitch:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sp = Number(shadowAnalysis?.totalRowPitchMeters) || 1.55;
                    setRowSpacingM(sp);
                  }}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  title="Click to apply recommended Shadow Safe Pitch"
                >
                  <span>{shadowAnalysis.totalRowPitchMeters} m</span>
                  <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-1 py-0.2 rounded font-sans">Apply</span>
                </button>
              </div>
            </div>

            {/* 8. Module Orientation */}
            <div>
              <label className="text-[11px] text-slate-300 font-bold block mb-1">
                Module Orientation
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setOrientation("PORTRAIT"); setRemovedModuleIds(new Set()); }}
                  className={`py-2 px-3 rounded-xl border transition cursor-pointer ${orientation === "PORTRAIT"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                >
                  Portrait (Vertical 90°)
                </button>
                <button
                  type="button"
                  onClick={() => { setOrientation("LANDSCAPE"); setRemovedModuleIds(new Set()); }}
                  className={`py-2 px-3 rounded-xl border transition cursor-pointer ${orientation === "LANDSCAPE"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                >
                  Landscape (Horizontal 0°)
                </button>
              </div>
            </div>

            {/* 9. Perimeter Safety Setback (Slider + Direct Numeric Input) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-300 font-bold">Perimeter Safety Setback</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="3.0"
                    value={localSetback}
                    onChange={(e) => handleSetbackChange(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-400 font-bold text-xs"
                  />
                  <span className="text-amber-400 font-mono font-bold text-[11px]">m</span>
                </div>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.05"
                value={localSetback}
                onChange={(e) => handleSetbackChange(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono font-medium">
                <span>0.1m</span>
                <span>0.5m (Standard Parapet)</span>
                <span>3.0m</span>
              </div>
            </div>

            {/* ⚡ Electrical Design Controls */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-900/60 space-y-3 text-xs shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-cyan-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> Electrical Design
                </span>
                <button
                  type="button"
                  onClick={() => setShowElectricalLayer(prev => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition border cursor-pointer ${showElectricalLayer
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-black"
                    : "bg-slate-800 text-cyan-400 border-cyan-800 hover:bg-slate-700"
                    }`}
                  title="Toggle Electrical Overlay on map"
                >
                  <Zap className="w-3 h-3" />
                  {showElectricalLayer ? "Overlay ON" : "Overlay OFF"}
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Inverter Model (Tier-1 On-Grid)
                </label>
                <select
                  value={(() => {
                    const found = inverterOptions.find(o => o.value === selectedInverterModel || o.id === selectedInverterModel || o.model === selectedInverterModel);
                    return found ? found.value : (inverterOptions[8]?.value || selectedInverterModel);
                  })()}
                  onChange={(e) => {
                    userOverrodeInverterRef.current = true;
                    const spec = getInverterSpec(e.target.value);
                    setSelectedInverterModel(spec?.id || e.target.value);
                    if (spec) setInverterCapacityKw(spec.kw);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
                >
                  {inverterOptions.map(inv => (
                    <option key={inv.value} value={inv.value}>
                      {inv.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-900 rounded-lg px-3 py-2 space-y-1 border border-slate-800">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">System DC Size:</span>
                  <span className="text-emerald-400 font-mono font-bold">{systemStats.kwp ? systemStats.kwp.toFixed(1) : '0.0'} kWp</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Inverter Rating:</span>
                  <span className="text-orange-400 font-mono font-bold">{inverterCapacityKw} kW AC</span>
                </div>
                <div className="flex justify-between text-[10px] border-t border-slate-800 pt-1">
                  <span className="text-slate-300 font-bold">Inverters Required:</span>
                  <span className="text-cyan-300 font-black font-mono">
                    {Math.max(1, Math.ceil((systemStats.kwp || 0) / (inverterCapacityKw * 1.25)))} Units
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 font-mono pt-0.5">
                  Formula: ⌈ DC (kWp) ÷ (AC (kW) × 1.25) ⌉
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">Modules per String</span>
                  <span className="text-cyan-300 font-mono font-black text-[10px]">{targetStringSize} panels</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max={maxSafePanelsPerString}
                  step="1"
                  value={Math.min(targetStringSize, maxSafePanelsPerString)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setTargetStringSize(v);
                    setTargetPanelsPerString(v);
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>6</span><span>{Math.round(maxSafePanelsPerString / 2)}</span><span>{maxSafePanelsPerString} (safe max)</span>
                </div>
                <p className="text-[8px] text-cyan-600 font-mono">
                  🛡️ Safe max: {maxSafePanelsPerString} panels/string ({getInverterSpec(selectedInverterModel)?.maxDcVoltage || 1000}V limit)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Map Viewport */}
        <div className="w-full lg:flex-1 h-[670px] flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl relative">
          {/* Top Map Action Bar — Shading mode mein hidden (clean map for shadow sim) */}
          <div className={`p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 shrink-0 gap-2 flex-wrap ${cadSubTab === "SHADING" ? "hidden" : ""}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveCadTool("FIELD_SEGMENT");
                  setIs3DMode(false);
                  setActiveDrawingPoints([]);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 text-xs cursor-pointer ${activeCadTool === "FIELD_SEGMENT" && !is3DMode
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "bg-slate-800 text-amber-400 border border-slate-700 hover:bg-slate-700"
                  }`}
                title="HelioScope Field Segment: Click corners to draw yellow outline and auto-fill modules"
              >
                <Layers className="w-3.5 h-3.5" /> New Field Segment
              </button>

              <button
                type="button"
                onClick={() => handleGenerateDefaultArray(20, 14)}
                className="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                title="Auto-fill sample 25-panel rooftop array on current location"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Roof
              </button>

              {roofPolygon && roofPolygon.length >= 3 && (
                <button
                  type="button"
                  onClick={() => setIsAdjustingPosition(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 text-xs shadow-xs cursor-pointer ${isAdjustingPosition
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black animate-pulse"
                    : "bg-slate-800 text-sky-400 border border-sky-700/60 hover:bg-slate-700"
                    }`}
                  title={isAdjustingPosition ? "Click to lock solar array position in place" : "Click to show center handle and drag array across rooftop"}
                >
                  {isAdjustingPosition ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> ✓ Confirm & Lock Position
                    </>
                  ) : (
                    <>
                      <span className="text-sm leading-none font-bold">✥</span> Adjust Array
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleJumpToPlates}
                className="px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
                title="Center map directly onto the solar plates"
              >
                <Crosshair className="w-3.5 h-3.5" /> 🎯 Jump to Plates
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCadTool("PAN_VIEW");
                  setIs3DMode(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-xs cursor-pointer ${activeCadTool === "PAN_VIEW" ? "bg-slate-700 text-white font-bold" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
                title="Pan / Navigate Map"
              >
                <Hand className="w-3.5 h-3.5" /> Pan Map
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCadTool("ROOF_BOX");
                  setIs3DMode(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-xs cursor-pointer ${activeCadTool === "ROOF_BOX" ? "bg-emerald-600 text-white shadow-xs font-bold" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
                title="Snap Box Array (2 Clicks)"
              >
                <Square className="w-3.5 h-3.5" /> Snap Box
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCadTool("OBSTACLE_CIRCLE");
                  setIs3DMode(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-xs cursor-pointer ${activeCadTool === "OBSTACLE_CIRCLE" ? "bg-amber-600 text-white shadow-xs font-bold" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
                title="Mark Circular Keepout Tank"
              >
                <Plus className="w-3.5 h-3.5" /> Keepout
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCadTool("MANUAL_INSPECT");
                  setIs3DMode(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-xs cursor-pointer ${activeCadTool === "MANUAL_INSPECT" ? "bg-emerald-600 text-white shadow-xs font-bold" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
                title="Inspect modules / click to remove or right-click roof edge to align"
              >
                <Eye className="w-3.5 h-3.5" /> Inspect / Align
              </button>

              <button
                type="button"
                onClick={() => setShowElectricalLayer(prev => !prev)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 text-xs cursor-pointer ${showElectricalLayer || cadSubTab === "STRINGING"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-xs"
                  : "bg-slate-800 text-cyan-400 border border-cyan-800/80 hover:bg-slate-700"
                  }`}
                title="Toggle Electrical Layer: Inverters, Strings & Conduit Homerun"
              >
                <Zap className="w-3.5 h-3.5" /> ⚡ Electrical Layer
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                onChange={(e) => {
                  const hub = PAKISTAN_HUBS.find(h => h.name === e.target.value);
                  if (hub) {
                    setSiteLat(hub.lat);
                    setSiteLng(hub.lng);
                    setLocationLabel(hub.name);
                    if (map.current) map.current.flyTo([hub.lat, hub.lng], 19, { animate: true });
                  }
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 max-w-[130px] truncate"
              >
                <option value="">Jump City...</option>
                {PAKISTAN_HUBS.map(h => (
                  <option key={h.name} value={h.name}>{h.name}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl shadow-lg">
                <button
                  type="button"
                  onClick={handleUndoPoint}
                  disabled={(!activeDrawingPoints || activeDrawingPoints.length === 0) && (!activePolygon || activePolygon.length === 0)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer transition"
                  title="Undo last point (Backspace / Ctrl+Z)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Undo Point
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={(!activeDrawingPoints || activeDrawingPoints.length === 0) && (!activePolygon || activePolygon.length === 0)}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/50 disabled:opacity-40 disabled:hover:bg-rose-950/40 rounded-lg flex items-center gap-1 cursor-pointer transition"
                  title="Clear entire roof and reset (Escape / Delete)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Actual Leaflet Map Canvas */}
          <div id="cad-leaflet-map" ref={mapRef} className="w-full flex-1 relative bg-slate-950">
            {/* Photorealistic 60FPS HelioScope Vector Engine Canvas Overlay */}
            {mapReady && map.current && !is3DMode && (
              <HelioScopeCanvasOverlay
                ref={overlayRef}
                map={map.current}
                activeCadTool={activeCadTool}
                setActiveCadTool={setActiveCadTool}
                selectedModuleKey={selectedModuleKey}
                orientation={orientation}
                tiltDegrees={tiltDegrees}
                azimuthDegrees={azimuthDegrees}
                setAzimuthDegrees={setAzimuthDegrees}
                setbackMeters={setbackMeters}
                solarElevation={solarPosition.elevationDeg}
                sunAltitudeDeg={solarPosition.elevationDeg}
                solarAzimuth={solarPosition.azimuthDeg}
                sunAzimuthDeg={solarPosition.azimuthDeg}
                showShadows={showShadows}
                roofPolygon={roofPolygon}
                activePolygon={roofPolygon}
                setRoofPolygon={setRoofPolygon}
                targetKwP={targetKwp}
                activeDrawingPoints={activeDrawingPoints}
                setActiveDrawingPoints={setActiveDrawingPoints}
                rackingType={rackingType}
                onUndoLastPoint={handleUndoLastPoint}
                onClearDrawing={handleClearDrawing}
                keepouts={keepouts}
                onAddObstacle={(obs) => {
                  setKeepouts(prev => [...prev, { id: `obs-c-${Date.now()}`, type: "CIRCLE", ...obs }]);
                }}
                newObstacleRadius={newObstacleRadius}
                newObstacleHeight={newObstacleHeight}
                onArrayCalculated={handleArrayCalculated}
                removedModuleIds={removedModuleIds}
                onToggleModule={(id) => {
                  if (isLocked) return;
                  // ★ Shading tab pe panel click-to-remove band (accidental deletes khatam)
                  if (cadSubTab === "SHADING") return;
                  setRemovedModuleIds(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
                isLocked={isLocked}
                siteLatitude={siteLat}
                targetCapacityMode={targetCapacityMode}
                targetKwp={targetKwp}
                manualSegments={manualSegments}
                gridOffset={gridOffset}
                setGridOffset={setGridOffset}
                isAdjustingPosition={isAdjustingPosition}
                setIsAdjustingPosition={setIsAdjustingPosition}
                rowSpacing={rowSpacingM}
                shadowPitch={null}
                arrayScale={arrayScale}
                clearTrigger={clearTrigger}
                colSpacing={moduleSpacingM}
                frameSizeUp={frameSizeUp}
                frameSizeWide={frameSizeWide}
                frameSpacing={frameSpacingM}
                gridAlignment={gridAlignment}
                showElectricalLayer={showElectricalLayer || cadSubTab === "STRINGING"}
                inverterModel={selectedInverterModel}
                inverterCapacityKw={inverterCapacityKw}
                targetStringSize={targetStringSize}
                simOverride={cadSubTab === "SHADING"}
              />
            )}

            {/* Floating Live GPS & Locate Me Button */}
            {!is3DMode && (
              <button
                type="button"
                onClick={handleGPS}
                disabled={isLocating}
                className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition active:scale-95 cursor-pointer backdrop-blur"
                title="Locate live physical GPS coordinates via high-accuracy Geolocation"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-amber-400" : "text-emerald-400"}`} />
                <span>{isLocating ? "Locating..." : "Locate Me (GPS)"}</span>
              </button>
            )}

            {/* Floating Scale Controller */}
            {!is3DMode && (
              <div className="absolute bottom-16 right-3 z-[1000] bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 shadow-xl flex flex-col gap-1 text-white select-none backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-300 font-semibold">Scale:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setArrayScale((prev) => Math.max(0.5, Number((prev - 0.05).toFixed(2))));
                        if (overlayRef.current?.requestRedraw) overlayRef.current.requestRedraw();
                      }}
                      className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 rounded-lg font-bold text-sm cursor-pointer transition text-slate-200"
                      title="Decrease size (- key)"
                    >
                      -
                    </button>
                    <span className="font-mono text-emerald-400 font-bold text-sm w-12 text-center">
                      {Math.round(arrayScale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setArrayScale((prev) => Math.min(1.5, Number((prev + 0.05).toFixed(2))));
                        if (overlayRef.current?.requestRedraw) overlayRef.current.requestRedraw();
                      }}
                      className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 rounded-lg font-bold text-sm cursor-pointer transition text-slate-200"
                      title="Increase size (+ key)"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center font-mono">
                  Hotkeys: <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">+/-</kbd> Scale
                </div>
              </div>
            )}

            {/* Satellite Layer Switcher */}
            {!is3DMode && (
              <div className="absolute bottom-3 right-3 z-[1000] flex bg-slate-900/90 backdrop-blur p-0.5 rounded-xl border border-slate-700 text-xs shadow-xl">
                <button
                  onClick={() => setMapLayer("esri")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${mapLayer === "esri" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-slate-100"}`}
                >
                  Esri
                </button>
                <button
                  onClick={() => setMapLayer("google")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${mapLayer === "google" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-slate-100"}`}
                >
                  Google
                </button>
                <button
                  onClick={() => setMapLayer("osm")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${mapLayer === "osm" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-slate-100"}`}
                >
                  OSM
                </button>
              </div>
            )}

            {/* Embedded 3D Scene Layer */}
            {viewportMode === "3D" && (
              <div className="absolute inset-0 z-[1000] w-full h-full pointer-events-none">
                <div className="w-full h-full pointer-events-auto">
                  <HelioScope3DView
                    mapInstance={map.current}
                    roofPolygon={roofPolygon}
                    keepouts={keepouts}
                    // FIX: Combine cachedPanels with manualSegments panels for complete 3D synchronization
                    panels={[...cachedPanels, ...manualSegments.flatMap(seg => seg.panels || [])]}
                    rackingType={rackingType}
                    tiltDegrees={tiltDegrees}
                    azimuthDegrees={azimuthDegrees}
                    onAzimuthChange={setAzimuthDegrees}
                    initialSolarHour={solarHour}
                    siteLatitude={siteLat}
                    siteLongitude={siteLng}
                    systemStats={systemStats}
                    isEmbedded={true}
                    onClose={() => {
                      setViewportMode("2D");
                      setTimeout(() => {
                        if (map.current) map.current.invalidateSize();
                      }, 50);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Horizontal Metrics Bar Below Map */}
          <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-2.5 flex items-center justify-around text-xs shrink-0 z-10 shadow-lg">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">System Size</span>
              <span className="text-sm font-black text-emerald-400 font-mono leading-tight">
                {activeKwp > 0 ? `${activeKwp.toFixed(1)} kWp` : "0.0 kWp"}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Module Count</span>
              <span className="text-sm font-black text-slate-100 font-mono leading-tight">
                {activeModulesCount} <span className="text-[10px] font-normal text-slate-400">Qty</span>
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Annual Production</span>
              <span className="text-sm font-black text-emerald-400 font-mono leading-tight">
                {activeKwp > 0 ? `${((activeKwp * 1550) / 1000).toFixed(1)} MWh/yr` : "0.0 MWh/yr"}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Performance Ratio</span>
              <span className="text-sm font-black text-emerald-400 font-mono leading-tight">
                {activeModulesCount > 0 ? (
                  <>81.5% <span className="text-[10px] font-normal text-slate-400">PR</span></>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Energy Yield</span>
              <span className="text-sm font-black text-amber-400 font-mono leading-tight">
                1,550 <span className="text-[10px] font-normal text-slate-400">kWh/kWp</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: EQUIPMENT CATALOG */}
      {cadSubTab === "CATALOG" && (
        <HelioScopeCatalog
          activePanelKey={selectedModuleKey}
          activeInverterModel={selectedInverterModel}
          activeRackingName={rackingType}
          onSelectPanel={(panel) => {
            setSelectedModuleKey(panel.modelName);
            if (setModuleWattage) setModuleWattage(panel.wattage);
            handleSaveDesign({ selectedPanelModel: panel.modelName, panelWattage: panel.wattage });
          }}
          onSelectInverter={(inv) => {
            userOverrodeInverterRef.current = true;
            setSelectedInverterModel(inv.modelName);
            setInverterCapacityKw(inv.ratedAcOutputKw);
            handleSaveDesign({ selectedInverterModel: inv.modelName, inverterCapacityKw: inv.ratedAcOutputKw });
          }}
          onSelectRacking={(rck) => {
            setRackingType(rck.name);
            handleSaveDesign({ rackingType: rck.name });
          }}
        />
      )}

      {/* SECTION 2: SITE SETUP */}
      {cadSubTab === "SITE_SETUP" && (
        <HelioScopeSiteSetup
          activeProject={activeProject}
          siteLat={siteLat}
          setSiteLat={setSiteLat}
          siteLng={siteLng}
          setSiteLng={setSiteLng}
          onProceedToDesigner={() => setCadSubTab("LAYOUT")}
          onSaveDesign={handleSaveDesign}
        />
      )}

      {/* ★ SECTION 4: SHADING — CAD map ke sath MERGED (upar sidebar mein).
          Standalone section removed — no duplicate. */}

      {/* SECTION 5: ELECTRICAL STRINGING & WIRING DESIGN */}
      {cadSubTab === "STRINGING" && (
        <HelioScopeElectricalDesign
          systemStats={systemStats}
          selectedModuleKey={selectedModuleKey}
          inverterCapacityKw={inverterCapacityKw}
          setInverterCapacityKw={setInverterCapacityKw}
          selectedInverterModel={selectedInverterModel}
          stringingAnalysis={stringingAnalysis}
        />
      )}

      {/* SECTION 6: PRODUCTION & ENERGY ESTIMATE */}
      {cadSubTab === "PRODUCTION" && (
        <HelioScopeProductionReport
          systemStats={systemStats}
          tiltDegrees={tiltDegrees}
          azimuthDegrees={azimuthDegrees}
          siteLat={siteLat}
          productionAnalysis={productionAnalysis}
        />
      )}

      {/* SECTION 7: PROPOSAL & REPORT EXPORT */}
      {cadSubTab === "REPORT" && (
        <HelioScopeReportExport
          activeProject={activeProject}
          systemStats={systemStats}
          selectedModuleKey={selectedModuleKey}
          selectedInverterModel={selectedInverterModel}
          inverterCapacityKw={inverterCapacityKw}
          rackingType={rackingType}
          tiltDegrees={tiltDegrees}
          azimuthDegrees={azimuthDegrees}
          siteLat={siteLat}
          siteLng={siteLng}
          stringingAnalysis={stringingAnalysis}
          productionAnalysis={productionAnalysis}
          onSyncWithBOQ={onSyncWithBOQ}
        />
      )}
    </div>
  );
}