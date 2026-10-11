import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp, Calendar, Zap, Leaf,
  Award, BarChart3, LineChart,
  RefreshCw, Sliders, DollarSign, Calculator, Lock, CheckCircle2,
  AlertCircle, Save, Clock, Check, History, Building2, MapPin,
  ShieldCheck, FileText, UserCheck
} from "lucide-react";
import { formatPKR, calculateFinancialsPKR } from "../services/solarEngine.js";
import { formatDateWithDay, formatDateAndDayOnly } from "../utils/dateUtils.js";

export default function ModuleFinancial({
  activeProject,
  financialData,
  capacityKw,
  finalPricePkr,
  gridTariffPkr = 55.0,
  auditLogs = [],
  token = "",
  onProjectUpdated = null
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "saved", "error"
  const [saveMessage, setSaveMessage] = useState("");

  // Real Company Financial & Utility Input States
  // Automatically populates from activeProject (or its saved financialModel), or falls back to standard defaults
  const [financialSettings, setFinancialSettings] = useState(() => {
    const model = activeProject?.financialModel || {};
    const contractPrice = 
      activeProject?.contractPricePkr !== undefined && activeProject?.contractPricePkr !== null && activeProject?.contractPricePkr !== ""
        ? activeProject.contractPricePkr
        : (activeProject?.contractPrice ?? activeProject?.dealPrice ?? finalPricePkr ?? "");
    const sysCap = 
      activeProject?.systemCapacityKw !== undefined && activeProject?.systemCapacityKw !== null && activeProject?.systemCapacityKw !== ""
        ? activeProject.systemCapacityKw
        : (activeProject?.capacityKWp ?? activeProject?.systemCapacity ?? capacityKw ?? "");

    return {
      investmentPkr: model.investmentPkr || contractPrice || "",
      capacityKw: model.capacityKw || sysCap || "",
      monthlyBillPkr: model.monthlyBillPkr || "",
      monthlyUnitsKwh: model.monthlyUnitsKwh || "",
      gridTariffPkr: model.gridTariffPkr || activeProject?.gridTariff || 55.0,
      tariffEscalationPct: model.tariffEscalationPct ?? 8.0,
      degradationPct: model.degradationPct ?? 0.5,
      discountRatePct: model.discountRatePct ?? 12.0,
      annualOmCostPkr: model.annualOmCostPkr || ""
    };
  });

  // Synchronize inputs deterministically whenever active project changes
  // Crucial: Only depend on primitive identifiers [activeProject?.id, activeProject?.updatedAt] to eliminate re-render loops
  useEffect(() => {
    if (!activeProject) return;
    const model = activeProject.financialModel || {};
    const contractPrice = 
      activeProject.contractPricePkr !== undefined && activeProject.contractPricePkr !== null && activeProject.contractPricePkr !== ""
        ? activeProject.contractPricePkr
        : (activeProject.contractPrice ?? activeProject.dealPrice ?? finalPricePkr ?? "");
    const sysCap = 
      activeProject.systemCapacityKw !== undefined && activeProject.systemCapacityKw !== null && activeProject.systemCapacityKw !== ""
        ? activeProject.systemCapacityKw
        : (activeProject.capacityKWp ?? activeProject.systemCapacity ?? capacityKw ?? "");

    setFinancialSettings({
      investmentPkr: model.investmentPkr || contractPrice || "",
      capacityKw: model.capacityKw || sysCap || "",
      monthlyBillPkr: model.monthlyBillPkr || "",
      monthlyUnitsKwh: model.monthlyUnitsKwh || "",
      gridTariffPkr: model.gridTariffPkr || activeProject.gridTariff || 55.0,
      tariffEscalationPct: model.tariffEscalationPct ?? 8.0,
      degradationPct: model.degradationPct ?? 0.5,
      discountRatePct: model.discountRatePct ?? 12.0,
      annualOmCostPkr: model.annualOmCostPkr || ""
    });
    setSaveStatus("");
    setSaveMessage("");
  }, [activeProject?.id, activeProject?.updatedAt]);

  // Two-way sync via global window event when project is switched in header dropdown
  useEffect(() => {
    const handleProjectSwitched = (e) => {
      const proj = e.detail;
      if (!proj) return;
      const model = proj.financialModel || {};
      const contractPrice = 
        proj.contractPricePkr !== undefined && proj.contractPricePkr !== null && proj.contractPricePkr !== ""
          ? proj.contractPricePkr
          : (proj.contractPrice ?? proj.dealPrice ?? "");
      const sysCap = 
        proj.systemCapacityKw !== undefined && proj.systemCapacityKw !== null && proj.systemCapacityKw !== ""
          ? proj.systemCapacityKw
          : (proj.capacityKWp ?? proj.systemCapacity ?? "");

      setFinancialSettings({
        investmentPkr: model.investmentPkr || contractPrice || "",
        capacityKw: model.capacityKw || sysCap || "",
        monthlyBillPkr: model.monthlyBillPkr || "",
        monthlyUnitsKwh: model.monthlyUnitsKwh || "",
        gridTariffPkr: model.gridTariffPkr || proj.gridTariff || 55.0,
        tariffEscalationPct: model.tariffEscalationPct ?? 8.0,
        degradationPct: model.degradationPct ?? 0.5,
        discountRatePct: model.discountRatePct ?? 12.0,
        annualOmCostPkr: model.annualOmCostPkr || ""
      });
      setSaveStatus("");
      setSaveMessage("");
    };

    window.addEventListener("solar_project_switched", handleProjectSwitched);
    return () => window.removeEventListener("solar_project_switched", handleProjectSwitched);
  }, []);

  // Live calculation automatically executed whenever parameters change
  const liveFinancials = useMemo(() => {
    const kw = parseFloat(financialSettings.capacityKw) || 0;
    const price = parseFloat(financialSettings.investmentPkr) || 0;
    const tariff = parseFloat(financialSettings.gridTariffPkr) || 55.0;

    if (kw <= 0 || price <= 0) {
      return null;
    }

    return calculateFinancialsPKR(kw, price, tariff, {
      annualDegradationPct: parseFloat(financialSettings.degradationPct) || 0.5,
      tariffEscalationPct: parseFloat(financialSettings.tariffEscalationPct) || 8.0,
      discountRatePct: parseFloat(financialSettings.discountRatePct) || 12.0,
      annualOmCostPkr: financialSettings.annualOmCostPkr ? parseFloat(financialSettings.annualOmCostPkr) : undefined
    });
  }, [
    financialSettings.capacityKw,
    financialSettings.investmentPkr,
    financialSettings.gridTariffPkr,
    financialSettings.degradationPct,
    financialSettings.tariffEscalationPct,
    financialSettings.discountRatePct,
    financialSettings.annualOmCostPkr
  ]);

  // Save financial parameters directly to backend database
  const handleSaveFinancials = async () => {
    if (!activeProject?.id) return;
    setSaveStatus("saving");
    setSaveMessage("");

    const currentToken = token || localStorage.getItem("solar_erp_token") || "";
    const payload = {
      gridTariffPkr: parseFloat(financialSettings.gridTariffPkr) || 55.0,
      tariffEscalationPct: parseFloat(financialSettings.tariffEscalationPct) || 8.0,
      monthlyBillPkr: financialSettings.monthlyBillPkr ? parseFloat(financialSettings.monthlyBillPkr) : null,
      monthlyUnitsKwh: financialSettings.monthlyUnitsKwh ? parseFloat(financialSettings.monthlyUnitsKwh) : null,
      degradationPct: parseFloat(financialSettings.degradationPct) || 0.5,
      discountRatePct: parseFloat(financialSettings.discountRatePct) || 12.0,
      annualOmCostPkr: financialSettings.annualOmCostPkr ? parseFloat(financialSettings.annualOmCostPkr) : null,
      investmentPkr: parseFloat(financialSettings.investmentPkr) || activeProject.contractPricePkr,
      capacityKw: parseFloat(financialSettings.capacityKw) || activeProject.systemCapacityKw,
      paybackYears: liveFinancials?.paybackYears || 0,
      paybackDisplay: liveFinancials?.paybackDisplay || "—",
      npv25yrPkr: liveFinancials?.npv25yrPkr || 0,
      firstYearSavingsPkr: liveFinancials?.firstYearSavingsPkr || 0,
      annualGenerationKwh: liveFinancials?.annualGenerationKwh || 0
    };

    try {
      const res = await fetch(`/api/projects/${activeProject.id}/financials`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: currentToken ? `Bearer ${currentToken}` : ""
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setSaveStatus("saved");
        setSaveMessage("Financial model saved and synced with project record!");
        if (onProjectUpdated) {
          onProjectUpdated(updated);
        }
        setTimeout(() => setSaveStatus(""), 4000);
      } else {
        const err = await res.json();
        setSaveStatus("error");
        setSaveMessage(err.error || "Failed to save financial parameters.");
      }
    } catch (e) {
      setSaveStatus("error");
      setSaveMessage(e.message || "Network error while saving.");
    }
  };

  // Reset inputs to contract dossier values
  const handleSyncWithContract = () => {
    if (activeProject) {
      setFinancialSettings(prev => ({
        ...prev,
        investmentPkr: activeProject.contractPricePkr || finalPricePkr || 0,
        capacityKw: activeProject.systemCapacityKw || capacityKw || 0,
        gridTariffPkr: 55.0,
        tariffEscalationPct: 8.0
      }));
    }
  };

  // Filter audit logs for this specific client & project
  const clientAuditLogs = useMemo(() => {
    if (!activeProject || !Array.isArray(auditLogs)) return [];
    return auditLogs.filter(log => {
      const details = log.details || {};
      return (
        details.projectId === activeProject.id ||
        details.projectCode === activeProject.projectCode ||
        (details.clientName && activeProject.clientName && details.clientName.toLowerCase() === activeProject.clientName.toLowerCase())
      );
    });
  }, [activeProject, auditLogs]);

  if (!activeProject) {
    return (
      <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl text-center max-w-xl mx-auto my-10 space-y-4 shadow-sm">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mx-auto border border-emerald-200">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900">No Active Project Selected</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Please select an active project from the top bar dropdown or register a new client to view and compute genuine 25-year cashflows, NPV, ROI payback, and client timeline history.
        </p>
      </div>
    );
  }

  const hasCapacityAndPrice = (parseFloat(financialSettings.capacityKw) > 0 || parseFloat(activeProject.systemCapacityKw) > 0) &&
    (parseFloat(financialSettings.investmentPkr) > 0 || parseFloat(activeProject.contractPricePkr) > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: Real Company Data Control & Contract Sync */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Company Financial & Utility Model
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                CONTRACT SYNCED & COMPUTED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Project: <strong>{activeProject.projectCode}</strong> ({activeProject.clientName}) • 25-Year Turnkey Commercial Cashflow & NEPRA Net Metering Yield Analysis
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveFinancials}
              disabled={saveStatus === "saving"}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Save financial parameters into this project's record"
            >
              {saveStatus === "saving" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : saveStatus === "saved" ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Model Saved!" : "Save Model to Project"}</span>
            </button>

            <button
              onClick={handleSyncWithContract}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Reset inputs to project contract values"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sync Contract Price ({formatPKR(activeProject.contractPricePkr || 0)})</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>{isSettingsOpen ? "Hide Controls" : "Adjust Parameters"}</span>
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
            saveStatus === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}>
            {saveStatus === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Interactive Parameter Controls Panel */}
        {isSettingsOpen && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Turnkey Contract Investment (PKR) <span className="text-emerald-600 font-normal">(Auto-filled from Project)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={financialSettings.investmentPkr}
                  onChange={(e) => setFinancialSettings(prev => ({ ...prev, investmentPkr: e.target.value }))}
                  placeholder="e.g. 1150000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500">Contract Selling Price from Project Dossier</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  System Capacity (kWp) <span className="text-emerald-600 font-normal">(Auto-filled from Project)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={financialSettings.capacityKw}
                  onChange={(e) => setFinancialSettings(prev => ({ ...prev, capacityKw: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500">Installed PV DC Capacity</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  DISCO Grid Tariff (PKR / kWh) <span className="text-emerald-600 font-normal">(NEPRA Standard)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={financialSettings.gridTariffPkr}
                  onChange={(e) => setFinancialSettings(prev => ({ ...prev, gridTariffPkr: e.target.value }))}
                  placeholder="e.g. 55.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-bold text-emerald-800 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500">Actual utility tariff from client DISCO bill</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tariff Escalation (% / Year)
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  step="0.5"
                  value={financialSettings.tariffEscalationPct}
                  onChange={(e) => setFinancialSettings(prev => ({ ...prev, tariffEscalationPct: e.target.value }))}
                  placeholder="8.0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500">NEPRA annual tariff indexation rate</span>
              </div>
            </div>

            {/* Optional Client Utility Bill Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Client Monthly Electricity Bill (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={financialSettings.monthlyBillPkr}
                  onChange={(e) => setFinancialSettings(prev => ({ ...prev, monthlyBillPkr: e.target.value }))}
                  placeholder="e.g. 75000 (Optional)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-slate-800 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500">From client's DISCO bill (IESCO/LESCO/KE)</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Average Monthly Units Consumed (kWh)
                </label>
                <input
                  type="number"
                  min="0"
                  value={financialSettings.monthlyUnitsKwh}
                  onChange={(e) => setFinancialSettings(prev => ({ ...prev, monthlyUnitsKwh: e.target.value }))}
                  placeholder="e.g. 1200 (Optional)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-slate-800 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500">12-month bill average consumption</span>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSaveFinancials}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Update & Store Project Financials</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {!hasCapacityAndPrice ? (
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h4 className="text-sm font-bold text-amber-900">Project Capacity & Contract Price Needed</h4>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Please enter the System Capacity (kWp) and Turnkey Contract Price for <strong>{activeProject.clientName}</strong> in the controls above or click &quot;Sync Contract Price&quot; to view 25-year financial metrics.
          </p>
        </div>
      ) : !liveFinancials ? null : (
        <>
          {/* Key Financial Metrics in PKR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Simple Payback Period */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">Payback Period</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {liveFinancials.paybackDisplay}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                At PKR {financialSettings.gridTariffPkr}/kWh grid tariff
              </p>
            </div>

            {/* First Year Savings in PKR */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">Year 1 Savings (PKR)</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {formatPKR(liveFinancials.firstYearSavingsPkr)}
              </div>
              <p className="text-[11px] text-slate-500">
                {liveFinancials.annualGenerationKwh.toLocaleString()} kWh estimated yield
              </p>
            </div>

            {/* 25-Year NPV in PKR */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">25-Year NPV (PKR)</span>
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {formatPKR(liveFinancials.npv25yrPkr)}
              </div>
              <p className="text-[11px] text-slate-500">
                {financialSettings.discountRatePct}% discount with {financialSettings.tariffEscalationPct}% escalation
              </p>
            </div>

            {/* Performance Ratio (PR) */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">Performance Ratio</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {liveFinancials.performanceRatio}% PR
              </div>
              <p className="text-[11px] text-slate-500">
                IEC 61724-1 Standard Verification
              </p>
            </div>
          </div>

          {/* ESG Impact Card */}
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl border border-emerald-300 text-emerald-800">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">ESG Carbon Offsets & Sustainability</h4>
                <p className="text-xs text-slate-600">Calculated on {financialSettings.capacityKw} kWp real system capacity</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Annual CO2 Avoided</span>
                <div className="text-base font-bold font-mono text-emerald-800">
                  {liveFinancials.esg.annualCo2Tons} Tons / Year
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">25-Year Lifetime CO2</span>
                <div className="text-base font-bold font-mono text-emerald-800">
                  {liveFinancials.esg.lifetimeCo2Tons} Metric Tons
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Equivalent Trees Planted</span>
                <div className="text-base font-bold font-mono text-emerald-800">
                  {liveFinancials.esg.treesPlanted.toLocaleString()} Trees
                </div>
              </div>
            </div>
          </div>

          {/* CLIENT WORK HISTORY & MILESTONE TIMELINE (Date & Day Tracking) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  Client Project Engagement & Milestone Timeline (Date & Day Tracking)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete audit record of engineering, surveying, and financial work performed for <strong>{activeProject.clientName}</strong> ({activeProject.projectCode})
                </p>
              </div>
              <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-medium flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                PKT (UTC+5) Synchronized
              </span>
            </div>

            {/* 4 Core Milestones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Milestone 1: Deal Onboarded */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1. Deal Onboarded</span>
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {formatDateWithDay(activeProject.dealCloseDate || activeProject.createdAt)}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Contract Value:</span>
                  <strong className="text-emerald-700 font-mono font-bold">
                    PKR {(activeProject.contractPricePkr || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={activeProject.siteAddress}>
                  <MapPin className="w-3 h-3 inline mr-1 text-slate-400" />
                  {activeProject.siteAddress || "Site specified"}
                </div>
              </div>

              {/* Milestone 2: Technical Site Survey */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2. Technical Site Survey</span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {activeProject.surveyUploadedAt ? formatDateWithDay(activeProject.surveyUploadedAt) : "Pending Technical Survey"}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>PV Hardware:</span>
                  <span className="font-semibold text-slate-800">
                    {activeProject.surveyData?.panelBrand || "Module L2/Elevated"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Capacity: <strong className="text-slate-800">{activeProject.systemCapacityKw || financialSettings.capacityKw} kWp</strong>
                </div>
              </div>

              {/* Milestone 3: Executive Proposal & Seal */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">3. Proposal Approval & Seal</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {activeProject.adminApprovedAt
                    ? formatDateWithDay(activeProject.adminApprovedAt)
                    : activeProject.quotation?.signedAt
                    ? formatDateWithDay(activeProject.quotation.signedAt)
                    : "Draft / Pending Approval"}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Executive Seal:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    activeProject.adminApprovedAt || activeProject.quotation?.isLocked
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {activeProject.adminApprovedAt || activeProject.quotation?.isLocked ? "CEO Sealed" : "Unsealed Draft"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Status: <strong className="text-slate-800">{activeProject.status || "ACTIVE"}</strong>
                </div>
              </div>

              {/* Milestone 4: Financial & 25Y Yield Model */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">4. 25Y Financial Matrix</span>
                  <Calculator className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {activeProject.financialModel?.updatedAt
                    ? formatDateWithDay(activeProject.financialModel.updatedAt)
                    : formatDateWithDay(new Date())}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>ROI Payback:</span>
                  <strong className="text-emerald-700 font-mono font-bold">
                    {liveFinancials.paybackDisplay}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  Tariff: <strong className="text-slate-800">PKR {financialSettings.gridTariffPkr}/kWh</strong> (8% Escalation)
                </div>
              </div>
            </div>

            {/* Client Activity Audit Trail Table */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Detailed Client Activity Log ({clientAuditLogs.length} events recorded)
              </h4>

              {clientAuditLogs.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No previous audit actions recorded for this specific client yet. Any new survey, proposal seal, or financial update will be timestamped here with day and date.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-700 font-mono uppercase text-[10px] sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Date & Day</th>
                        <th className="p-2.5">Time (PKT)</th>
                        <th className="p-2.5">Milestone / Action</th>
                        <th className="p-2.5">Authorized Officer</th>
                        <th className="p-2.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
                      {clientAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-2.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                            {log.dateWithDay || (log.dayOfWeek ? `${log.dayOfWeek}, ${log.date}` : log.date)}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">
                            {log.time}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium text-slate-800 whitespace-nowrap">
                            {log.userName}
                          </td>
                          <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                            {log.details ? (
                              <span>
                                {log.details.capacityKw ? `${log.details.capacityKw} kWp ` : ""}
                                {log.details.gridTariffPkr ? `• PKR ${log.details.gridTariffPkr}/kWh ` : ""}
                                {log.details.paybackDisplay ? `• Payback: ${log.details.paybackDisplay}` : ""}
                                {log.details.contractPricePkr ? `• PKR ${Number(log.details.contractPricePkr).toLocaleString()}` : ""}
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* 25-Year Cash Flow Projection Table in PKR */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-emerald-600" /> 25-Year Financial Cash Flow Matrix (PKR)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Initial Turnkey Investment: <strong>{formatPKR(financialSettings.investmentPkr)}</strong> • Solar Capacity: <strong>{financialSettings.capacityKw} kWp</strong>
                </p>
              </div>
              <span className="text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                {financialSettings.tariffEscalationPct}% Annual Tariff Escalation • {financialSettings.degradationPct}% Module Degradation
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 font-mono uppercase text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Year</th>
                    <th className="p-3">Solar Generation (kWh)</th>
                    <th className="p-3">Grid Savings (PKR)</th>
                    <th className="p-3">Net Cash Flow (PKR)</th>
                    <th className="p-3 text-right">Cumulative Position (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {liveFinancials.chartData.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50/80 transition font-mono text-[11px]">
                      <td className="p-3 font-bold text-slate-900">
                        {row.year === 0 ? "Year 0 (CAPEX)" : `Year ${row.year}`}
                      </td>
                      <td className="p-3 text-slate-700">
                        {row.year === 0 ? "—" : `${row.generation.toLocaleString()} kWh`}
                      </td>
                      <td className="p-3 text-emerald-700 font-bold">
                        {row.year === 0 ? "PKR 0" : formatPKR(row.savings)}
                      </td>
                      <td className="p-3 text-slate-900 font-bold">{formatPKR(row.cashFlow)}</td>
                      <td className={`p-3 text-right font-bold ${row.cumulative >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {formatPKR(row.cumulative)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
