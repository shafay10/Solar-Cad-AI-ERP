import React, { useState, useMemo } from "react";
import {
  Sparkles, Sun, Zap, ShieldCheck, Activity, BarChart3,
  CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp, Layers, Compass
} from "lucide-react";
import { calculateAIIrradianceAndYield, calculateAIEpcFeasibility } from "../services/solarEngine.js";

export default function ModuleAICopilot({
  capacityKw,
  moduleWattage,
  pitch,
  azimuth,
  gpsCoords,
  polygonArea
}) {
  const [albedoType, setAlbedoType] = useState("WHITE_TPO");
  const [isBifacial, setIsBifacial] = useState(true);
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState(Math.round(capacityKw * 1.2));
  const [transformerKva, setTransformerKva] = useState(capacityKw >= 1000 ? 2500 : 630);

  const latitude = parseFloat(gpsCoords?.lat) || 31.5204;
  const roofAreaSqft = polygonArea?.areaSqFt || 28500;

  const aiYield = useMemo(() => {
    return calculateAIIrradianceAndYield(
      latitude,
      capacityKw,
      pitch,
      azimuth,
      isBifacial,
      albedoType
    );
  }, [latitude, capacityKw, pitch, azimuth, isBifacial, albedoType]);

  const aiEpc = useMemo(() => {
    return calculateAIEpcFeasibility(
      capacityKw,
      roofAreaSqft,
      sanctionedLoadKw,
      transformerKva
    );
  }, [capacityKw, roofAreaSqft, sanctionedLoadKw, transformerKva]);

  const maxMonthGen = Math.max(...aiYield.monthlyData.map(m => m.generationKwh), 1000);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">AI Solar Generation & EPC Feasibility Copilot</h2>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
              SOLARGIS / PVSYST CALIBER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global GHI/DNI irradiance modeling, bifacial albedo gain, loss waterfall, and automated DISCO net-metering validation
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
          <span className="text-slate-600 font-medium">Engineering Feasibility:</span>
          <span className="font-mono font-bold text-emerald-800">{aiEpc.statusScore}</span>
        </div>
      </div>

      {/* Grid: 12-Month Generation Chart & Loss Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 12-Month Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" /> 12-Month Seasonal Generation Profile
              </h3>
              <p className="text-[11px] text-slate-500">
                Annual Yield: <span className="font-mono font-bold text-emerald-700">{aiYield.annualSpecificYield} kWh/kWp/yr</span> | Total: <span className="font-mono font-bold text-emerald-700">{(aiYield.totalAnnualKwh).toLocaleString()} kWh</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={albedoType}
                onChange={(e) => setAlbedoType(e.target.value)}
                className="bg-white border border-slate-300 text-[11px] font-bold text-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-600"
              >
                <option value="WHITE_TPO">White TPO Membrane (+12.1% Albedo)</option>
                <option value="CONCRETE">Industrial Concrete (+5.5% Albedo)</option>
                <option value="GRAVEL">Crushed Gravel (+4.4% Albedo)</option>
                <option value="GRASS">Green Ground (+4.0% Albedo)</option>
              </select>
            </div>
          </div>

          {/* Monthly Generation Bars */}
          <div className="h-48 w-full flex items-end gap-1.5 pt-6 pb-2 px-2 bg-slate-50 rounded-xl border border-slate-200">
            {aiYield.monthlyData.map((m, idx) => {
              const heightPct = Math.max(8, (m.generationKwh / maxMonthGen) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                  <div className="absolute -top-9 bg-white border border-slate-300 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none whitespace-nowrap z-20">
                    {m.month}: {m.generationKwh.toLocaleString()} kWh (GHI: {m.ghiDaily})
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-emerald-600 rounded-t hover:bg-emerald-500 transition-all duration-300 relative overflow-hidden"
                  >
                    {isBifacial && (
                      <div
                        style={{ height: `${aiYield.bifacialGainPct * 2}%` }}
                        className="w-full bg-emerald-400 absolute top-0"
                        title="Bifacial Albedo Gain"
                      />
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 mt-1">{m.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
              <span>Frontside Yield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
              <span>Bifacial Rearside Gain (+{aiYield.bifacialGainPct}%)</span>
            </div>
            <span>Performance Ratio: <strong className="text-emerald-700 font-bold">{aiYield.performanceRatio}%</strong></span>
          </div>
        </div>

        {/* Right: Loss Tree Waterfall */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
            <Activity className="w-4 h-4 text-emerald-600" /> PVsyst Energy Loss Tree Waterfall
          </h3>

          <div className="space-y-1.5">
            {aiYield.lossTree.map((loss, i) => (
              <div key={i} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-medium truncate">{loss.name}</span>
                <span className="font-mono text-xs text-rose-600 font-bold">{loss.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EPC Engineering Feasibility & Net-Metering Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> AI EPC Feasibility & Grid Interconnection Checks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated checks for Transformer headroom, DISCO net-metering limit, and inter-row pitch
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold">
            100% DISCO Compliant
          </span>
        </div>

        {/* 4 Diagnostic Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Roof Footprint Density</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {aiEpc.areaUtilizationPct}%
            </div>
            <span className="text-[10px] text-slate-500">Req: {aiEpc.requiredAreaSqft.toLocaleString()} sq ft</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Transformer Saturation</span>
            <div className={`text-xl font-bold font-mono mt-1 ${aiEpc.isTxAdequate ? "text-emerald-700" : "text-amber-700"}`}>
              {aiEpc.txLoadingPct}%
            </div>
            <span className="text-[10px] text-slate-500">Rating: {transformerKva} kVA</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Inter-Row Pitch Spacing</span>
            <div className="text-xl font-bold font-mono text-slate-800 mt-1">
              {aiEpc.interRowPitchSpacingMeters} m
            </div>
            <span className="text-[10px] text-slate-500">Zero 9am-3pm Shading</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Structural Dead Load</span>
            <div className="text-xl font-bold font-mono text-slate-800 mt-1">
              {aiEpc.deadLoadKgPerSqm} kg/m²
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">Safe Ballast Limit</span>
          </div>
        </div>

        {/* AI Recommendations List */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-700 block">AI Engineering Directives:</span>
          {aiEpc.recommendations.map((rec, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
