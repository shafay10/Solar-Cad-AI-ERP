import React, { useState, useEffect, useRef } from "react";
import {
  MapPin, Navigation, Compass, Building2, Upload, Eye, EyeOff,
  CheckCircle2, ArrowRight, Layers, Sliders, Info, ShieldCheck, Zap
} from "lucide-react";
import L from "leaflet";

const PAKISTAN_HUBS = [
  { name: "Islamabad (Capital)", lat: 33.6844, lng: 73.0479 },
  { name: "Lahore (Punjab)", lat: 31.5204, lng: 74.3587 },
  { name: "Karachi (Sindh)", lat: 24.8607, lng: 67.0011 },
  { name: "Multan (South Punjab)", lat: 30.1575, lng: 71.5249 },
  { name: "Faisalabad (Industrial)", lat: 31.4504, lng: 73.1350 },
  { name: "Peshawar (KPK)", lat: 34.0151, lng: 71.5249 },
  { name: "Quetta (Balochistan)", lat: 30.1798, lng: 66.9750 }
];

const ROOF_TYPES = [
  { id: "RCC Flat", label: "RCC Concrete Flat Terrace", defaultTilt: 18, desc: "Standard flat roof requiring elevated or balasted HDG mounting" },
  { id: "Slanted Metal", label: "Slanted Industrial Metal Shed", defaultTilt: 10, desc: "Trapezoidal or corrugated sheet with rail-less clamps" },
  { id: "Ground Mount", label: "Ground-Mount Field Array", defaultTilt: 25, desc: "Rammed earth piling or concrete footing structure" },
  { id: "Carport", label: "Commercial Carport Canopy", defaultTilt: 8, desc: "Waterproof structural steel canopy over vehicle parking" },
  { id: "Elevated Walkable", label: "Elevated Walkable Terrace (L3)", defaultTilt: 15, desc: "High-clearance frame preserving terrace usable space" }
];

const GRID_CONNECTIONS = [
  { id: "3-Phase 400V Net-Metering", label: "3-Phase 400V Net-Metering (WAPDA / DISCO)", desc: "Standard commercial & residential bi-directional net export" },
  { id: "Single-Phase 230V Net-Metering", label: "Single-Phase 230V Residential (Up to 5kW)", desc: "Smaller residential net metering" },
  { id: "Off-Grid Diesel Hybrid", label: "Off-Grid Remote Microgrid (Zero Export)", desc: "Industrial diesel generator fuel-saver synchronization" },
  { id: "ESS Battery Storage Hybrid", label: "Hybrid On-Grid with High-Voltage Lithium ESS", desc: "Uninterrupted backup power + peak tariff time-of-use shaving" }
];

