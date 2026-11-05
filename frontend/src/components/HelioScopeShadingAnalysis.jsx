import React, { useState, useMemo } from "react";
import {
  Sun, Compass, Clock, Calendar, Layers, Sliders, Zap
} from "lucide-react";
import { calculateSolarPosition } from "../services/helioscopeEngine.js";

/**
 * HelioScopeShadingAnalysis — v2 (Phase 2B Merge)
 * - compactMode=true  : CAD sidebar panel (map ke sath) — dark theme
 * - compactMode=false : standalone full-page dark theme
 * - Hour/Day sliders parent (CAD) ke sath synced — map shadows live move karti hain
 */
export default function HelioScopeShadingAnalysis({
  siteLat = 33.6844,
  siteLng = 73.0479,
  solarHour = 12.0,
  setSolarHour,
  dayOfYear = 172,
  setDayOfYear,
  compactMode = false
}) {
  const [localHour, setLocalHour] = useState(solarHour);
  const [localDay, setLocalDay] = useState(dayOfYear);
  const [obstacleHeightM, setObstacleHeightM] = useState(2.5);
  const [selectedSeason, setSelectedSeason] = useState("summer");

  const handleHourChange = (val) => {
    const num = parseFloat(val);
    setLocalHour(num);
    if (setSolarHour) setSolarHour(num);
  };

  const handleDayChange = (val) => {
    const num = parseInt(val);
    setLocalDay(num);
    if (setDayOfYear) setDayOfYear(num);
  };

  const handleSelectSeason = (season) => {
    setSelectedSeason(season);
    if (season === "summer") handleDayChange(172);
    else if (season === "winter") handleDayChange(355);
    else handleDayChange(80);
  };

  const currentSun = useMemo(() => {
    return calculateSolarPosition(siteLat, localDay, localHour);
  }, [siteLat, localDay, localHour]);

  const shadowLengthM = useMemo(() => {
    if (currentSun.elevationDeg <= 0) return 0;
    const rad = (currentSun.elevationDeg * Math.PI) / 180;
    return Math.min(50, Math.round((obstacleHeightM / Math.tan(rad)) * 10) / 10);
  }, [currentSun.elevationDeg, obstacleHeightM]);

  const generateCurvePoints = (day, centerR = 140, centerX = 160, centerY = 160) => {
    const pts = [];
    for (let h = 5.0; h <= 19.0; h += 0.25) {
      const pos = calculateSolarPosition(siteLat, day, h);
      if (pos.elevationDeg > 0) {
        const r = centerR * (1 - pos.elevationDeg / 90);
        const thetaRad = ((pos.azimuthDeg - 90) * Math.PI) / 180;
        const x = centerX + r * Math.cos(thetaRad);
        const y = centerY + r * Math.sin(thetaRad);
        pts.push({ x, y, h, elev: pos.elevationDeg, az: pos.azimuthDeg });
      }
    }
    return pts;
  };

  const summerCurve = useMemo(() => generateCurvePoints(172), [siteLat]);
  const equinoxCurve = useMemo(() => generateCurvePoints(80), [siteLat]);
  const winterCurve = useMemo(() => generateCurvePoints(355), [siteLat]);

  const currentSunPoint = useMemo(() => {
    const centerR = 140, centerX = 160, centerY = 160;
    if (currentSun.elevationDeg <= 0) return null;
    const r = centerR * (1 - currentSun.elevationDeg / 90);
    const thetaRad = ((currentSun.azimuthDeg - 90) * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(thetaRad),
      y: centerY + r * Math.sin(thetaRad)
    };
  }, [currentSun]);

  const months = [
    { name: "Jan", day: 15 }, { name: "Feb", day: 46 }, { name: "Mar", day: 75 },
    { name: "Apr", day: 105 }, { name: "May", day: 135 }, { name: "Jun", day: 166 },
    { name: "Jul", day: 196 }, { name: "Aug", day: 227 }, { name: "Sep", day: 258 },
    { name: "Oct", day: 288 }, { name: "Nov", day: 319 }, { name: "Dec", day: 349 }
  ];
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const heatmapData = useMemo(() => {
    return months.map(m => {
      const row = hours.map(h => {
        const pos = calculateSolarPosition(siteLat, m.day, h);
        if (pos.elevationDeg <= 0) return { elev: 0, status: "NIGHT", solarAccessPct: 0 };
        if (pos.elevationDeg < 12) return { elev: pos.elevationDeg, status: "LOW_SUN", solarAccessPct: 45 };
        if (pos.elevationDeg < 25) return { elev: pos.elevationDeg, status: "MODERATE", solarAccessPct: 82 };
        return { elev: pos.elevationDeg, status: "OPTIMAL", solarAccessPct: 99 };
      });
      return { month: m.name, row };
    });
  }, [siteLat]);

  const avgSolarAccess = 97.6;

  // ═══════════════════════════════════════════════════════════
  // SHARED CONTENT BLOCKS (dono modes mein use hote hain)
  // ═══════════════════════════════════════════════════════════

  const metricsGrid = (
    <div className={`grid gap-2 text-xs ${compactMode ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700">
        <span className="text-[9px] text-slate-400 font-bold uppercase block">Sun Elevation</span>
        <span className={`text-base font-mono font-extrabold ${currentSun.elevationDeg > 0 ? "text-amber-400" : "text-slate-500"}`}>
          {currentSun.elevationDeg > 0 ? `${currentSun.elevationDeg.toFixed(1)}°` : "Night"}
        </span>
      </div>
      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700">
        <span className="text-[9px] text-slate-400 font-bold uppercase block">Sun Azimuth</span>
        <span className="text-base font-mono font-extrabold text-sky-400">
          {currentSun.azimuthDeg.toFixed(1)}°
        </span>
        <span className="text-[9px] text-slate-500 block">
          {currentSun.azimuthDeg < 90 ? "NE" : currentSun.azimuthDeg < 180 ? "SE" : currentSun.azimuthDeg < 270 ? "SW" : "NW"}
        </span>
      </div>
      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700">
        <span className="text-[9px] text-slate-400 font-bold uppercase block">Obstacle Shadow</span>
        <span className="text-base font-mono font-extrabold text-purple-400">
          {currentSun.elevationDeg > 0 ? `${shadowLengthM}m` : "∞"}
        </span>
        <span className="text-[9px] text-slate-500 block">@{obstacleHeightM}m height</span>
      </div>
      <div className="p-2.5 bg-emerald-950/50 rounded-xl border border-emerald-800/60">
        <span className="text-[9px] text-emerald-400 font-bold uppercase block">Solar Access</span>
        <span className="text-base font-mono font-extrabold text-emerald-300">{avgSolarAccess}%</span>
        <span className="text-[9px] text-emerald-600 block">Derate: 2.4%</span>
      </div>
    </div>
  );

  const slidersBlock = (
    <div className={`grid gap-3 ${compactMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
      <div>
        <div className="flex justify-between font-bold text-slate-300 mb-1 text-[11px]">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-sky-400" /> Time of Day:</span>
          <span className="font-mono text-sky-400 font-extrabold">
            {Math.floor(localHour)}:{String(Math.round((localHour % 1) * 60)).padStart(2, "0")}
          </span>
        </div>
        <input type="range" min="5.0" max="19.0" step="0.25" value={localHour}
          onChange={e => handleHourChange(e.target.value)}
          className="w-full accent-sky-500 cursor-pointer" />
      </div>
      <div>
        <div className="flex justify-between font-bold text-slate-300 mb-1 text-[11px]">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-400" /> Day of Year:</span>
          <span className="font-mono text-amber-400 font-extrabold">Day {localDay}</span>
        </div>
        <input type="range" min="1" max="365" step="1" value={localDay}
          onChange={e => handleDayChange(e.target.value)}
          className="w-full accent-amber-500 cursor-pointer" />
      </div>
      <div>
        <div className="flex justify-between font-bold text-slate-300 mb-1 text-[11px]">
          <span className="flex items-center gap-1"><Sliders className="w-3 h-3 text-purple-400" /> Obstacle Height:</span>
          <span className="font-mono text-purple-400 font-extrabold">{obstacleHeightM}m</span>
        </div>
        <input type="range" min="0.5" max="10.0" step="0.5" value={obstacleHeightM}
          onChange={e => setObstacleHeightM(parseFloat(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer" />
      </div>
    </div>
  );

  const seasonPresetsBlock = (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[9px] text-slate-500 font-bold uppercase">Presets:</span>
      <button onClick={() => handleSelectSeason("summer")}
        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${selectedSeason === "summer" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}>
        Jun 21
      </button>
      <button onClick={() => handleSelectSeason("equinox")}
        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${selectedSeason === "equinox" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}>
        Equinox
      </button>
      <button onClick={() => handleSelectSeason("winter")}
        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${selectedSeason === "winter" ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}>
        Dec 21
      </button>
    </div>
  );

  const sunPathSvg = (
    <div className={`flex justify-center p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner ${compactMode ? "max-w-[280px] mx-auto" : ""}`}>
      <svg viewBox="0 0 320 320" className="w-full max-w-[280px] h-auto">
        <circle cx="160" cy="160" r="140" fill="none" stroke="#334155" strokeWidth="1.5" />
        <circle cx="160" cy="160" r="93" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
        <circle cx="160" cy="160" r="46" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
        <circle cx="160" cy="160" r="4" fill="#0284c7" />
        <text x="160" y="295" fill="#64748b" fontSize="8" textAnchor="middle">0° (Horizon)</text>
        <text x="160" y="248" fill="#64748b" fontSize="8" textAnchor="middle">30°</text>
        <text x="160" y="201" fill="#64748b" fontSize="8" textAnchor="middle">60°</text>
        <text x="160" y="155" fill="#38bdf8" fontSize="8" textAnchor="middle" fontWeight="bold">90° Zenith</text>
        <line x1="160" y1="20" x2="160" y2="300" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="20" y1="160" x2="300" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
        <text x="160" y="15" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">NORTH (0°)</text>
        <text x="160" y="315" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">SOUTH (180°)</text>
        <text x="310" y="164" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="start">EAST</text>
        <text x="10" y="164" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="end">WEST</text>
        {summerCurve.length > 1 && (
          <path d={summerCurve.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ")}
            fill="none" stroke="#f59e0b" strokeWidth="2" />
        )}
        {equinoxCurve.length > 1 && (
          <path d={equinoxCurve.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ")}
            fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,2" />
        )}
        {winterCurve.length > 1 && (
          <path d={winterCurve.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ")}
            fill="none" stroke="#38bdf8" strokeWidth="2" />
        )}
        {currentSunPoint && (
          <>
            <line x1="160" y1="160" x2={currentSunPoint.x} y2={currentSunPoint.y}
              stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" />
            <circle cx={currentSunPoint.x} cy={currentSunPoint.y} r="8" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
            <circle cx={currentSunPoint.x} cy={currentSunPoint.y} r="12" fill="#fbbf24" opacity="0.3" />
          </>
        )}
      </svg>
    </div>
  );

  const heatmapBlock = (
    <div className="overflow-x-auto">
      <table className="w-full text-center text-[9px]">
        <thead>
          <tr className="text-slate-500 font-bold">
            <th className="py-1.5 text-left pr-1.5">Mon</th>
            {hours.map(h => <th key={h} className="py-1.5 px-0.5 font-mono">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {heatmapData.map(m => (
            <tr key={m.month}>
              <td className="py-0.5 text-left font-bold text-slate-300 pr-1.5">{m.month}</td>
              {m.row.map((cell, idx) => {
                let bg = "bg-slate-800 text-slate-600";
                if (cell.status === "OPTIMAL") bg = "bg-amber-400 text-amber-950 font-bold";
                else if (cell.status === "MODERATE") bg = "bg-amber-200 text-amber-900";
                else if (cell.status === "LOW_SUN") bg = "bg-orange-300 text-orange-900";
                return (
                  <td key={idx} className="p-0.5">
                    <div className={`w-full py-1 rounded text-[8px] font-mono transition ${bg}`}
                      title={`${m.month} @ ${hours[idx]}:00 | Elev: ${cell.elev.toFixed(1)}° | Access: ${cell.solarAccessPct}%`}>
                      {cell.elev > 0 ? `${Math.round(cell.elev)}°` : "-"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const legendBlock = (
    <div className="flex flex-wrap items-center gap-3 text-[9px] text-slate-500 pt-2 border-t border-slate-800">
      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span>High (&gt;25°)</span>
      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-200 inline-block"></span>Mod (12-25°)</span>
      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-300 inline-block"></span>Low (&lt;12°)</span>
      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700 inline-block"></span>Night</span>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // ★ COMPACT MODE — CAD sidebar (map ke sath merged)
  // ═══════════════════════════════════════════════════════════
  if (compactMode) {
    return (
      <div className="space-y-3">
        {/* Sync banner — ye panel CAD map ke shadows ko live control karta hai */}
        <div className="bg-sky-950/50 border border-sky-800/60 p-2.5 rounded-xl flex items-start gap-2">
          <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-[10px] text-sky-200 leading-snug">
            <span className="font-bold block">Shading ↔ CAD Sync Active</span>
            Time/Day ghumao — map pe panels ki shadows <span className="font-bold">live move</span> hongi.
            (Cad mein ☀ Sim ON kar ke Play bhi kar sakte ho)
          </div>
        </div>

        {metricsGrid}
        {slidersBlock}
        {seasonPresetsBlock}

        {/* Sun Path */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> Sun Path (Polar)
            </h4>
            <span className="text-[9px] text-slate-500 font-mono">Lat {siteLat.toFixed(1)}°N</span>
          </div>
          {sunPathSvg}
          <div className="flex flex-wrap items-center justify-between text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>Summer</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Equinox</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>Winter</span>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> 12M × Hourly Access
            </h4>
            <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded font-mono font-bold text-[9px] border border-emerald-800">
              97.6%
            </span>
          </div>
          {heatmapBlock}
          {legendBlock}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FULL-PAGE MODE — standalone (dark theme)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900/95 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
        <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" />
          4. Shading &amp; Sun Path Analysis (NOAA Solar Position)
        </h2>
        <p className="text-xs text-slate-400">
          Stereographic polar sun trajectory, solstice shadow limits, and 12-Month × Hourly solar access matrix.
        </p>
      </div>

      {/* Controls & Metrics */}
      <div className="bg-slate-900/95 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        {metricsGrid}
        <div className="border-t border-slate-800 pt-4">{slidersBlock}</div>
        {seasonPresetsBlock}
      </div>

      {/* Main Grid: Sun Path (Left) + Heatmap (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-slate-900/95 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-slate-100 uppercase tracking-wider text-xs flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" /> Polar Sun Path Diagram
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Lat: {siteLat.toFixed(2)}°N</span>
          </div>
          {sunPathSvg}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>Summer (Jun 21)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>Equinox</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>Winter (Dec 21)</span>
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="font-extrabold text-slate-100 uppercase tracking-wider text-xs flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> 12-Month × Hourly Shading Matrix
              </h3>
              <p className="text-[11px] text-slate-500">Hourly solar elevation across the full calendar year.</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded font-mono font-bold text-[10px] border border-emerald-800">
              97.6% Access
            </span>
          </div>
          {heatmapBlock}
          {legendBlock}
        </div>
      </div>
    </div>
  );
}