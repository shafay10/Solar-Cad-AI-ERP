import React, { useState, useEffect } from "react";
import {
  X, Building2, MapPin, Zap, Calendar, FileText,
  Navigation, TrendingUp, TrendingDown, Save, CheckCircle2, AlertCircle, Map
} from "lucide-react";
import { safeIsoString } from "../utils/dateUtils.js";
import InteractiveSatellitePinPicker from "./InteractiveSatellitePinPicker.jsx";

export default function ModalEditProject({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
  token
}) {
  const [showSatellitePicker, setShowSatellitePicker] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientCnic: "",
    siteAddress: "",
    subDivision: "",
    latitude: "",
    longitude: "",
    systemCapacityKw: "",
    contractPricePkr: "",
    estimatedCostPkr: "",
    dealCloseDate: "",
    targetDeliveryDate: "",
    projectDetails: "",
    status: "ONBOARDED"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (project) {
      setFormData({
        clientName: project.clientName || "",
        clientCnic: project.clientCnic || "",
        siteAddress: project.siteAddress || "",
        subDivision: project.subDivision || "",
        latitude: project.latitude !== null && project.latitude !== undefined ? String(project.latitude) : "",
        longitude: project.longitude !== null && project.longitude !== undefined ? String(project.longitude) : "",
        systemCapacityKw: project.systemCapacityKw !== null && project.systemCapacityKw !== undefined ? String(project.systemCapacityKw) : "",
        contractPricePkr: project.contractPricePkr !== null && project.contractPricePkr !== undefined ? String(project.contractPricePkr) : "",
        estimatedCostPkr: project.estimatedCostPkr !== null && project.estimatedCostPkr !== undefined ? String(project.estimatedCostPkr) : "",
        dealCloseDate: safeIsoString(project.dealCloseDate, 16),
        targetDeliveryDate: safeIsoString(project.targetDeliveryDate, 10),
        projectDetails: project.projectDetails || "",
        status: project.status || "ONBOARDED"
      });
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  // Real-time financial calculations
  const contractPrice = parseFloat(formData.contractPricePkr) || 0;
  const estimatedCost = parseFloat(formData.estimatedCostPkr) || 0;
  const netProfitPkr = contractPrice - estimatedCost;
  const profitMarginPct = contractPrice > 0 ? ((netProfitPkr / contractPrice) * 100).toFixed(1) : "0.0";
  const isProfitPositive = netProfitPkr >= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.clientName.trim() || !formData.siteAddress.trim()) {
      setErrorMsg("Please enter customer name and site physical address.");
      return;
    }

    if (!formData.systemCapacityKw || parseFloat(formData.systemCapacityKw) <= 0) {
      setErrorMsg("Please enter a valid System Capacity in kWp (e.g. 20.5 kWp).");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      clientName: formData.clientName.trim(),
      clientCnic: formData.clientCnic?.trim() || null,
      siteAddress: formData.siteAddress.trim(),
      subDivision: formData.subDivision?.trim() || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      systemCapacityKw: parseFloat(formData.systemCapacityKw) || 0,
      contractPricePkr: contractPrice,
      estimatedCostPkr: estimatedCost,
      netProfitPkr: netProfitPkr,
      dealCloseDate: safeIsoString(formData.dealCloseDate) || new Date().toISOString(),
      targetDeliveryDate: safeIsoString(formData.targetDeliveryDate) || null,
      projectDetails: formData.projectDetails?.trim() || null,
      status: formData.status
    };

    try {
      const currentToken = token || localStorage.getItem("solar_erp_token") || "";
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: currentToken ? `Bearer ${currentToken}` : ""
        },
        body: JSON.stringify(payload)
      });

      const refreshedToken = res.headers.get("X-Refreshed-Token");
      if (refreshedToken) {
        localStorage.setItem("solar_erp_token", refreshedToken);
      }

      if (res.ok) {
        const updated = await res.json();
        setSuccessMsg("Project details updated successfully!");
        if (onProjectUpdated) onProjectUpdated(updated);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to update project.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Network communication error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Edit Project: <span className="text-emerald-700 font-mono">{project.projectCode}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Update commercial milestones, technical parameters, and execution details
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Client Identification */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                1. Client Identification
              </span>
              <span className="text-[10px] text-slate-500">Corporate & Tax Identity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Client / Corporate Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g. Nishat Mills Industrial Complex"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Client CNIC / NTN
                </label>
                <input
                  type="text"
                  value={formData.clientCnic}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientCnic: e.target.value }))}
                  placeholder="e.g. 35201-1234567-1 or NTN: 7654321-0"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Site Location & Utility Subdivision */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                2. Site Location & Utility Subdivision
              </span>
              <span className="text-[10px] text-slate-500">DISCO & Geographic Coordinates</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 font-bold block mb-1">
                Site Physical Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows="2"
                value={formData.siteAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, siteAddress: e.target.value }))}
                placeholder="e.g. Plot 45, Sector I-9/2, Industrial Triangle, Islamabad, Pakistan"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-700 font-bold block mb-1">
                Sub-Division / Utility Area
              </label>
              <input
                type="text"
                value={formData.subDivision}
                onChange={(e) => setFormData(prev => ({ ...prev, subDivision: e.target.value }))}
                placeholder="e.g. IESCO Rawal Sub-Division, LESCO, K-Electric, G-11 Sub-division"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 31.5204"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 74.3587"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setFormData(prev => ({
                          ...prev,
                          latitude: pos.coords.latitude.toFixed(6),
                          longitude: pos.coords.longitude.toFixed(6)
                        }));
                      },
                      (err) => alert("Could not fetch GPS location: " + err.message),
                      { enableHighAccuracy: true }
                    );
                  } else {
                    alert("Geolocation is not supported by your browser.");
                  }
                }}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" /> Detect Current Device GPS Location
              </button>

              <button
                type="button"
                onClick={() => setShowSatellitePicker(prev => !prev)}
                className={`w-full py-2 px-3 border font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                  showSatellitePicker
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300"
                }`}
              >
                <Map className="w-3.5 h-3.5 text-emerald-600" />
                <span>{showSatellitePicker ? "✕ Close Satellite Map" : "🗺 Pick Location on Satellite Map"}</span>
              </button>
            </div>

            {/* Interactive Draggable Satellite Pin Picker */}
            <InteractiveSatellitePinPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              addressQuery={formData.siteAddress}
              isOpen={showSatellitePicker}
              showTriggerButton={false}
              onChange={({ latitude, longitude }) => {
                setFormData(prev => ({ ...prev, latitude, longitude }));
              }}
            />
          </div>

          {/* 3. System Capacity & Financials (PKR) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                3. System Capacity & Financials (PKR)
              </span>
              <span className="text-[10px] text-slate-500">Commercial EPC Quotation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Capacity (kWp) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.systemCapacityKw}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemCapacityKw: e.target.value }))}
                  placeholder="e.g. 20.5"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Contract / Deal Price (PKR) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.contractPricePkr}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractPricePkr: e.target.value }))}
                  placeholder="e.g. 3500000"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Internal Estimated Cost (PKR)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.estimatedCostPkr}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedCostPkr: e.target.value }))}
                  placeholder="e.g. 2700000"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Real-Time Net Profit / Bachat Display Card */}
            <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
              isProfitPositive 
                ? "bg-emerald-50 border-emerald-200" 
                : "bg-rose-50 border-rose-200"
            }`}>
              <div>
                <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider">
                  Net Profit / Bachat (PKR) — Auto Calculated
                </span>
                <span className={`text-base font-bold font-mono ${
                  isProfitPositive ? "text-emerald-700" : "text-rose-700"
                }`}>
                  PKR {netProfitPkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                  isProfitPositive
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-rose-100 text-rose-800 border-rose-300"
                }`}>
                  {isProfitPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-700" />
                  )}
                  {profitMarginPct}% Profit Margin
                </span>
              </div>
            </div>
          </div>

          {/* 4. Timeline, Status & Deadlines */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                4. Timeline & Project Lifecycle Status
              </span>
              <span className="text-[10px] text-slate-500">Milestones & Workflow Stage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="ONBOARDED">ONBOARDED</option>
                  <option value="SURVEY_COMPLETED">SURVEY_COMPLETED</option>
                  <option value="PROPOSAL_GENERATED">PROPOSAL_GENERATED</option>
                  <option value="APPROVED_LOCKED">APPROVED_LOCKED</option>
                  <option value="INSTALLATION_COMPLETE">INSTALLATION_COMPLETE</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Deal Close Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.dealCloseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealCloseDate: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Target Delivery / COD Date
                </label>
                <input
                  type="date"
                  value={formData.targetDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDeliveryDate: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* 5. Project Notes & Scope Details */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                5. Project Notes & Scope Details
              </span>
              <span className="text-[10px] text-slate-500">Roof, Net Metering & Scope</span>
            </div>

            <div>
              <textarea
                rows="3"
                value={formData.projectDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, projectDetails: e.target.value }))}
                placeholder="Enter roof structure type, net metering scope, payment milestone terms, special instructions..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving Changes..." : "Save Project Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