export default function HelioScopeSiteSetup({
  activeProject,
  siteLat,
  setSiteLat,
  siteLng,
  setSiteLng,
  onProceedToDesigner,
  onSaveDesign
}) {
  const [address, setAddress] = useState(activeProject?.siteAddress || "");
  const [clientName, setClientName] = useState(activeProject?.clientName || "Valued Solar Client");
  const [roofType, setRoofType] = useState("RCC Flat");
  const [usableAreaM2, setUsableAreaM2] = useState(250);
  const [gridConnection, setGridConnection] = useState("3-Phase 400V Net-Metering");

  // Reference Blueprint / Drone image overlay
  const [overlayImage, setOverlayImage] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(60);

  const [isLocating, setIsLocating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Mini-map ref for pinpointing GPS
  const miniMapContainer = useRef(null);
  const miniMap = useRef(null);
  const markerRef = useRef(null);

  // Initialize interactive location picker map
  useEffect(() => {
    if (!miniMapContainer.current) return;
    if (miniMap.current) return;

    const lat = siteLat || 33.6844;
    const lng = siteLng || 73.0479;

    const instance = L.map(miniMapContainer.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      crossOrigin: true
    }).addTo(instance);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(instance);
    marker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      setSiteLat(parseFloat(pos.lat.toFixed(6)));
      setSiteLng(parseFloat(pos.lng.toFixed(6)));
    });

    instance.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setSiteLat(parseFloat(e.latlng.lat.toFixed(6)));
      setSiteLng(parseFloat(e.latlng.lng.toFixed(6)));
    });

    miniMap.current = instance;
    markerRef.current = marker;

    return () => {
      if (miniMap.current) {
        miniMap.current.remove();
        miniMap.current = null;
      }
    };
  }, []);

  // Sync marker when lat/lng updates
  useEffect(() => {
    if (miniMap.current && markerRef.current && siteLat && siteLng) {
      markerRef.current.setLatLng([siteLat, siteLng]);
      miniMap.current.setView([siteLat, siteLng], miniMap.current.getZoom(), { animate: true });
    }
  }, [siteLat, siteLng]);

  // GPS Device Locator
  const handleGetDeviceGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported by this browser");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setSiteLat(lat);
        setSiteLng(lng);
      },
      (err) => {
        setIsLocating(false);
        alert("GPS Error: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Image Upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setOverlayImage(loadEvt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Site Setup to Database & Project
  const handleSaveSetup = async () => {
    const payload = {
      siteAddress: address,
      latitude: siteLat,
      longitude: siteLng,
      roofType,
      usableAreaSqM: usableAreaM2,
      gridConnectionType: gridConnection,
      satelliteImageUrl: overlayImage || null
    };

    if (onSaveDesign) {
      await onSaveDesign(payload);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    if (onProceedToDesigner) {
      onProceedToDesigner();
    }
  };

  const sqFt = Math.round(usableAreaM2 * 10.7639);
  const estKwPotential = (usableAreaM2 * 0.16).toFixed(1); // approx 160W/m²

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          2. Solar Project & Site Setup
        </h2>
        <p className="text-xs text-slate-500">
          Configure site GPS coordinates, geographical sun irradiation hub, roof superstructure, and utility interconnection details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Columns: Form Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section A: Project & Client Address */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Site Identity & Geolocation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Project Code</label>
                <input
                  type="text"
                  disabled
                  value={activeProject?.projectCode || "SOL-PRJ-2026-001"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-bold mb-1">Full Site Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street, Industrial Estate / Sector, City, Pakistan"
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
            </div>

            {/* GPS Inputs & Quick Hub Selectors */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700">GPS Coordinates (Decimal Degrees)</label>
                <button
                  onClick={handleGetDeviceGPS}
                  disabled={isLocating}
                  className="text-xs text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {isLocating ? "Acquiring GPS..." : "Auto-Locate Device GPS"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Latitude (°N)</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={siteLat || 33.6844}
                    onChange={e => setSiteLat(parseFloat(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Longitude (°E)</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={siteLng || 73.0479}
                    onChange={e => setSiteLng(parseFloat(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Regional Pakistan Hub Fast Selector */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">
                  Fast Presets (Pakistani Solar Hubs):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PAKISTAN_HUBS.map(hub => (
                    <button
                      key={hub.name}
                      type="button"
                      onClick={() => {
                        setSiteLat(hub.lat);
                        setSiteLng(hub.lng);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-md text-[10px] font-bold border border-slate-200 transition cursor-pointer"
                    >
                      {hub.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Roof Superstructure & Usable Area */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Roof Superstructure & Usable Footprint
            </h3>

            {/* Roof Type Selection */}
            <div className="space-y-2">
              <label className="block text-slate-600 font-bold">Roof / Ground Installation Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROOF_TYPES.map(rt => (
                  <div
                    key={rt.id}
                    onClick={() => setRoofType(rt.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      roofType === rt.id
                        ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{rt.label}</span>
                      {roofType === rt.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{rt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Usable Area Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Usable Roof Area (Square Meters - m²)</label>
                <input
                  type="number"
                  value={usableAreaM2}
                  onChange={e => setUsableAreaM2(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Equivalent Square Feet (sq ft)</label>
                <input
                  type="text"
                  disabled
                  value={`${sqFt.toLocaleString()} sq ft`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Area kW capacity indicator */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Estimated Solar Capacity Potential for this Area:</span>
              </div>
              <span className="font-mono font-extrabold text-emerald-900 text-sm">
                ~{estKwPotential} kWp DC
              </span>
            </div>
          </div>

          {/* Section C: Utility Grid Interconnection */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Utility Grid Interconnection & DISCO Net-Metering
            </h3>

            <div className="space-y-2">
              {GRID_CONNECTIONS.map(gc => (
                <label
                  key={gc.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    gridConnection === gc.id
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="gridConnection"
                    value={gc.id}
                    checked={gridConnection === gc.id}
                    onChange={() => setGridConnection(gc.id)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">{gc.label}</span>
                    <span className="text-[10px] text-slate-500">{gc.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Site setup saved successfully!
              </span>
            )}
            <button
              onClick={handleSaveSetup}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <span>Save & Proceed to Array Designer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Interactive Map Picker & Site Reference Overlay */}
        <div className="lg:col-span-5 space-y-5">
          {/* Map Pinpoint Picker */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500" />
                Interactive Map Location Pinpoint
              </span>
              <span className="text-[10px] text-slate-400">Click or drag pin to adjust</span>
            </div>

            <div
              ref={miniMapContainer}
              className="w-full h-72 rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0"
            />
            <p className="text-[10px] text-slate-500">
              Center coordinates: <strong className="font-mono text-slate-700">{siteLat}°N, {siteLng}°E</strong>
            </p>
          </div>

          {/* Site Reference Blueprint / Drone Image Upload */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
              <Upload className="w-4 h-4 text-emerald-600" />
              Site Layout / Drone Orthophoto Overlay
            </h3>
            <p className="text-[11px] text-slate-500">
              Upload an architectural roof plan, AutoCAD floor blueprint, or high-res drone photo to trace over satellite imagery.
            </p>

            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="site-blueprint-upload"
              />
              <label htmlFor="site-blueprint-upload" className="cursor-pointer block">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="font-bold text-emerald-700 block">Click to upload blueprint or drone image</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WebP up to 10MB</span>
              </label>
            </div>

            {overlayImage && (
              <div className="space-y-3 pt-2">
                <div className="relative h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
                  <img
                    src={overlayImage}
                    alt="Blueprint Preview"
                    className="max-h-full max-w-full object-contain"
                    style={{ opacity: overlayOpacity / 100 }}
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded font-mono">
                    Opacity: {overlayOpacity}%
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-600 font-bold shrink-0">Overlay Opacity:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={overlayOpacity}
                    onChange={e => setOverlayOpacity(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <button
                    onClick={() => setOverlayImage(null)}
                    className="text-[10px] text-red-600 hover:underline font-bold shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
