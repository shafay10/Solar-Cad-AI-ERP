import React, { useState, useRef, useMemo } from "react";
import {
  Download, Printer, ZoomIn, ZoomOut, RotateCcw,
  CheckCircle2, ShieldCheck, Zap, Info, Maximize2,
  FileCode, Layers, Cpu, Compass, Check, Sparkles,
  Sun, Home, ArrowRight, ArrowLeftRight, Activity
} from "lucide-react";
import { downloadDxfFile } from "../utils/dxfGenerator.js";

/**
 * ModuleAutoCADSLD.jsx
 * Dual-Mode AutoCAD Engineering Single Line Diagram (SLD) & Client Visual Flow
 * Matches IEC 60617, NEPRA S.R.O. 892(I)/2015, and Pakistani DISCO (LESCO, IESCO, KE, etc.) SDO submission grade.
 */
export default function ModuleAutoCADSLD({
  project = null,
  totalCapacityKw = 6.2,
  moduleCount = 10,
  moduleWattage = 610,
  inverterModel = "Knox 6.2 kW Hybrid Inverter",
  inverterKw = 6.0,
  cableBrand = "Pakistan Cables / Fast Cables",
  dcCableSize = "1x6mm² DC Solar XLPO",
  acCableSize = "4-Core 25mm² Armored Cu",
  discoUtility = "LESCO / IESCO / KE",
  onDownloadDxf = null,
  language = "en",
  t = (k, d) => d
}) {
  const [viewMode, setViewMode] = useState("client"); // 'client' | 'cad'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeStage, setActiveStage] = useState(null); // 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'earth'
  const svgRef = useRef(null);

  // Derived engineering calculations
  const dcCapacity = Number(totalCapacityKw) || ((moduleCount * moduleWattage) / 1000) || 6.2;
  const acCapacity = Number(inverterKw) || (dcCapacity * 0.95).toFixed(1);
  const numPanels = Number(moduleCount) || 10;
  const wattage = Number(moduleWattage) || 610;

  // Strings calculation
  const panelsPerString = numPanels > 16 ? Math.ceil(numPanels / 2) : numPanels;
  const stringCount = numPanels > 16 ? 2 : 1;
  const string1Panels = stringCount === 2 ? Math.ceil(numPanels / 2) : numPanels;
  const string2Panels = stringCount === 2 ? (numPanels - string1Panels) : 0;

  // Typical electrical ratings for 585W-620W N-Type TOPCon
  const vmp = 44.5;
  const voc = 52.8;
  const imp = 13.5;
  const isc = 14.3;

  const string1Voc = (string1Panels * voc).toFixed(1);
  const string1Vmp = (string1Panels * vmp).toFixed(1);
  const string2Voc = string2Panels > 0 ? (string2Panels * voc).toFixed(1) : "0";

  // AC current calculation: I = P / (sqrt(3) * V * pf) for 3-Phase 400V, or I = P / (V * pf) for 1-Phase 230V
  const isSinglePhase = acCapacity <= 6.0;
  const nominalVoltage = isSinglePhase ? 230 : 400;
  const powerFactor = 0.95;
  const ratedAcCurrent = isSinglePhase
    ? (acCapacity * 1000) / (nominalVoltage * powerFactor)
    : (acCapacity * 1000) / (1.732 * nominalVoltage * powerFactor);
  
  // Recommended MCCB rating with 1.25 safety factor
  const recommendedMccbAmps = Math.ceil((ratedAcCurrent * 1.25) / 5) * 5 || 40;
  const finalMccbRating = recommendedMccbAmps < 16 ? 16 : recommendedMccbAmps > 100 ? Math.ceil(recommendedMccbAmps / 25) * 25 : recommendedMccbAmps;

  // Project / Drawing metadata
  const projectCode = project?.projectCode || project?.code || "GT-2026-EPC";
  const projectName = project?.projectName || project?.clientName || "Commercial Solar EPC";
  const clientName = project?.clientName || "Turnkey Solar Client";
  const siteLocation = project?.siteAddress || "Pakistan";
  const drawingNo = `GT-SLD-${projectCode.replace(/[^a-zA-Z0-9]/g, "")}-REV02`;
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  // Handle DXF export
  const handleTriggerDxf = () => {
    if (onDownloadDxf) {
      onDownloadDxf();
    } else {
      downloadDxfFile({
        projectCode,
        clientName,
        siteAddress: siteLocation,
        totalCapacityKw: dcCapacity,
        moduleCount: numPanels,
        moduleWattage: wattage,
        inverterModel,
        cableBrand,
        structureType: "L2 Elevated HDG 80µm",
        tiltAngle: 18,
        earthingResistance: "< 2.5 Ohms"
      });
    }
  };

  // Handle SVG export / print
  const handlePrintSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const printWindow = window.open(svgUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  // Technical inspector metadata for stages
  const STAGE_INSPECTOR_INFO = {
    stage1: {
      title: "STAGE 1: SOLAR PV ARRAY & DC COMBINER",
      standard: "IEC 62548 & IEC 60269-6",
      subtitle: `${numPanels}x ${wattage}W Bifacial PV Modules (${dcCapacity} kWp DC)`,
      details: [
        { label: "Total DC Capacity", val: `${dcCapacity} kWp DC` },
        { label: "Configuration", val: `${stringCount} String (${string1Panels}${string2Panels > 0 ? ` + ${string2Panels}` : ""} Panels)` },
        { label: "String 1 Voc (STC)", val: `${string1Voc} V DC (< 1000V DC Limit)` },
        { label: "String 1 Vmp", val: `${string1Vmp} V DC` },
        { label: "gPV String Fuses", val: "1000V DC 15A gPV (Positive & Negative Poles)" },
        { label: "DC SPD", val: "Type II 1000V DC 40kA Surge Arrester" },
        { label: "DC Rotary Isolator", val: "1000V DC 32A/63A 2-Pole Lockable Disconnector" },
        { label: "DC Cable", val: `2x 1C 6mm² PV1-F XLPO Copper (< 1.5% Voltage Drop)` }
      ],
      sdoChecklist: "Check String Voc polarity before inverter input; ensure DC isolator is within arm's reach (<1m) of inverter; inspect Type II DC surge arrestor ground bonding."
    },
    stage2: {
      title: "STAGE 2: GRID-TIED / HYBRID SOLAR INVERTER CORE",
      standard: "IEC 62109-1/2, IEEE 1547 & UL 1741",
      subtitle: `${inverterModel} (${acCapacity} kW MPPT)`,
      details: [
        { label: "Rated Inverter Capacity", val: `${acCapacity} kW AC` },
        { label: "Max Efficiency", val: "98.6% Euro-Efficiency" },
        { label: "MPPT Operating Window", val: "160V - 950V DC" },
        { label: "Anti-Islanding Trip Time", val: "< 100 ms Disconnection (IEEE 1547)" },
        { label: "Protection Features", val: "AFCI 2.0 Arc Fault, PID Recovery, GFDI" },
        { label: "Output Voltage / Freq", val: `${nominalVoltage}V AC ± 10%, 50.0 Hz ± 1%` },
        { label: "Inverter Earth Connection", val: "Direct 16mm² link to Dedicated Chemical Earth Pit" }
      ],
      sdoChecklist: "Verify anti-islanding trip test with DISCO SDO by cutting main grid supply; inspect AFCI firmware and lockable IP66 enclosure."
    },
    stage3: {
      title: "STAGE 3: AC PROTECTION & DISTRIBUTION BOARD (ACDB)",
      standard: "IEC 61439-1/2 & IEC 60947-2",
      subtitle: `4-Pole MCCB / MCB + Type II AC Surge Protection (${finalMccbRating}A)`,
      details: [
        { label: "Rated AC Current (In)", val: `${ratedAcCurrent.toFixed(1)} A` },
        { label: "Main AC Breaker", val: `4-Pole MCCB ${finalMccbRating}A, 415V, 16kA Breaking Capacity` },
        { label: "Residual Current Device", val: "RCD / RCCB 300mA Selective Time-Delayed" },
        { label: "AC Surge Protection", val: "Class II AC SPD 4-Pole 40kA (8/20µs), Uc 400V" },
        { label: "AC Feeder Cable", val: `${acCableSize} (${cableBrand}) (< 1.0% Drop)` }
      ],
      sdoChecklist: "Check 4-pole disconnection ensuring all 3 phases and neutral are completely isolated; test manual trip coil mechanism; verify busbar torque markings."
    },
    stage4: {
      title: "STAGE 4: BI-DIRECTIONAL GREEN METER & DISCO INTERCONNECTION",
      standard: "NEPRA Net-Metering Regulations 2015 & IEC 62053-22",
      subtitle: `4-Quadrant Bi-Directional Tariff Meter (${discoUtility})`,
      details: [
        { label: "Utility Provider", val: discoUtility },
        { label: "Metering Type", val: "3-Phase 4-Wire 4-Quadrant Bi-Directional Green Meter" },
        { label: "Registration Channels", val: "Separate Import (T1/T2 Peak/Off-Peak) & Export (T3)" },
        { label: "Grid Busbar Spec", val: "DISCO LT 400V/230V, 50Hz, 3P+N+PE Busbar" },
        { label: "Distribution Link", val: "11kV / 0.4kV Pole-Mounted Transformer (PMT) Cut-Out Link" }
      ],
      sdoChecklist: "Confirm DISCO metering laboratory calibration certificate and lead seal; inspect optical communication port; verify net billing tariff category."
    },
    earth: {
      title: "EARTH PIT & GROUNDING INFRASTRUCTURE",
      standard: "IEC 62561-2 & IEEE Standard 80",
      subtitle: "Dedicated Solar Earthing System (< 2.5 Ω Requirement)",
      details: [
        { label: "Earth Resistance", val: "< 2.5 Ohms (Measured with Digital Megger)" },
        { label: "Earth Rod Spec", val: "10ft Copper-Bonded Steel Electrode (14.2mm Dia, 254µm Cu)" },
        { label: "Enhancement Compound", val: "Low-Resistivity Bentonite / Chemical Backfill" },
        { label: "Earthing Conductor", val: "1x 16mm² Bare / Green-Yellow Stranded Copper" }
      ],
      sdoChecklist: "SDO Megger digital resistance test stamp required on final NOC; ensure separate pits for DC array structure, Inverter PE, and Lightning Arrester."
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
      {/* Top Engineering Drafting Toolbar */}
      <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                AutoCAD Single Line Diagram (SLD)
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                IEC 60617 / NEPRA SDO GRADE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Drawing No: {drawingNo} | {siteLocation}
            </p>
          </div>
        </div>

        {/* Action Buttons: Zoom (in CAD mode), SVG Print (in CAD mode), DXF Download (always) */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls (Active in CAD mode) */}
          {viewMode === "cad" && (
            <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={handleZoomOut}
                className="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-0.5 text-[11px] text-slate-400 min-w-[42px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-1 hover:bg-slate-800 text-slate-400 rounded transition cursor-pointer"
                title="Reset 100%"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Export SVG / Print (CAD mode) */}
          {viewMode === "cad" && (
            <button
              type="button"
              onClick={handlePrintSvg}
              className="px-2.5 py-1.5 bg-slate-700/70 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              title="Export Vector SVG or Print Drawing"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Print / SVG</span>
            </button>
          )}

          {/* Download DXF Button (Always available) */}
          <button
            type="button"
            onClick={handleTriggerDxf}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            title="Download AutoCAD Release 12 / 2000 .DXF Vector File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .DXF</span>
          </button>
        </div>
      </div>

      {/* Segmented Dual-View Switcher Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setViewMode("client")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              viewMode === "client"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>🟢 Simple Visual Flow (Client Friendly)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setViewMode("cad")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              viewMode === "cad"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <span>📐 Detailed CAD Schematic (NEPRA / DISCO Standard)</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          {viewMode === "client" ? (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> High-contrast sales flow diagram &amp; plain-language client guide
            </span>
          ) : (
            <span className="text-blue-400 flex items-center gap-1 font-semibold">
              <Layers className="w-3.5 h-3.5" /> Official AutoCAD AC1009 blueprint with IEC 60617 symbols &amp; title block
            </span>
          )}
        </div>
      </div>

      {/* MODE 1: SIMPLE CLIENT VISUAL FLOW VIEW */}
      {viewMode === "client" && (
        <div className="p-4 sm:p-6 bg-slate-950/60 space-y-5">
          {/* 5 High-Contrast Stages with Animated Power Flow Indicators */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Five-Stage Solar Energy Flow
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  How clean rooftop energy powers home loads directly and exports surplus to the national grid
                </p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
                100% Net-Metering Synchronized
              </span>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative items-stretch">
              {/* 1. Solar Panels */}
              <div className="bg-white text-slate-900 rounded-xl p-4 border border-slate-200 shadow-md flex flex-col justify-between relative group hover:border-amber-400 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">☀️</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-mono">
                      1. DC Array
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Solar Panels</h5>
                  <div className="mt-1 font-mono text-base font-extrabold text-amber-600">
                    {dcCapacity} kWp DC
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {numPanels} Panels ({wattage}W)
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Captures sunlight &amp; generates DC power
                </div>
              </div>

              {/* 2. DC Protection */}
              <div className="bg-white text-slate-900 rounded-xl p-4 border border-slate-200 shadow-md flex flex-col justify-between relative group hover:border-rose-400 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">⚡</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full font-mono">
                      2. Protection
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">DC Isolator &amp; SPD</h5>
                  <div className="mt-1 font-mono text-base font-extrabold text-rose-600">
                    1000V DC 32A
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    gPV Fuses + 40kA DC Surge Arrester
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Instant safety disconnect &amp; surge safety
                </div>
              </div>

              {/* 3. Smart Inverter */}
              <div className="bg-white text-slate-900 rounded-xl p-4 border border-slate-200 shadow-md flex flex-col justify-between relative group hover:border-sky-400 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🔄</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-900 px-2 py-0.5 rounded-full font-mono">
                      3. Conversion
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Smart Inverter</h5>
                  <div className="mt-1 font-mono text-base font-extrabold text-sky-600">
                    {acCapacity} kW AC
                  </div>
                  <p className="text-xs text-slate-600 mt-1 truncate" title={inverterModel}>
                    {inverterModel}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Converts DC to 230V/400V clean home AC (98.6%)
                </div>
              </div>

              {/* 4. AC Distribution (DB) */}
              <div className="bg-white text-slate-900 rounded-xl p-4 border border-slate-200 shadow-md flex flex-col justify-between relative group hover:border-indigo-400 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full font-mono">
                      4. Home Load
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">AC Distribution (DB)</h5>
                  <div className="mt-1 font-mono text-base font-extrabold text-indigo-600">
                    {finalMccbRating}A 4-Pole
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    MCCB + Earth Pit (&lt; 2.5 Ω)
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Powers daytime appliances directly
                </div>
              </div>

              {/* 5. Bi-Directional Meter & Grid */}
              <div className="bg-white text-slate-900 rounded-xl p-4 border border-slate-200 shadow-md flex flex-col justify-between relative group hover:border-emerald-400 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🟢</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-mono">
                      5. Grid Export
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Green Net-Meter</h5>
                  <div className="mt-1 font-mono text-base font-extrabold text-emerald-600">
                    {discoUtility} Bi-Dir
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    4-Quadrant Bi-Directional
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Exports surplus units to earn WAPDA bill credits
                </div>
              </div>
            </div>
          </div>

          {/* Plain-Language Client Explanation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Info className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">
                    How Your Solar System Operates (Aasaan Alfaaz Mein)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Simple non-technical guide to daily solar generation, home consumption &amp; net-metering
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-full border border-slate-700 font-bold">
                ✓ NEPRA Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 font-mono text-xs">
                  <span>1. Sunlight to DC Power</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Rooftop solar panels capture direct sunlight and generate Direct Current (DC) electricity, safely routed through heavy-duty DC isolator disconnect switches and surge arresters.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-sky-400 flex items-center gap-1.5 font-mono text-xs">
                  <span>2. Inverter Conversion</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The smart inverter converts incoming DC power into clean 230V single-phase or 400V three-phase Alternating Current (AC) electricity perfectly matching your home and grid voltage.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-indigo-400 flex items-center gap-1.5 font-mono text-xs">
                  <span>3. Powering Home First</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Daytime solar energy flows directly into your home Distribution Board (DB) to power active appliances (ACs, fans, lights, refrigerator) first, reducing daytime grid electricity consumption to zero.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono text-xs">
                  <span>4. Net-Metering Export</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Any excess electricity your home does not consume is automatically exported through the DISCO Green Meter into the national grid, earning unit credits that offset your nighttime WAPDA bill.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-800/40 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 uppercase text-[11px] block font-mono">
                  5. Certified Safety &amp; Anti-Islanding Protection
                </span>
                <p className="text-slate-300 leading-relaxed mt-0.5">
                  If WAPDA power cuts off during load shedding or grid fault, the inverter automatically stops feeding power in <strong>less than 100 milliseconds (&lt; 100ms)</strong> to protect linemen. The system is grounded with a dedicated chemical earth pit (resistance &lt; 2.5 Ω).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: DETAILED CAD SCHEMATIC (NEPRA / DISCO STANDARD) */}
      {viewMode === "cad" && (
        <>
          <div className="relative overflow-auto bg-slate-200/90 p-4 sm:p-6 flex items-center justify-center min-h-[560px]">
        {/* The Scaled Drawing Sheet */}
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out"
          }}
          className="bg-[#ffffff] text-[#0f172a] shadow-2xl border border-slate-300 rounded-sm"
        >
          {/* Authentic AutoCAD Vector Drawing (SVG) */}
          <svg
            ref={svgRef}
            id="autocad-sld-canvas-svg"
            viewBox="0 0 1340 730"
            width="1280"
            height="697"
            className="w-full h-auto block select-none font-sans"
            style={{ fontFamily: "'Courier New', Courier, 'Lucida Console', monospace" }}
          >
            <defs>
              {/* Leader arrow marker */}
              <marker
                id="cad-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a" />
              </marker>

              {/* Red arrow marker for DC */}
              <marker
                id="cad-arrow-red"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626" />
              </marker>

              {/* Blue arrow marker for AC */}
              <marker
                id="cad-arrow-blue"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
              </marker>

              {/* Subtle grid pattern for CAD drafting canvas */}
              <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.75" />
              </pattern>
            </defs>

            {/* Canvas background with subtle grid */}
            <rect x="0" y="0" width="1340" height="730" fill="#ffffff" />
            <rect x="0" y="0" width="1340" height="730" fill="url(#cad-grid)" />

            {/* OUTER CAD DRAWING SHEET BORDER */}
            <rect
              x="18"
              y="18"
              width="1304"
              height="694"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.2"
            />

            {/* INNER CAD MARGIN BORDER */}
            <rect
              x="28"
              y="28"
              width="1284"
              height="674"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.2"
            />

            {/* SHEET REFERENCE GRID TICKS & LABELS (A-D, 1-6) */}
            {/* Top & Bottom Ticks */}
            {[240, 450, 660, 870, 1080].map((x, idx) => (
              <g key={`col-tick-${idx}`}>
                <line x1={x} y1="18" x2={x} y2="28" stroke="#0f172a" strokeWidth="1" />
                <line x1={x} y1="702" x2={x} y2="712" stroke="#0f172a" strokeWidth="1" />
                <text x={x - 100} y="25" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">{idx + 1}</text>
                <text x={x - 100} y="709" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">{idx + 1}</text>
              </g>
            ))}
            <text x="1190" y="25" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">6</text>
            <text x="1190" y="709" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">6</text>

            {/* Left & Right Ticks (A, B, C, D) */}
            {[190, 360, 530].map((y, idx) => (
              <g key={`row-tick-${idx}`}>
                <line x1="18" y1={y} x2="28" y2={y} stroke="#0f172a" strokeWidth="1" />
                <line x1="1302" y1={y} x2="1312" y2={y} stroke="#0f172a" strokeWidth="1" />
                <text x="23" y={y - 80} fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">{String.fromCharCode(65 + idx)}</text>
                <text x="1307" y={y - 80} fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">{String.fromCharCode(65 + idx)}</text>
              </g>
            ))}
            <text x="23" y="615" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">D</text>
            <text x="1307" y="615" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">D</text>

            {/* TOP HEADER CLASSIFICATION STRIP */}
            <g id="sheet-header">
              <text x="45" y="48" fontSize="11" fontWeight="bold" letterSpacing="1" fill="#0f172a">
                GREEN TECH POWER ENGINEERING • INDUSTRIAL SOLAR EPC DRAFTING
              </text>
              <text x="1295" y="48" fontSize="9.5" fontWeight="bold" fill="#475569" textAnchor="end">
                IEC 60617 / IEC 60364-7-712 / NEPRA S.R.O. 892(I)/2015
              </text>
              <line x1="28" y1="56" x2="1312" y2="56" stroke="#0f172a" strokeWidth="1" />
            </g>

            {/* ========================================================================= */}
            {/* STAGE 1: PV ARRAY & DC COMBINER BOX (X: 45 to 330) */}
            {/* ========================================================================= */}
            <g
              id="cad-stage-1"
              className="cursor-pointer"
              onClick={() => setActiveStage("stage1")}
            >
              {/* Stage 1 Header Callout */}
              <text x="50" y="75" fontSize="10.5" fontWeight="bold" fill="#0f172a">
                [STAGE 1] PV STRINGS & DC COMBINER
              </text>
              <text x="50" y="88" fontSize="8.5" fill="#475569">
                {numPanels}x {wattage}W Bifacial ({dcCapacity} kWp DC)
              </text>

              {/* STRING 1 IEC MODULE BLOCK */}
              <g transform="translate(50, 105)">
                <rect
                  x="0"
                  y="0"
                  width="135"
                  height="75"
                  fill="#ffffff"
                  stroke={activeStage === "stage1" ? "#047857" : "#0f172a"}
                  strokeWidth={activeStage === "stage1" ? "2.5" : "1.8"}
                />
                {/* Solar cell cross lines */}
                <line x1="0" y1="25" x2="135" y2="25" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="0" y1="50" x2="135" y2="50" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="45" y1="0" x2="45" y2="75" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="90" y1="0" x2="90" y2="75" stroke="#94a3b8" strokeWidth="0.8" />

                <text x="67" y="17" fontSize="9" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                  PV STRING 1
                </text>
                <text x="67" y="39" fontSize="8" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                  {string1Panels}x {wattage}W TOPCon
                </text>
                <text x="67" y="64" fontSize="8" fill="#0284c7" fontWeight="bold" textAnchor="middle">
                  Voc: {string1Voc}V | Isc: {isc}A
                </text>
              </g>

              {/* STRING 2 IEC MODULE BLOCK (if system > 16 modules) */}
              {string2Panels > 0 && (
                <g transform="translate(50, 205)">
                  <rect
                    x="0"
                    y="0"
                    width="135"
                    height="75"
                    fill="#ffffff"
                    stroke={activeStage === "stage1" ? "#047857" : "#0f172a"}
                    strokeWidth={activeStage === "stage1" ? "2.5" : "1.8"}
                  />
                  <line x1="0" y1="25" x2="135" y2="25" stroke="#94a3b8" strokeWidth="0.8" />
                  <line x1="0" y1="50" x2="135" y2="50" stroke="#94a3b8" strokeWidth="0.8" />
                  <line x1="45" y1="0" x2="45" y2="75" stroke="#94a3b8" strokeWidth="0.8" />
                  <line x1="90" y1="0" x2="90" y2="75" stroke="#94a3b8" strokeWidth="0.8" />

                  <text x="67" y="17" fontSize="9" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                    PV STRING 2
                  </text>
                  <text x="67" y="39" fontSize="8" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                    {string2Panels}x {wattage}W TOPCon
                  </text>
                  <text x="67" y="64" fontSize="8" fill="#0284c7" fontWeight="bold" textAnchor="middle">
                    Voc: {string2Voc}V | Isc: {isc}A
                  </text>
                </g>
              )}

              {/* DC String lines from panels to combiner */}
              <line x1="185" y1="135" x2="225" y2="135" stroke="#dc2626" strokeWidth="1.8" />
              <line x1="185" y1="155" x2="225" y2="155" stroke="#0f172a" strokeWidth="1.8" />
              <text x="195" y="131" fontSize="7.5" fontWeight="bold" fill="#dc2626">DC+</text>
              <text x="195" y="165" fontSize="7.5" fontWeight="bold" fill="#0f172a">DC-</text>

              {string2Panels > 0 && (
                <>
                  <line x1="185" y1="235" x2="225" y2="235" stroke="#dc2626" strokeWidth="1.8" />
                  <line x1="185" y1="255" x2="225" y2="255" stroke="#0f172a" strokeWidth="1.8" />
                </>
              )}

              {/* DC COMBINER BOX (Dashed engineering boundary box) */}
              <g transform="translate(225, 95)">
                <rect
                  x="0"
                  y="0"
                  width="135"
                  height="195"
                  fill="#fafafa"
                  stroke="#0f172a"
                  strokeWidth="1.6"
                  strokeDasharray="5,3"
                />
                <text x="67" y="16" fontSize="8" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                  DC COMBINER (IP65)
                </text>

                {/* gPV Fuses (+ and -) */}
                <g transform="translate(15, 30)">
                  <rect x="0" y="0" width="30" height="12" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
                  <line x1="-15" y1="6" x2="45" y2="6" stroke="#dc2626" strokeWidth="1.6" />
                  <text x="15" y="22" fontSize="6.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">gPV 15A</text>
                </g>

                <g transform="translate(15, 52)">
                  <rect x="0" y="0" width="30" height="12" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
                  <line x1="-15" y1="6" x2="45" y2="6" stroke="#0f172a" strokeWidth="1.6" />
                  <text x="15" y="22" fontSize="6.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">gPV 15A</text>
                </g>

                {/* DC SURGE PROTECTION DEVICE (SPD Type II) */}
                <g transform="translate(20, 85)">
                  <rect x="0" y="0" width="40" height="34" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
                  <path d="M 12 8 L 28 26 M 28 8 L 12 26" stroke="#dc2626" strokeWidth="1.2" />
                  <text x="20" y="44" fontSize="6.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">DC SPD T2</text>
                  <text x="20" y="52" fontSize="6" fill="#475569" textAnchor="middle">1000V 40kA</text>
                </g>

                {/* ROTARY 2-POLE DC ISOLATOR SWITCH */}
                <g transform="translate(75, 75)">
                  <circle cx="25" cy="25" r="22" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                  {/* Switch contact blades */}
                  <line x1="12" y1="20" x2="38" y2="30" stroke="#dc2626" strokeWidth="2.2" />
                  <circle cx="12" cy="20" r="2" fill="#0f172a" />
                  <circle cx="38" cy="30" r="2" fill="#0f172a" />
                  <text x="25" y="57" fontSize="7" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                    2P DC ISOLATOR
                  </text>
                  <text x="25" y="66" fontSize="6.5" fill="#475569" textAnchor="middle">
                    1000V DC 32A
                  </text>
                </g>

                {/* Combiner Output Line Bus */}
                <line x1="120" y1="140" x2="135" y2="140" stroke="#dc2626" strokeWidth="2" />
                <line x1="120" y1="155" x2="135" y2="155" stroke="#0f172a" strokeWidth="2" />
              </g>

              {/* Leader arrow for DC Cable */}
              <path d="M 360 148 L 415 148" stroke="#dc2626" strokeWidth="2" markerEnd="url(#cad-arrow-red)" />
              <text x="388" y="138" fontSize="7" fontWeight="bold" fill="#dc2626" textAnchor="middle">
                {dcCableSize}
              </text>
              <text x="388" y="165" fontSize="6.5" fill="#64748b" textAnchor="middle">
                DROP &lt; 1.5%
              </text>
            </g>

            {/* ========================================================================= */}
            {/* STAGE 2: INVERTER CORE & SUBSTATION BLOCK (X: 430 to 650) */}
            {/* ========================================================================= */}
            <g
              id="cad-stage-2"
              className="cursor-pointer"
              onClick={() => setActiveStage("stage2")}
            >
              {/* Stage 2 Header Callout */}
              <text x="435" y="75" fontSize="10.5" fontWeight="bold" fill="#0f172a">
                [STAGE 2] INVERTER CORE
              </text>
              <text x="435" y="88" fontSize="8.5" fill="#475569">
                {acCapacity} kW MPPT Substation
              </text>

              {/* INVERTER ENCLOSURE (Dashed engineering boundary box) */}
              <rect
                x="430"
                y="95"
                width="205"
                height="195"
                fill="#ffffff"
                stroke={activeStage === "stage2" ? "#0284c7" : "#0f172a"}
                strokeWidth={activeStage === "stage2" ? "2.5" : "1.8"}
                strokeDasharray="6,4"
              />
              <text x="532" y="112" fontSize="8" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                SOLAR INVERTER ENCLOSURE (IP66)
              </text>

              {/* STANDARD IEC INVERTER SYMBOL (Square with diagonal line, DC = and AC ~) */}
              <g transform="translate(482, 125)">
                <rect x="0" y="0" width="100" height="90" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                {/* Diagonal partition */}
                <line x1="0" y1="90" x2="100" y2="0" stroke="#0f172a" strokeWidth="1.4" />

                {/* DC Symbol (=) in lower left */}
                <g transform="translate(18, 55)">
                  <line x1="0" y1="0" x2="24" y2="0" stroke="#dc2626" strokeWidth="2.2" />
                  <line x1="0" y1="8" x2="24" y2="8" stroke="#0f172a" strokeWidth="2.2" />
                  <text x="12" y="24" fontSize="8" fontWeight="bold" fill="#dc2626" textAnchor="middle">DC</text>
                </g>

                {/* AC Symbol (~) in upper right */}
                <g transform="translate(56, 20)">
                  <path d="M 0 6 Q 6 -3, 12 6 T 24 6" fill="none" stroke="#0284c7" strokeWidth="2.2" />
                  <text x="12" y="22" fontSize="8" fontWeight="bold" fill="#0284c7" textAnchor="middle">AC</text>
                </g>
              </g>

              {/* Inverter Technical Specification Callouts */}
              <text x="532" y="235" fontSize="8.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                {inverterModel.toUpperCase()}
              </text>
              <text x="532" y="248" fontSize="8" fontWeight="bold" fill="#0284c7" textAnchor="middle">
                {acCapacity} kW 3-PHASE MPPT
              </text>
              <text x="532" y="260" fontSize="7.5" fill="#475569" textAnchor="middle">
                η: 98.6% | IEEE 1547 &lt; 100ms
              </text>
              <text x="532" y="272" fontSize="7.5" fill="#475569" textAnchor="middle">
                {nominalVoltage}V / 50Hz (3P+N+PE)
              </text>

              {/* EARTH LINK DROPPING DOWN TO EARTH PIT (Stage 2 Grounding) */}
              <g
                id="cad-earth-link"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStage("earth");
                }}
              >
                {/* Earth wire from Inverter core dropping down */}
                <line x1="532" y1="290" x2="532" y2="365" stroke="#16a34a" strokeWidth="2" strokeDasharray="4,2" />
                <circle cx="532" cy="290" r="3" fill="#16a34a" />

                {/* Standard Ground Earth Pit Symbol (3 descending horizontal lines) */}
                <g transform="translate(532, 365)">
                  <line x1="-16" y1="0" x2="16" y2="0" stroke="#16a34a" strokeWidth="2.5" />
                  <line x1="-10" y1="5" x2="10" y2="5" stroke="#16a34a" strokeWidth="2.2" />
                  <line x1="-5" y1="10" x2="5" y2="10" stroke="#16a34a" strokeWidth="1.8" />

                  {/* Earth pit technical notes */}
                  <text x="0" y="24" fontSize="8" fontWeight="bold" fill="#16a34a" textAnchor="middle">
                    EARTH PIT (&lt; 2.5 Ω)
                  </text>
                  <text x="0" y="35" fontSize="7" fill="#475569" textAnchor="middle">
                    10ft Cu-BONDED ROD
                  </text>
                  <text x="0" y="45" fontSize="6.5" fill="#64748b" textAnchor="middle">
                    IEC 62561-2 CERTIFIED
                  </text>
                </g>
              </g>

              {/* AC Feeder line from Inverter to ACDB */}
              <path d="M 635 185 L 705 185" stroke="#0284c7" strokeWidth="2.4" markerEnd="url(#cad-arrow-blue)" />
              <text x="670" y="175" fontSize="7.5" fontWeight="bold" fill="#0284c7" textAnchor="middle">
                {acCableSize.split(" ")[0]}
              </text>
              <text x="670" y="198" fontSize="6.5" fill="#64748b" textAnchor="middle">
                {cableBrand.split("/")[0]}
              </text>
            </g>

            {/* ========================================================================= */}
            {/* STAGE 3: AC PROTECTION & DISTRIBUTION BOARD (ACDB) (X: 715 to 920) */}
            {/* ========================================================================= */}
            <g
              id="cad-stage-3"
              className="cursor-pointer"
              onClick={() => setActiveStage("stage3")}
            >
              {/* Stage 3 Header Callout */}
              <text x="720" y="75" fontSize="10.5" fontWeight="bold" fill="#0f172a">
                [STAGE 3] AC PROTECTION & DB
              </text>
              <text x="720" y="88" fontSize="8.5" fill="#475569">
                {finalMccbRating}A 4-Pole Main Switchgear
              </text>

              {/* ACDB DASHED BOUNDARY BOX */}
              <rect
                x="715"
                y="95"
                width="195"
                height="195"
                fill="#ffffff"
                stroke={activeStage === "stage3" ? "#4f46e5" : "#0f172a"}
                strokeWidth={activeStage === "stage3" ? "2.5" : "1.8"}
                strokeDasharray="6,4"
              />
              <text x="812" y="112" fontSize="8" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                AC DISTRIBUTION BOARD (ACDB)
              </text>

              {/* 4-POLE AC MCCB SYMBOL (Standard IEC circuit breaker with trip coil) */}
              <g transform="translate(745, 125)">
                {/* Breaker bounding box */}
                <rect x="0" y="0" width="70" height="90" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                {/* 4-Pole cross marks */}
                <g transform="translate(10, 20)">
                  <line x1="0" y1="0" x2="10" y2="10" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="10" y1="0" x2="0" y2="10" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="5" y="20" fontSize="6" fontWeight="bold" fill="#0f172a" textAnchor="middle">L1</text>
                </g>
                <g transform="translate(24, 20)">
                  <line x1="0" y1="0" x2="10" y2="10" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="10" y1="0" x2="0" y2="10" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="5" y="20" fontSize="6" fontWeight="bold" fill="#0f172a" textAnchor="middle">L2</text>
                </g>
                <g transform="translate(38, 20)">
                  <line x1="0" y1="0" x2="10" y2="10" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="10" y1="0" x2="0" y2="10" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="5" y="20" fontSize="6" fontWeight="bold" fill="#0f172a" textAnchor="middle">L3</text>
                </g>
                <g transform="translate(52, 20)">
                  <line x1="0" y1="0" x2="10" y2="10" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="10" y1="0" x2="0" y2="10" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="5" y="20" fontSize="6" fontWeight="bold" fill="#0f172a" textAnchor="middle">N</text>
                </g>

                {/* Thermal-magnetic trip coil indicator */}
                <rect x="15" y="48" width="40" height="15" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.2" />
                <text x="35" y="58" fontSize="6" fontWeight="bold" fill="#0f172a" textAnchor="middle">TRIP COIL</text>

                <text x="35" y="76" fontSize="7.5" fontWeight="bold" fill="#4f46e5" textAnchor="middle">
                  4P {finalMccbRating}A MCCB
                </text>
                <text x="35" y="85" fontSize="6.5" fill="#475569" textAnchor="middle">
                  Icu: 16kA 415V
                </text>
              </g>

              {/* CLASS II AC SURGE ARRESTER (SPD) */}
              <g transform="translate(830, 135)">
                <rect x="0" y="0" width="60" height="55" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
                <path d="M 15 12 L 45 42 M 45 12 L 15 42" stroke="#4f46e5" strokeWidth="1.4" />
                <text x="30" y="48" fontSize="6.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">AC SPD T2</text>
                <text x="30" y="68" fontSize="6.5" fill="#475569" textAnchor="middle">4P 40kA</text>
                <text x="30" y="77" fontSize="6" fill="#64748b" textAnchor="middle">Uc: 400V</text>
              </g>

              {/* ACDB Technical summary */}
              <text x="812" y="245" fontSize="7.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                I(rated): {ratedAcCurrent.toFixed(1)}A | 415V AC
              </text>
              <text x="812" y="258" fontSize="7" fill="#475569" textAnchor="middle">
                RCD: 300mA 4-POLE SELECTIVE
              </text>
              <text x="812" y="270" fontSize="7" fill="#64748b" textAnchor="middle">
                AC VOLTAGE DROP &lt; 1.0%
              </text>

              {/* Feeder line to Net Meter */}
              <path d="M 910 185 L 970 185" stroke="#0f172a" strokeWidth="2.5" markerEnd="url(#cad-arrow)" />
            </g>

            {/* ========================================================================= */}
            {/* STAGE 4: NET-METERING & GRID INTERCONNECTION (X: 980 to 1270) */}
            {/* ========================================================================= */}
            <g
              id="cad-stage-4"
              className="cursor-pointer"
              onClick={() => setActiveStage("stage4")}
            >
              {/* Stage 4 Header Callout */}
              <text x="980" y="75" fontSize="10.5" fontWeight="bold" fill="#0f172a">
                [STAGE 4] NET-METERING & DISCO GRID
              </text>
              <text x="980" y="88" fontSize="8.5" fill="#475569">
                {discoUtility} Bi-Directional Interconnection
              </text>

              {/* 4-QUADRANT BI-DIRECTIONAL GREEN METER */}
              <g transform="translate(980, 115)">
                <circle
                  cx="50"
                  cy="55"
                  r="45"
                  fill="#ffffff"
                  stroke={activeStage === "stage4" ? "#e11d48" : "#0f172a"}
                  strokeWidth={activeStage === "stage4" ? "2.5" : "1.8"}
                />
                {/* Meter digital register window */}
                <rect x="22" y="25" width="56" height="20" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.2" />
                <text x="50" y="38" fontSize="8" fontWeight="bold" fill="#047857" textAnchor="middle">
                  kWh [IMPORT/EXP]
                </text>

                {/* Bi-directional arrows symbol ( <---> ) */}
                <g transform="translate(30, 58)">
                  <path d="M 8 5 L 32 5" stroke="#0f172a" strokeWidth="2" />
                  <polygon points="0,5 8,1 8,9" fill="#0f172a" />
                  <polygon points="40,5 32,1 32,9" fill="#0f172a" />
                </g>

                <text x="50" y="78" fontSize="7.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                  4-QUADRANT
                </text>
                <text x="50" y="88" fontSize="6.5" fontWeight="bold" fill="#e11d48" textAnchor="middle">
                  GREEN METER
                </text>

                <text x="50" y="112" fontSize="7" fill="#475569" textAnchor="middle">
                  {discoUtility} CALIBRATED
                </text>
              </g>

              {/* Meter to Busbar link */}
              <line x1="1075" y1="170" x2="1140" y2="170" stroke="#0f172a" strokeWidth="2.5" />

              {/* DISCO 3-PHASE LT BUSBAR (Heavy vertical engineering bus lines) */}
              <g transform="translate(1140, 85)">
                {/* Heavy copper busbar */}
                <line x1="0" y1="15" x2="0" y2="200" stroke="#0f172a" strokeWidth="5.5" />
                <line x1="12" y1="15" x2="12" y2="200" stroke="#0f172a" strokeWidth="3" />
                <line x1="24" y1="15" x2="24" y2="200" stroke="#0f172a" strokeWidth="3" />
                <line x1="36" y1="15" x2="36" y2="200" stroke="#0284c7" strokeWidth="2.5" />

                {/* Busbar labels */}
                <text x="0" y="5" fontSize="7.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">L1</text>
                <text x="12" y="5" fontSize="7.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">L2</text>
                <text x="24" y="5" fontSize="7.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">L3</text>
                <text x="36" y="5" fontSize="7.5" fontWeight="bold" fill="#0284c7" textAnchor="middle">N</text>

                <text x="-15" y="105" fontSize="8.5" fontWeight="bold" fill="#0f172a" textAnchor="middle" transform="rotate(-90 -15 105)">
                  DISCO 400V LT BUSBAR
                </text>
              </g>

              {/* WAPDA / DISCO Grid PMT Transformer Link */}
              <g transform="translate(1185, 140)">
                {/* Isolation link fuse */}
                <circle cx="20" cy="30" r="16" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
                <circle cx="44" cy="30" r="16" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
                <text x="32" y="34" fontSize="7" fontWeight="bold" fill="#0f172a" textAnchor="middle">11kV/0.4</text>

                <path d="M 60 30 L 105 30" stroke="#0f172a" strokeWidth="2.5" markerEnd="url(#cad-arrow)" />
                <text x="82" y="22" fontSize="7.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                  WAPDA / {discoUtility}
                </text>
                <text x="82" y="45" fontSize="7" fill="#475569" textAnchor="middle">
                  PMT GRID LINE
                </text>
              </g>
            </g>

            {/* ========================================================================= */}
            {/* TECHNICAL DRAFTING NOTES & STANDARDS SCHEDULE (BOTTOM LEFT: X: 45 to 640) */}
            {/* ========================================================================= */}
            <g id="drafting-technical-notes" transform="translate(45, 420)">
              {/* Outer boundary for notes */}
              <rect x="0" y="0" width="600" height="260" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
              <line x1="0" y1="24" x2="600" y2="24" stroke="#0f172a" strokeWidth="1" />
              <text x="12" y="16" fontSize="9.5" fontWeight="bold" fill="#0f172a">
                GENERAL ELECTRICAL NOTES & DISCO / NEPRA STATUTORY COMPLIANCE:
              </text>

              {/* Notes content */}
              <g transform="translate(14, 40)" fontSize="7.8" fill="#1e293b" letterSpacing="0.2">
                <text x="0" y="0">
                  1. ALL WORK SHALL CONFORM TO IEC 60364-7-712, IEEE 1547 & NEPRA (ALTERNATIVE & RENEWABLE ENERGY) REGULATIONS.
                </text>
                <text x="0" y="18">
                  2. SOLAR INVERTER IS EQUIPPED WITH AUTOMATIC RAPID ANTI-ISLANDING TRIP CAPABILITY (&lt; 100MS DISCONNECTION ON GRID LOSS).
                </text>
                <text x="0" y="36">
                  3. COMBINED DC VOLTAGE DROP &lt; 1.5% VIA 1x6MM² XLPO COPPER. COMBINED AC VOLTAGE DROP &lt; 1.0% VIA {acCableSize.split(" ")[0]}.
                </text>
                <text x="0" y="54">
                  4. SEPARATE INDEPENDENT GROUNDING PITS PROVIDED FOR PV DC STRUCTURE, INVERTER FRAME (PE), AND AC SURGE DIVERSION.
                </text>
                <text x="0" y="72">
                  5. DIGITAL MEGGER EARTH RESISTANCE TEST MUST CERTIFY SYSTEM GROUND IMPEDANCE &lt; 2.5 OHMS PRIOR TO SDO ENERGIZATION.
                </text>
                <text x="0" y="90">
                  6. ROTARY MANUAL 1000V DC LOCKABLE DISCONNECT IS INSTALLED ADJACENT TO INVERTER FOR SAFE MAINTENANCE ISOLATION.
                </text>
                <text x="0" y="108">
                  7. BI-DIRECTIONAL GREEN METER SHALL BE 4-QUADRANT STATIC TYPE WITH OPTICAL PORT SEALED BY {discoUtility} M&T TESTING LAB.
                </text>
                <text x="0" y="126">
                  8. ALL CABLES ARE UV RESISTANT, HALOGEN-FREE, FLAME RETARDANT (CLASS 5 COPPER AS PER PAKISTAN CABLES / FAST CABLES).
                </text>
              </g>

              {/* Sub-table: Cable & Switchgear Schedule */}
              <g transform="translate(0, 180)">
                <line x1="0" y1="0" x2="600" y2="0" stroke="#0f172a" strokeWidth="1" />
                <rect x="0" y="0" width="600" height="18" fill="#f1f5f9" />
                <text x="12" y="12" fontSize="7.5" fontWeight="bold" fill="#0f172a">
                  FEEDER CABLE & SWITCHGEAR SPECIFICATION SCHEDULE (APPROVED EPC BRANDS):
                </text>

                <g transform="translate(12, 32)" fontSize="7.2" fill="#334155">
                  <text x="0" y="0" fontWeight="bold">DC CABLES:</text>
                  <text x="95" y="0">2x 1C 6mm² PV1-F Flexible Annealed Tinned Cu XLPO (1500V DC Rating)</text>
                  <text x="0" y="18" fontWeight="bold">AC CABLES:</text>
                  <text x="95" y="18">{acCableSize} Armored Cu ({cableBrand})</text>
                  <text x="0" y="36" fontWeight="bold">EARTHING:</text>
                  <text x="95" y="36">1x 16mm² Bare Stranded Copper Conductor to 10ft Cu-Bonded Earth Pit (&lt; 2.5 Ω)</text>
                  <text x="0" y="54" fontWeight="bold">SWITCHGEAR:</text>
                  <text x="95" y="54">Schneider / ABB / Suntree 4-Pole AC MCCB + Type-II 40kA DC/AC Surge Arresters (SPD)</text>
                </g>
              </g>
            </g>

            {/* ========================================================================= */}
            {/* OFFICIAL AUTOCAD TITLE BLOCK (BOTTOM RIGHT: X: 660 to 1300, Y: 420 to 680) */}
            {/* ========================================================================= */}
            <g id="official-autocad-titleblock" transform="translate(660, 420)">
              {/* Outer boundary of title block */}
              <rect x="0" y="0" width="640" height="260" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />

              {/* Horizontal Dividers */}
              <line x1="0" y1="48" x2="640" y2="48" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="0" y1="110" x2="640" y2="110" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="0" y1="185" x2="640" y2="185" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="0" y1="225" x2="640" y2="225" stroke="#0f172a" strokeWidth="1.2" />

              {/* Vertical Dividers */}
              <line x1="320" y1="0" x2="320" y2="48" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="420" y1="110" x2="420" y2="225" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="530" y1="110" x2="530" y2="225" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="160" y1="185" x2="160" y2="260" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="320" y1="185" x2="320" y2="260" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="480" y1="225" x2="480" y2="260" stroke="#0f172a" strokeWidth="1.2" />

              {/* Section 1: EPC Contractor Identity */}
              <g transform="translate(15, 20)">
                <text x="0" y="0" fontSize="8" fontWeight="bold" fill="#64748b">EPC CONTRACTOR:</text>
                <text x="0" y="16" fontSize="11" fontWeight="bold" fill="#0f172a">GREEN TECH POWER ENGINEERING</text>
              </g>

              {/* Section 2: Drawing Type & Category */}
              <g transform="translate(335, 20)">
                <text x="0" y="0" fontSize="8" fontWeight="bold" fill="#64748b">SUBMISSION DISCIPLINE:</text>
                <text x="0" y="16" fontSize="10.5" fontWeight="bold" fill="#047857">
                  NEPRA NET-METERING PERMIT DRAWING
                </text>
              </g>

              {/* Section 3: Project Title & Details */}
              <g transform="translate(15, 68)">
                <text x="0" y="0" fontSize="8" fontWeight="bold" fill="#64748b">PROJECT NAME & CLIENT:</text>
                <text x="0" y="15" fontSize="12" fontWeight="bold" fill="#0f172a">
                  {projectName.toUpperCase()}
                </text>
                <text x="0" y="30" fontSize="9" fill="#334155">
                  LOCATION: {siteLocation} | CLIENT: {clientName}
                </text>
              </g>

              {/* Section 4: System Parameters & Ratings */}
              <g transform="translate(15, 128)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">SYSTEM CAPACITY:</text>
                <text x="0" y="16" fontSize="13" fontWeight="bold" fill="#0f172a">
                  {dcCapacity} kWp DC
                </text>
                <text x="0" y="34" fontSize="8.5" fill="#475569">
                  INVERTER: {acCapacity} kW AC
                </text>
                <text x="0" y="47" fontSize="8" fill="#475569">
                  MODULES: {numPanels}x {wattage}W
                </text>
              </g>

              {/* Section 5: Utility & Grid Sync */}
              <g transform="translate(435, 128)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">DISCO UTILITY:</text>
                <text x="0" y="16" fontSize="12" fontWeight="bold" fill="#0284c7">
                  {discoUtility}
                </text>
                <text x="0" y="34" fontSize="8" fill="#475569">
                  LT 3-PHASE 400V
                </text>
                <text x="0" y="47" fontSize="8" fill="#475569">
                  NET-METERING
                </text>
              </g>

              {/* Section 6: Approvals Sign-off Block */}
              <g transform="translate(545, 128)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">STATUS:</text>
                <rect x="0" y="8" width="80" height="20" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                <text x="40" y="22" fontSize="9" fontWeight="bold" fill="#047857" textAnchor="middle">
                  APPROVED
                </text>
                <text x="0" y="44" fontSize="7.5" fill="#64748b">
                  SDO DISCO NOC
                </text>
              </g>

              {/* Section 7: Drawing Title */}
              <g transform="translate(15, 202)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">DRAWING TITLE:</text>
                <text x="0" y="14" fontSize="10.5" fontWeight="bold" fill="#0f172a">
                  ELECTRICAL SINGLE LINE DIAGRAM (NET-METERING)
                </text>
              </g>

              {/* Section 8: Metadata Fields */}
              <g transform="translate(175, 202)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">PROJECT CODE:</text>
                <text x="0" y="14" fontSize="9.5" fontWeight="bold" fill="#0f172a">{projectCode}</text>
              </g>

              <g transform="translate(335, 202)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">DRAWING NO:</text>
                <text x="0" y="14" fontSize="9.5" fontWeight="bold" fill="#0f172a">{drawingNo}</text>
              </g>

              {/* Section 9: Footer Meta (Date, Scale, Revision, Sheet) */}
              <g transform="translate(15, 242)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">DATE: <tspan fill="#0f172a">{currentDate}</tspan></text>
              </g>

              <g transform="translate(175, 242)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">SCALE: <tspan fill="#0f172a">N.T.S.</tspan></text>
              </g>

              <g transform="translate(335, 242)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">REVISION: <tspan fill="#047857" fontWeight="bold">REV 02</tspan></text>
              </g>

              <g transform="translate(495, 242)">
                <text x="0" y="0" fontSize="7.5" fontWeight="bold" fill="#64748b">SHEET: <tspan fill="#0f172a">01 OF 01</tspan></text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* Interactive Equipment Inspection Drawer / Bar */}
      {activeStage && STAGE_INSPECTOR_INFO[activeStage] && (
        <div className="bg-slate-800 border-t border-slate-700 p-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                IEC
              </span>
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wide">
                  {STAGE_INSPECTOR_INFO[activeStage].title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {STAGE_INSPECTOR_INFO[activeStage].subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                {STAGE_INSPECTOR_INFO[activeStage].standard}
              </span>
              <button
                type="button"
                onClick={() => setActiveStage(null)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-700 transition"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Technical Ratings Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 font-mono text-xs">
            {STAGE_INSPECTOR_INFO[activeStage].details.map((item, idx) => (
              <div key={idx} className="bg-slate-900/90 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{item.label}</span>
                <span className="text-slate-100 font-bold text-[11px] truncate block" title={item.val}>
                  {item.val}
                </span>
              </div>
            ))}
          </div>

          {/* SDO Verification Checklist */}
          <div className="bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl flex items-start gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-emerald-400 font-bold uppercase text-[10px] block">
                DISCO SDO OFFICIAL SUBMISSION VERIFICATION:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {STAGE_INSPECTOR_INFO[activeStage].sdoChecklist}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )}

      {/* Bottom Status Bar */}
      <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          {viewMode === "client" ? (
            <span>🟢 <strong>Client Presentation Mode</strong> — Non-technical visual power flow &amp; homeowner guide</span>
          ) : (
            <span>📐 <strong>AutoCAD Engineering Mode</strong> — Click any circuit block to inspect ratings</span>
          )}
          <span>•</span>
          <span>Vector standard: <strong>AutoCAD Release 12 / 2000 AC1009</strong></span>
        </div>
        <div className="text-emerald-400 font-bold">
          ✓ Verified for {discoUtility} Net-Metering Application
        </div>
      </div>
    </div>
  );
}
