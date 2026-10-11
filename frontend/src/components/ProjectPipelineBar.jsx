import React, { useState } from "react";
import {
  Briefcase, CheckCircle2, ChevronRight, Plus, MapPin,
  Building2, Zap, ArrowRight, Layers, Sliders
} from "lucide-react";

export const STAGES = [
  { id: "FIELD_SURVEY", label: "1. Field Survey" },
  { id: "CAD_DESIGN", label: "2. CAD Stringing" },
  { id: "BOQ_GENERATED", label: "3. BOQ Engine" },
  { id: "FINANCIAL_PROPOSAL", label: "4. Financial ROI" },
  { id: "SUPER_ADMIN_LOCK", label: "5. Super Admin Lock" },
  { id: "EPC_COMMISSIONING", label: "6. Turnkey EPC" }
];

export default function ProjectPipelineBar({
  projects,
  selectedProject,
  onSelectProject,
  onStageChange,
  onCreateProject
}) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCapacity, setNewCapacity] = useState(500);

  const currentStageIndex = STAGES.findIndex(s => s.id === (selectedProject?.current_stage || "FIELD_SURVEY"));

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newClient) return;
    if (onCreateProject) {
      onCreateProject({
        project_code: newCode || `SLR-CI-2026-${Math.floor(100 + Math.random() * 900)}`,
        client_name: newClient,
        site_address: newAddress || "Industrial Site #3",
        target_capacity_kw: Number(newCapacity) || 500,
        latitude: 31.5204,
        longitude: 74.3587
      });
    }
    setShowNewModal(false);
    setNewClient("");
    setNewAddress("");
  };

  return (
    <div className="space-y-3">
      {/* Top Project Selector & Info Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedProject?.id || ""}
                onChange={(e) => {
                  const proj = projects.find(p => p.id === e.target.value);
                  if (proj) onSelectProject(proj);
                }}
                className="bg-slate-50 border border-slate-300 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.client_name} ({p.target_capacity_kw >= 1000 ? `${(p.target_capacity_kw / 1000).toFixed(2)} MW` : `${p.target_capacity_kw} kW`}) — {p.project_code}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200 transition"
              >
                <Plus className="w-3.5 h-3.5" /> New Site
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedProject?.site_address || "Plot 42-B, Industrial Zone"}</span>
            </p>
          </div>
        </div>

        {/* Stage Progression Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {STAGES.map((stage, idx) => {
            const isPassed = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <button
                key={stage.id}
                onClick={() => onStageChange(stage.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 border ${
                  isCurrent
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : isPassed
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {isPassed && !isCurrent && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                {stage.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" /> Create New Industrial Solar Project
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Enterprise Client / Company Name</label>
                <input
                  type="text"
                  required
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="e.g. Descon Chemical Complex"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Site Location / Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Sheikhupura Industrial Cluster"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Target Capacity (kWp)</label>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Initialize Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
