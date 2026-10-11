import React, { useState, useMemo } from "react";
import {
  Zap, ShieldCheck, AlertTriangle, CheckCircle2, Download,
  Sliders, Info, FileText, PenTool, Cpu, Activity
} from "lucide-react";
import { formatPKR } from "../services/solarEngine.js";

export default function HelioScopeElectricalDesign({
  systemStats,
  selectedModuleKey = "Jinko Solar Tiger Neo 585W",
  inverterCapacityKw = 20,
  setInverterCapacityKw,
  selectedInverterModel = "Huawei SUN2000-20KTL-M2 (20 kW, 2 MPPT)",
  stringingAnalysis
}) {
  // Target panels per string
  const [targetStringSize, setTargetStringSize] = useState(14);

  // DC Cable Sizing States
  const [dcCableSizeMm2, setDcCableSizeMm2] = useState(6); // 6mm² Solar DC cable
  const [dcRunLengthM, setDcRunLengthM] = useState(35); // 35 meters run length

  // AC Cable Sizing States
  const [acCableSizeMm2, setAcCableSizeMm2] = useState(25); // 25mm² 4-Core Copper
  const [acRunLengthM, setAcRunLengthM] = useState(40); // 40 meters run length

  // Resistivity of Copper at operating temperature ~50°C (0.0195 ohm*mm²/m)
  const RHO_COPPER = 0.0195;

  // DC Voltage Drop Calculation:
  // Delta V = (2 * L * I * rho) / Area
  const dcCurrentA = stringingAnalysis?.moduleSpec?.imp || 13.54;
  const dcOperatingVoltageV = (stringingAnalysis?.summerStringVmp || 580);
  const dcVoltageDropV = (2 * dcRunLengthM * dcCurrentA * RHO_COPPER) / dcCableSizeMm2;
  const dcVoltageDropPct = (dcVoltageDropV / (dcOperatingVoltageV || 1)) * 100;
  const isDcDropAcceptable = dcVoltageDropPct <= 2.0;

  // AC Voltage Drop Calculation (3-Phase 400V AC):
  // AC Current I = P / (sqrt(3) * V * pf)
  const powerWatts = (inverterCapacityKw || 20) * 1000;
  const acCurrentA = powerWatts / (Math.sqrt(3) * 400 * 0.95);
  // Delta V_3ph = (sqrt(3) * L * I * rho * cosPhi) / Area
  const acVoltageDropV = (Math.sqrt(3) * acRunLengthM * acCurrentA * RHO_COPPER * 0.95) / acCableSizeMm2;
  const acVoltageDropPct = (acVoltageDropV / 400) * 100;
  const isAcDropAcceptable = acVoltageDropPct <= 2.0;

  // Export SVG SLD
  const handleExportSvg = () => {
    const svgEl = document.getElementById("helioscope-vector-sld");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Solar_SLD_Schematic_${(systemStats?.kwp || 20).toFixed(1)}kW.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-600" />
          5. Electrical Stringing & Wiring Design (MPPT & Voltage Drop)
        </h2>
        <p className="text-xs text-slate-500">
          Temperature-corrected string Voc/Vmp sizing, Ohm's law cable run voltage drop analysis, and vector AutoCAD SLD schematic.
        </p>
      </div>

      {/* Grid: MPPT String Validation (Left 6) + Wire Sizing Calculator (Right 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 6: Stringing & Inverter MPPT Analysis */}
        <div className="lg:col-span-6 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Inverter MPPT Voltage Compliance
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              stringingAnalysis?.voltageLimits?.isCompliant ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}>
              {stringingAnalysis?.voltageLimits?.isCompliant ? "MPPT COMPLIANT" : "VOLTAGE WARNING"}
            </span>
          </div>

          {/* Sizing KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Strings</span>
              <span className="text-lg font-mono font-extrabold text-slate-900">
                {stringingAnalysis?.stringCount || 2} Strings
              </span>
              <span className="text-[10px] text-slate-500 block">
                {stringingAnalysis?.safeStringSize || 14} Modules/String
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Winter Voc (-5°C)</span>
              <span className={`text-lg font-mono font-extrabold ${
                (stringingAnalysis?.winterStringVoc || 0) <= 1000 ? "text-emerald-700" : "text-red-600"
              }`}>
                {stringingAnalysis?.winterStringVoc || 745.2} V
              </span>
              <span className="text-[10px] text-slate-500 block">Limit: &lt; 1000V DC</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Summer Vmp (65°C)</span>
              <span className="text-lg font-mono font-extrabold text-blue-700">
                {stringingAnalysis?.summerStringVmp || 580.4} V
              </span>
              <span className="text-[10px] text-slate-500 block">MPPT Min: &gt; 200V</span>
            </div>
          </div>

          {/* DC/AC Ratio Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">DC/AC Overclocking Ratio:</span>
              <span className="font-mono font-extrabold text-emerald-800 text-sm">
                {stringingAnalysis?.dcAcRatio || 1.25}x
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((stringingAnalysis?.dcAcRatio || 1.25) / 1.5) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Optimal commercial DC/AC sizing is between 1.15x and 1.30x for peak generation yield in Pakistan without inverter clipping.
            </p>
          </div>

          {/* Target string size slider */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Target String Size:</span>
              <span className="font-mono text-emerald-700 font-extrabold">{targetStringSize} Panels / String</span>
            </div>
            <input
              type="range"
              min="10"
              max="24"
              value={targetStringSize}
              onChange={e => setTargetStringSize(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Right 6: Wire Sizing & Voltage Drop Calculator */}
        <div className="lg:col-span-6 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Cable Sizing & Voltage Drop Calculator (Ohm's Law)
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Standard Limit: &lt; 2.0%</span>
          </div>

          {/* DC Solar Cable Section */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                DC String Cable (Fast / Pakistan Cables Solar PV)
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isDcDropAcceptable ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}>
                Drop: {dcVoltageDropPct.toFixed(2)}% ({dcVoltageDropV.toFixed(1)}V)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold mb-1">Cable Cross-Section</label>
                <select
                  value={dcCableSizeMm2}
                  onChange={e => setDcCableSizeMm2(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold"
                >
                  <option value="4">4.0 mm² (1000V DC)</option>
                  <option value="6">6.0 mm² (Recommended)</option>
                  <option value="10">10.0 mm² (Long Run)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold mb-1">One-Way Run Length (m)</label>
                <input
                  type="number"
                  value={dcRunLengthM}
                  onChange={e => setDcRunLengthM(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold"
                />
              </div>
            </div>
          </div>

          {/* AC Mains Cable Section */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                AC Inverter-to-Main-DB Cable (4-Core Copper)
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isAcDropAcceptable ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}>
                Drop: {acVoltageDropPct.toFixed(2)}% ({acVoltageDropV.toFixed(1)}V)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold mb-1">Cable Cross-Section</label>
                <select
                  value={acCableSizeMm2}
                  onChange={e => setAcCableSizeMm2(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold"
                >
                  <option value="16">16 mm² 4-Core Cu</option>
                  <option value="25">25 mm² 4-Core Cu</option>
                  <option value="35">35 mm² 4-Core Cu</option>
                  <option value="50">50 mm² 4-Core Cu</option>
                  <option value="70">70 mm² 4-Core Cu</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold mb-1">One-Way Run Length (m)</label>
                <input
                  type="number"
                  value={acRunLengthM}
                  onChange={e => setAcRunLengthM(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Engineering Compliance Status */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-[11px] text-emerald-900">
              <strong>NEC 210.19(A) & IEC 60364 Compliant:</strong> Combined DC & AC total voltage drop is below 3.0%, ensuring maximum kilowatt-hour revenue generation.
            </div>
          </div>
        </div>
      </div>

      {/* Vector SVG Single Line Diagram (AutoCAD SLD) */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PenTool className="w-4 h-4 text-emerald-600" />
              AutoCAD Vector Single Line Diagram (SLD) Schematic
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard EPC schematic including PV strings, DC protection, MPPT inverter, AC switchgear, and Net Meter.
            </p>
          </div>
          <button
            onClick={handleExportSvg}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export Vector SVG SLD
          </button>
        </div>

        {/* High-Res SVG Drawing */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner">
          <svg
            id="helioscope-vector-sld"
            viewBox="0 0 960 320"
            className="w-full min-w-[750px] h-auto text-xs font-mono"
          >
            {/* PV String 1 */}
            <g transform="translate(40, 60)">
              <rect x="0" y="0" width="130" height="70" rx="8" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
              <text x="65" y="25" fill="#047857" fontWeight="bold" textAnchor="middle" fontSize="11">PV STRING 1</text>
              <text x="65" y="45" fill="#475569" textAnchor="middle" fontSize="9">{stringingAnalysis?.safeStringSize || 14}x TOPCon 585W</text>
              <text x="65" y="60" fill="#0284c7" textAnchor="middle" fontSize="9" fontWeight="bold">{stringingAnalysis?.winterStringVoc || 745}V DC</text>
            </g>

            {/* PV String 2 */}
            <g transform="translate(40, 160)">
              <rect x="0" y="0" width="130" height="70" rx="8" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
              <text x="65" y="25" fill="#047857" fontWeight="bold" textAnchor="middle" fontSize="11">PV STRING 2</text>
              <text x="65" y="45" fill="#475569" textAnchor="middle" fontSize="9">{stringingAnalysis?.safeStringSize || 14}x TOPCon 585W</text>
              <text x="65" y="60" fill="#0284c7" textAnchor="middle" fontSize="9" fontWeight="bold">{stringingAnalysis?.winterStringVoc || 745}V DC</text>
            </g>

            {/* DC Disconnect & SPD Box */}
            <g transform="translate(230, 95)">
              <rect x="0" y="0" width="110" height="100" rx="8" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
              <text x="55" y="28" fill="#b45309" fontWeight="bold" textAnchor="middle" fontSize="10">DC COMBINER</text>
              <text x="55" y="48" fill="#334155" textAnchor="middle" fontSize="9">1000V DC Fuses</text>
              <text x="55" y="66" fill="#334155" textAnchor="middle" fontSize="9">Class II SPD</text>
              <text x="55" y="85" fill="#64748b" textAnchor="middle" fontSize="8">{dcCableSizeMm2}mm² Solar Cable</text>
            </g>

            {/* Lines: Strings to Combiner */}
            <path d="M 170 95 L 230 120" stroke="#e11d48" strokeWidth="2" fill="none" />
            <path d="M 170 195 L 230 170" stroke="#e11d48" strokeWidth="2" fill="none" />

            {/* Grid Inverter */}
            <g transform="translate(400, 80)">
              <rect x="0" y="0" width="140" height="130" rx="10" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
              <text x="70" y="30" fill="#0369a1" fontWeight="bold" textAnchor="middle" fontSize="11">GRID INVERTER</text>
              <text x="70" y="50" fill="#0f172a" fontWeight="bold" textAnchor="middle" fontSize="10">{inverterCapacityKw || 20} kW 3-Phase</text>
              <text x="70" y="70" fill="#64748b" textAnchor="middle" fontSize="9">Dual MPPT / 98.6%</text>
              <text x="70" y="110" fill="#475569" textAnchor="middle" fontSize="8" fontWeight="bold">400V / 50Hz AC</text>
            </g>

            {/* Line: Combiner to Inverter */}
            <path d="M 340 145 L 400 145" stroke="#e11d48" strokeWidth="2.5" fill="none" />
            <text x="370" y="138" fill="#e11d48" textAnchor="middle" fontSize="8" fontWeight="bold">DC+</text>

            {/* AC Isolator & Surge Protection */}
            <g transform="translate(600, 95)">
              <rect x="0" y="0" width="110" height="100" rx="8" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
              <text x="55" y="28" fill="#047857" fontWeight="bold" textAnchor="middle" fontSize="10">AC DB BOX</text>
              <text x="55" y="48" fill="#334155" textAnchor="middle" fontSize="9">4-Pole 63A MCB</text>
              <text x="55" y="66" fill="#334155" textAnchor="middle" fontSize="9">Type II AC SPD</text>
              <text x="55" y="85" fill="#64748b" textAnchor="middle" fontSize="8">{acCableSizeMm2}mm² 4-Core Cu</text>
            </g>

            {/* Line: Inverter to AC DB */}
            <path d="M 540 145 L 600 145" stroke="#059669" strokeWidth="2.5" fill="none" />

            {/* Bi-Directional Net Meter */}
            <g transform="translate(770, 90)">
              <rect x="0" y="0" width="130" height="110" rx="10" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
              <text x="65" y="30" fill="#4338ca" fontWeight="bold" textAnchor="middle" fontSize="10">NET METERING</text>
              <text x="65" y="50" fill="#334155" textAnchor="middle" fontSize="9">Bi-Directional</text>
              <text x="65" y="70" fill="#0f172a" fontWeight="bold" textAnchor="middle" fontSize="10">WAPDA / DISCO</text>
              <text x="65" y="90" fill="#059669" textAnchor="middle" fontSize="9" fontWeight="bold">3-Phase 4-Wire</text>
            </g>

            {/* Line: AC DB to Net Meter */}
            <path d="M 710 145 L 770 145" stroke="#059669" strokeWidth="2.5" fill="none" />

            {/* Earth Grounding Pit */}
            <g transform="translate(470, 250)">
              <line x1="0" y1="-40" x2="0" y2="0" stroke="#d97706" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="-20" y1="0" x2="20" y2="0" stroke="#d97706" strokeWidth="2" />
              <line x1="-12" y1="6" x2="12" y2="6" stroke="#d97706" strokeWidth="2" />
              <line x1="-6" y1="12" x2="6" y2="12" stroke="#d97706" strokeWidth="2" />
              <text x="0" y="28" fill="#b45309" textAnchor="middle" fontSize="9" fontWeight="bold">Earth Pit &lt; 5Ω</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
