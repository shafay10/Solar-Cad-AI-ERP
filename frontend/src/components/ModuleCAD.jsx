import React, { useState, useMemo } from "react";
import {
  Cpu, Sliders, ShieldCheck, AlertTriangle, CheckCircle2,
  Zap, Layers, ArrowRight, Battery, Cable, ToggleLeft, ToggleRight,
  Code, Download, Eye, Box
} from "lucide-react";
import {
  PANEL_CATALOG,
  INVERTER_CATALOG,
  CABLE_SPECS,
  BATTERY_CATALOG,
  calculateStringVoltages,
  calculateVoltageDrop,
  calculateBatteryAutonomy
} from "../services/solarEngine.js";
import ModuleAutoCADSLD from "./ModuleAutoCADSLD.jsx";

export default function ModuleCAD({
  activeProject,
  capacityKw,
  moduleWattage,
  setModuleWattage,
  panelsPerString,
  setPanelsPerString,
  isLocked,
  cadSettings,
  setCadSettings,
  surveyDetails,
  setSurveyDetails
}) {
  if (!activeProject) {
    return (
      <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl text-center max-w-xl mx-auto my-10 space-y-4 shadow-sm">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mx-auto border border-emerald-200">
          <Cpu className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900">No Active Project Selected</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Please select or create an active project to configure electrical CAD parameters, string inverter MPPT matching, cable voltage drop analysis, and view the interactive Single Line Diagram (SLD).
        </p>
      </div>
    );
  }

  // Catalogs
  const panelBrands = Object.keys(PANEL_CATALOG);
  const [selectedPanelBrand, setSelectedPanelBrand] = useState("Jinko Solar");
  const currentPanelList = PANEL_CATALOG[selectedPanelBrand] || [];

  const inverterBrands = Object.keys(INVERTER_CATALOG);
  const [selectedInverterBrand, setSelectedInverterBrand] = useState("Huawei");
  const currentInverterList = INVERTER_CATALOG[selectedInverterBrand] || [];

  // Active Selections
  const [selectedInverterModel, setSelectedInverterModel] = useState(currentInverterList[0]?.model || "SUN2000-100KTL-M2");
  const [selectedCableBrand, setSelectedCableBrand] = useState("Fast Cables");
  const [selectedCableSize, setSelectedCableSize] = useState("1x6mm² DC XLPO");
  const [cableLengthMeters, setCableLengthMeters] = useState(80);

  // BESS States
  const [batteryType, setBatteryType] = useState("Lithium-ion");
  const [batteryKwh, setBatteryKwh] = useState(15);
  const [criticalLoadKw, setCriticalLoadKw] = useState(3.5);

  // Electrical Accessories
  const [breakerBrand, setBreakerBrand] = useState("Schneider Electric");
  const [spdType, setSpdType] = useState("Type 1+2 Combined (1000V DC)");
  const [changeoverType, setChangeoverType] = useState("4-Pole Motorized ATS (415V)");

  // AutoCAD SLD Toggle
  const [includeSld, setIncludeSld] = useState(true);

  // Selected Panel Object
  const currentPanel = useMemo(() => {
    return currentPanelList.find(p => p.wattage === Number(moduleWattage)) || currentPanelList[0] || {
      wattage: 585, voc: 51.5, vmp: 43.2, isc: 14.36, imp: 13.54
    };
  }, [currentPanelList, moduleWattage]);

  // Selected Inverter Object
  const currentInverter = useMemo(() => {
    return currentInverterList.find(i => i.model === selectedInverterModel) || currentInverterList[0] || {
      model: "SUN2000-100KTL-M2", type: "On-Grid", ratedKw: 100, mpptMinV: 200, mpptMaxV: 1000, maxPvV: 1100
    };
  }, [currentInverterList, selectedInverterModel]);

  // Voltage Calculations
  const stringCalc = useMemo(() => {
    return calculateStringVoltages(moduleWattage, panelsPerString);
  }, [moduleWattage, panelsPerString]);

  // Cable Voltage Drop Calculation
  const selectedCableSpec = useMemo(() => {
    const brandList = CABLE_SPECS[selectedCableBrand] || [];
    return brandList.find(c => c.size === selectedCableSize) || brandList[1] || {
      size: "1x6mm² DC XLPO", resistancePerM: 0.00330, ampRating: 45
    };
  }, [selectedCableBrand, selectedCableSize]);

  const voltageDropCalc = useMemo(() => {
    return calculateVoltageDrop(cableLengthMeters, currentPanel.imp, selectedCableSpec.resistancePerM, stringCalc.stcVmp);
  }, [cableLengthMeters, currentPanel.imp, selectedCableSpec, stringCalc.stcVmp]);

  // Battery Autonomy Calculation
  const batteryAutonomyCalc = useMemo(() => {
    return calculateBatteryAutonomy(batteryKwh, criticalLoadKw, batteryType);
  }, [batteryKwh, criticalLoadKw, batteryType]);

  const totalPanels = Math.ceil((capacityKw * 1000) / (moduleWattage || 585));
  const totalStrings = Math.ceil(totalPanels / panelsPerString);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            ELECTRICAL CAD DESIGN, MPPT MATCHING & BESS SIZING
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic Panel Specs, Inverter MPPT Matching, Pakistani Cables Voltage Drop & AutoCAD SLD
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-700 font-medium">Include AutoCAD SLD in Proposal:</span>
            <button
              onClick={() => setIncludeSld(!includeSld)}
              className="text-emerald-600 focus:outline-none cursor-pointer"
            >
              {includeSld ? (
                <ToggleRight className="w-6 h-6 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              )}
            </button>
            <span className={`text-xs font-bold font-mono ${includeSld ? "text-emerald-700" : "text-slate-500"}`}>
              {includeSld ? "ENABLED (SVG/DWG)" : "EXCLUDED"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 1. Panels & 2. Inverters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department 1: Panel Specifications */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" /> 1. PV Module Specifications & Catalog
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Tier-1 TOPCon / PERC
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-700 font-bold">Brand Selection</label>
              <select
                value={selectedPanelBrand}
                onChange={(e) => {
                  setSelectedPanelBrand(e.target.value);
                  const first = PANEL_CATALOG[e.target.value]?.[0];
                  if (first) setModuleWattage(first.wattage);
                }}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
              >
                {panelBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 font-bold">Model & Wattage Rating</label>
              <select
                value={moduleWattage}
                onChange={(e) => setModuleWattage(Number(e.target.value))}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-600 font-semibold"
              >
                {currentPanelList.map(p => (
                  <option key={p.model} value={p.wattage}>
                    {p.model} ({p.wattage}W)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-populated Electrical Specs Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Voc (STC)</span>
              <div className="text-sm font-mono font-bold text-slate-800">{currentPanel.voc} V</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Vmp (STC)</span>
              <div className="text-sm font-mono font-bold text-slate-800">{currentPanel.vmp} V</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Isc (Amps)</span>
              <div className="text-sm font-mono font-bold text-emerald-700">{currentPanel.isc} A</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Imp (Amps)</span>
              <div className="text-sm font-mono font-bold text-emerald-700">{currentPanel.imp} A</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-medium">Panels Per Series String:</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {panelsPerString} Panels / String
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="24"
              value={panelsPerString}
              disabled={isLocked}
              onChange={(e) => setPanelsPerString(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Department 2: Inverter Specifications */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" /> 2. Inverter Infrastructure & MPPT Matcher
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {currentInverter.type}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-700 font-bold">Inverter Brand</label>
              <select
                value={selectedInverterBrand}
                onChange={(e) => {
                  setSelectedInverterBrand(e.target.value);
                  const first = INVERTER_CATALOG[e.target.value]?.[0];
                  if (first) setSelectedInverterModel(first.model);
                }}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
              >
                {inverterBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 font-bold">Inverter Model</label>
              <select
                value={selectedInverterModel}
                onChange={(e) => setSelectedInverterModel(e.target.value)}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-600 font-semibold"
              >
                {currentInverterList.map(i => (
                  <option key={i.model} value={i.model}>
                    {i.model} ({i.ratedKw}kW)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MPPT Safe-Zone Gauge */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600">Winter Voc (-5°C): <strong className="text-emerald-700 font-mono font-bold">{stringCalc.winterVoc} V</strong></span>
              <span className="text-slate-600">Summer Vmp (+55°C): <strong className="text-emerald-700 font-mono font-bold">{stringCalc.summerVmp} V</strong></span>
            </div>

            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stringCalc.winterVoc / 1100) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 font-mono font-medium">
              <span>MPPT Min: {currentInverter.mpptMinV || 200}V</span>
              <span>MPPT Max: {currentInverter.mpptMaxV || 1000}V</span>
              <span className="text-rose-600 font-bold">Max Limit: {currentInverter.maxPvV || 1100}V</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Stringing validated: {panelsPerString} panels per string safely inside inverter MPPT window.</span>
          </div>
        </div>
      </div>

      {/* Grid: 3. Cables & Voltage Drop + 4. Battery BESS Sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department 7: Cables & Automated Voltage Drop */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cable className="w-4 h-4 text-emerald-600" /> 7. Pakistani Cables & Automated Voltage Drop
            </h3>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              voltageDropCalc.isCompliant ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {voltageDropCalc.isCompliant ? "IEC COMPLIANT (<2.5%)" : "VOLTAGE DROP EXCESS"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-700 font-bold">Wire Brand</label>
              <select
                value={selectedCableBrand}
                onChange={(e) => {
                  setSelectedCableBrand(e.target.value);
                  const first = CABLE_SPECS[e.target.value]?.[0];
                  if (first) setSelectedCableSize(first.size);
                }}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
              >
                <option value="Fast Cables">Fast Cables</option>
                <option value="Pakistan Cables">Pakistan Cables</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 font-bold">Cable Gauge / Size</label>
              <select
                value={selectedCableSize}
                onChange={(e) => setSelectedCableSize(e.target.value)}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 font-semibold"
              >
                {(CABLE_SPECS[selectedCableBrand] || []).map(c => (
                  <option key={c.size} value={c.size}>
                    {c.size} ({c.ampRating}A)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 font-bold">Run Length (Meters)</label>
              <input
                type="number"
                value={cableLengthMeters}
                onChange={(e) => setCableLengthMeters(Number(e.target.value))}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>
          </div>

          {/* Voltage Drop Result Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Voltage Drop (V)</span>
              <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                {voltageDropCalc.voltageDropVolts} V
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Percentage Drop</span>
              <div className={`text-base font-bold font-mono mt-0.5 ${voltageDropCalc.isCompliant ? "text-emerald-700" : "text-rose-600"}`}>
                {voltageDropCalc.voltageDropPercentage}%
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Resistance / Meter</span>
              <div className="text-xs font-bold font-mono text-slate-800 mt-1">
                {selectedCableSpec.resistancePerM} Ω/m
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            {voltageDropCalc.recommendation}
          </p>
        </div>

        {/* Department 5: Battery & BESS Sizing */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-600" /> 5. Battery & BESS Storage Autonomy
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {batteryType}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-700 font-bold">Storage Chemistry</label>
              <select
                value={batteryType}
                onChange={(e) => setBatteryType(e.target.value)}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
              >
                <option value="Lithium-ion">Lithium-ion LFP</option>
                <option value="Lead-acid">Lead-acid Tubular</option>
                <option value="Gel">Deep Cycle Gel</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 font-bold">Battery Pack (kWh)</label>
              <input
                type="number"
                value={batteryKwh}
                onChange={(e) => setBatteryKwh(Number(e.target.value))}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-700 font-bold">Critical Load (kW)</label>
              <input
                type="number"
                step="0.5"
                value={criticalLoadKw}
                onChange={(e) => setCriticalLoadKw(Number(e.target.value))}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>
          </div>

          {/* Autonomy Results Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Usable Capacity</span>
              <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                {batteryAutonomyCalc.usableCapacityKwh} kWh
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Depth of Discharge</span>
              <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                {batteryAutonomyCalc.depthOfDischarge}% DoD
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Backup Duration</span>
              <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                {batteryAutonomyCalc.autonomyDisplay}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Calculated at 94% inverter conversion efficiency for critical industrial loads during grid outage.
          </p>
        </div>
      </div>

      {/* Department 6 & 10: Electrical Accessories & AutoCAD SLD Vector Diagram */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-600" /> 10. AutoCAD Single Line Diagram (SLD) Schema
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive vector schematic for exportable AutoCAD DXF / DWG / SVG engineering packages
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-mono">AutoCAD Vector Schema:</span>
            <span className="text-xs bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
              IEC-60617 READY
            </span>
          </div>
        </div>

        {/* Authentic AutoCAD Vector SLD Canvas */}
        <div className="overflow-hidden">
          <ModuleAutoCADSLD
            project={activeProject}
            totalCapacityKw={capacityKw || ((totalPanels * moduleWattage) / 1000) || 6.2}
            moduleCount={totalPanels}
            moduleWattage={moduleWattage}
            inverterModel={`${selectedInverterBrand} ${currentInverter.ratedKw}kW IP66`}
            inverterKw={currentInverter.ratedKw}
            cableBrand={selectedCableSpec?.name || "Pakistan Cables"}
            dcCableSize={selectedCableSpec?.dcSize || "1x6mm² DC Solar XLPO"}
            acCableSize={selectedCableSpec?.acSize || "4-Core 25mm² Armored Cu"}
            discoUtility={activeProject?.subDivision || "LESCO / IESCO / KE"}
          />
        </div>
      </div>
    </div>
  );
}
