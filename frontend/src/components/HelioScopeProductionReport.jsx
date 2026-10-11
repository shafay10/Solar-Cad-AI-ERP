import React, { useMemo } from "react";
import {
  BarChart3, TrendingUp, Sun, Zap, ShieldCheck, DollarSign,
  ArrowDownRight, Layers, Award, Calendar, FileText
} from "lucide-react";
import { formatPKR } from "../services/solarEngine.js";

export default function HelioScopeProductionReport({
  systemStats,
  tiltDegrees = 18,
  azimuthDegrees = 180,
  siteLat = 33.6844,
  productionAnalysis
}) {
  const dcCapacityKw = systemStats?.kwp || 15.2;

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    return productionAnalysis?.monthlyGeneration || [
      { month: "Jan", kwh: 1512, sharePct: 6.2 },
      { month: "Feb", kwh: 1731, sharePct: 7.1 },
      { month: "Mar", kwh: 2146, sharePct: 8.8 },
      { month: "Apr", kwh: 2390, sharePct: 9.8 },
      { month: "May", kwh: 2561, sharePct: 10.5 },
      { month: "Jun", kwh: 2488, sharePct: 10.2 },
      { month: "Jul", kwh: 2293, sharePct: 9.4 },
      { month: "Aug", kwh: 2244, sharePct: 9.2 },
      { month: "Sep", kwh: 2171, sharePct: 8.9 },
      { month: "Oct", kwh: 1976, sharePct: 8.1 },
      { month: "Nov", kwh: 1585, sharePct: 6.5 },
      { month: "Dec", kwh: 1293, sharePct: 5.3 }
    ];
  }, [productionAnalysis]);

  const maxMonthKwh = Math.max(...monthlyData.map(m => m.kwh));

  // Loss tree stages
  const lossTree = productionAnalysis?.lossTree || [];

  // Financial bill savings in PKR (Assumes Rs 65/unit average blend tariff in Pakistan)
  const annualSavingsPKR = Math.round((productionAnalysis?.netAnnualKwh || 24500) * 65);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          6. Photovoltaic Production & Energy Yield Estimate (NREL PVWatts Simulation)
        </h2>
        <p className="text-xs text-slate-500">
          Simulated annual yield, 12-month generation forecast, performance ratio (PR %), and HelioScope system loss tree.
        </p>
      </div>

      {/* Top Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Annual Generation</span>
          <span className="text-xl font-mono font-extrabold text-emerald-700 block my-0.5">
            {(productionAnalysis?.netAnnualKwh || 24500).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-bold">kWh / Year</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Specific Yield</span>
          <span className="text-xl font-mono font-extrabold text-blue-700 block my-0.5">
            {productionAnalysis?.specificYieldKwhPerKwp || 1612}
          </span>
          <span className="text-[10px] text-slate-500 font-bold">kWh / kWp / Year</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Performance Ratio</span>
          <span className="text-xl font-mono font-extrabold text-purple-700 block my-0.5">
            {productionAnalysis?.performanceRatioPct || 81.5}%
          </span>
          <span className="text-[10px] text-slate-500 font-bold">IEC 61724 Standard</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Capacity Factor (CUF)</span>
          <span className="text-xl font-mono font-extrabold text-amber-700 block my-0.5">
            {productionAnalysis?.capacityFactorPct || 18.4}%
          </span>
          <span className="text-[10px] text-slate-500 font-bold">Annual CUF %</span>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Est. Annual Tariff Savings</span>
          <span className="text-base sm:text-lg font-mono font-extrabold text-emerald-900 block my-0.5">
            {formatPKR(annualSavingsPKR)}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">@ Rs 65 / Grid Unit</span>
        </div>
      </div>

      {/* 12-Month Generation Chart (Full Width) */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              12-Month Expected Energy Production Profile (kWh)
            </h3>
            <p className="text-[11px] text-slate-500">Peak production occurs during May-June before monsoon season cloud cover.</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
              Monthly AC Generation (kWh)
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-56 flex items-end justify-between gap-2 pt-8 pb-2 px-2 bg-slate-50/70 rounded-xl border border-slate-100">
          {monthlyData.map((m, idx) => {
            const heightPct = Math.max(12, Math.round((m.kwh / (maxMonthKwh || 1)) * 100));
            const isPeak = m.kwh === maxMonthKwh;

            return (
              <div key={m.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Hover Tooltip */}
                <div className="absolute -top-7 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
                  {m.month}: {m.kwh.toLocaleString()} kWh ({m.sharePct}%)
                </div>

                <div
                  className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 ${
                    isPeak
                      ? "bg-emerald-500 hover:bg-emerald-400 shadow-sm"
                      : "bg-emerald-600/80 hover:bg-emerald-600"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className={`text-[10px] font-bold mt-2 ${isPeak ? "text-emerald-700 font-extrabold" : "text-slate-600"}`}>
                  {m.month}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {Math.round(m.kwh / 1000 * 10) / 10}k
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Monthly Breakdown Table (Left 6) + HelioScope Loss Tree (Right 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 6: Monthly Simulation Table */}
        <div className="lg:col-span-6 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Monthly Simulation Breakdown Table
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">100% Normalized</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Month</th>
                  <th className="py-2 px-3">Days</th>
                  <th className="py-2 px-3">Daily Avg PSH</th>
                  <th className="py-2 px-3">Generation</th>
                  <th className="py-2 px-3 text-right">Annual Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.map(m => (
                  <tr key={m.month} className="hover:bg-slate-50/80">
                    <td className="py-1.5 px-3 font-bold text-slate-800">{m.month}</td>
                    <td className="py-1.5 px-3 text-slate-500">30</td>
                    <td className="py-1.5 px-3 font-mono text-slate-600">
                      {(m.kwh / (dcCapacityKw * 30)).toFixed(2)} hrs
                    </td>
                    <td className="py-1.5 px-3 font-mono font-bold text-emerald-700">
                      {m.kwh.toLocaleString()} kWh
                    </td>
                    <td className="py-1.5 px-3 font-mono text-slate-700 text-right">
                      {m.sharePct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 6: HelioScope System Loss Tree (Waterfall) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              HelioScope System Loss Tree (Waterfall)
            </h3>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-mono font-bold text-[10px] rounded">
              81.5% PR
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Step-by-step energy dissipation cascade from gross plane-of-array irradiance down to net delivered grid energy.
          </p>

          <div className="space-y-2 pt-1">
            {lossTree.map((stage, idx) => {
              const isStart = idx === 0;
              const isEnd = idx === lossTree.length - 1;

              return (
                <div
                  key={stage.stage}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isStart
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : isEnd
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-white border flex items-center justify-center font-mono text-[10px] font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-xs block">{stage.stage}</span>
                      {stage.lostKwh > 0 && (
                        <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />
                          Lost: {stage.lostKwh.toLocaleString()} kWh (-{stage.lossPct}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-extrabold block text-xs">{stage.outputKwh?.toLocaleString()} kWh</span>
                    <span className="text-[9px] text-slate-400">
                      {isStart ? "100% GHI" : `${((stage.outputKwh / (lossTree[0].outputKwh || 1)) * 100).toFixed(1)}% Net`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
