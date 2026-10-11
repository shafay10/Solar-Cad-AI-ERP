import React, { useState, useMemo, useCallback } from "react";
import {
  FolderKanban, Plus, Search, ArrowUpDown, Calendar, Clock,
  CheckCircle2, AlertCircle, MapPin, Zap, DollarSign, TrendingUp,
  FileText, BarChart3, Pencil, Trash2, Download, RefreshCw,
  Copy, Check, Layers, ChevronRight, Activity, Building2, Shield,
  SunMedium, ArrowRight, Eye
} from "lucide-react";
import { safeFormatDate, safeFormatDateTime } from "../utils/dateUtils.js";
import { generateProposalPDF } from "../utils/pdfGenerator.js";
import { useLanguage } from "../context/LanguageContext.jsx";

/**
 * Normalizes project workflow stage into 4 clean lifecycle milestones:
 * 1. Surveyed (Site Survey & Polygon Coords)
 * 2. CAD Designed (HelioScope Layout & Engineering Inverter Sizing)
 * 3. In Installation (EPC Procurement, Structural Erection, Cabling)
 * 4. Commissioned / Closed (WAPDA Bi-Directional Net-Metering Active)
 */
export const getNormalizedStatus = (project) => {
  if (!project) return "Surveyed";
  if (
    project.siteCompletedAt ||
    project.status === "COMPLETED" ||
    project.status === "Commissioned / Closed" ||
    project.status === "INSTALLATION_COMPLETE"
  ) {
    return "Commissioned / Closed";
  }
  if (
    project.quotation?.isLocked ||
    project.adminApprovedAt ||
    project.status === "APPROVED_LOCKED" ||
    project.status === "In Installation"
  ) {
    return "In Installation";
  }
  if (
    project.surveyData?.panelQuantity > 0 ||
    project.status === "PROPOSAL_GENERATED" ||
    project.status === "CAD Designed"
  ) {
    return "CAD Designed";
  }
  return "Surveyed";
};

export default function ProjectsDirectoryView({
  projectsList = [],
  activeProject = null,
  onSelectProject,
  setActiveTab,
  onOpenNewProjectModal,
  onOpenEditProjectModal,
  onDeleteProject,
  companyProfile,
  currentUser,
  token,
  onRefreshProjects
}) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'targetCOD' | 'capacity' | 'contractPrice' | 'clientName'
  const [copiedCode, setCopiedCode] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  // Copy Project Code with feedback
  const handleCopyCode = (code, e) => {
    e?.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export proposal PDF directly for a specific project
  const handleDirectExportPDF = async (project, e) => {
    e?.stopPropagation();
    if (!project) return;
    setExportingId(project.id);
    try {
      const surveyData = project.surveyData || {};
      const contractPrice = parseFloat(project.contractPricePkr) || 0;
      const capacityKw = parseFloat(project.systemCapacityKw) || 0;
      const panelWattage = surveyData.panelWattage || 585;
      const panelQty = surveyData.panelQuantity || Math.round((capacityKw * 1000) / panelWattage) || 0;

      generateProposalPDF({
        project: {
          projectCode: project.projectCode || "SLR-PK-PROPOSAL",
          clientName: project.clientName || "Solar Client",
          clientCnic: project.clientCnic || "",
          siteAddress: project.siteAddress || "Site Location, Pakistan",
          subDivision: project.subDivision || "",
          latitude: project.latitude || "",
          longitude: project.longitude || ""
        },
        survey: {
          gpsCoords: {
            lat: project.latitude || "",
            lng: project.longitude || "",
            address: project.siteAddress || ""
          },
          polygonAreaSqft: surveyData.manualAreaSqFt || 0,
          pitch: surveyData.tiltAngle || 18,
          azimuth: surveyData.customAzimuthDegrees || 180,
          ...surveyData
        },
        cad: {
          moduleWattage: panelWattage,
          panelsPerString: Math.min(panelQty, 18),
          winterVoc: "780.0",
          summerVmp: "650.0"
        },
        boq: {
          pricing: {
            clientSellingPkr: contractPrice,
            equipmentCostPkr: parseFloat(project.estimatedCostPkr) || contractPrice * 0.85
          },
          summary: {
            totalDcCapacityKw: capacityKw
          }
        },
        financial: null,
        isLocked: !!project.quotation?.isLocked,
        currentUser: currentUser || { fullName: "Lead Solar Engineer" },
        companyProfile
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to export proposal: " + err.message);
    } finally {
      setExportingId(null);
    }
  };

  // Portfolio-wide KPIs
  const metrics = useMemo(() => {
    const totalProjects = projectsList.length;
    let totalCapacityKw = 0;
    let totalContractValuePkr = 0;
    let commissionedCount = 0;
    let inInstallationCount = 0;
    let cadCount = 0;
    let surveyedCount = 0;

    projectsList.forEach(p => {
      const cap = parseFloat(p.systemCapacityKw) || 0;
      const val = parseFloat(p.contractPricePkr) || 0;
      totalCapacityKw += cap;
      totalContractValuePkr += val;

      const stage = getNormalizedStatus(p);
      if (stage === "Commissioned / Closed") commissionedCount++;
      else if (stage === "In Installation") inInstallationCount++;
      else if (stage === "CAD Designed") cadCount++;
      else surveyedCount++;
    });

    const avgDealSizePkr = totalProjects > 0 ? Math.round(totalContractValuePkr / totalProjects) : 0;
    const avgCapacityKw = totalProjects > 0 ? (totalCapacityKw / totalProjects).toFixed(1) : 0;
    const completionRatePct = totalProjects > 0 ? Math.round((commissionedCount / totalProjects) * 100) : 0;

    return {
      totalProjects,
      totalCapacityKw,
      totalContractValuePkr,
      commissionedCount,
      inInstallationCount,
      cadCount,
      surveyedCount,
      avgDealSizePkr,
      avgCapacityKw,
      completionRatePct
    };
  }, [projectsList]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let list = [...projectsList];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        const code = (p.projectCode || "").toLowerCase();
        const client = (p.clientName || "").toLowerCase();
        const address = (p.siteAddress || "").toLowerCase();
        const sub = (p.subDivision || "").toLowerCase();
        const cnic = (p.clientCnic || "").toLowerCase();
        return code.includes(q) || client.includes(q) || address.includes(q) || sub.includes(q) || cnic.includes(q);
      });
    }

    // Status filter
    if (selectedStatusFilter !== "ALL") {
      list = list.filter(p => getNormalizedStatus(p) === selectedStatusFilter);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "targetCOD") {
        const dateA = a.targetDeliveryDate ? new Date(a.targetDeliveryDate).getTime() : Infinity;
        const dateB = b.targetDeliveryDate ? new Date(b.targetDeliveryDate).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === "capacity") {
        return (parseFloat(b.systemCapacityKw) || 0) - (parseFloat(a.systemCapacityKw) || 0);
      }
      if (sortBy === "contractPrice") {
        return (parseFloat(b.contractPricePkr) || 0) - (parseFloat(a.contractPricePkr) || 0);
      }
      if (sortBy === "clientName") {
        return (a.clientName || "").localeCompare(b.clientName || "");
      }
      return 0;
    });

    return list;
  }, [projectsList, searchQuery, selectedStatusFilter, sortBy]);

  // Export full portfolio data to CSV spreadsheet
  const handleExportCSV = () => {
    if (projectsList.length === 0) {
      alert("No projects available to export.");
      return;
    }

    const headers = [
      "Project Code",
      "Client Name",
      "Client CNIC / NTN",
      "Physical Site Address",
      "Sub-Division / Utility",
      "Capacity (kWp)",
      "Contract Price (PKR)",
      "Estimated Cost (PKR)",
      "Net Profit (PKR)",
      "Created Date",
      "Start Date / Deal Close",
      "Target Delivery / COD",
      "Actual Commissioning (COD)",
      "Lifecycle Status"
    ];

    const rows = projectsList.map(p => [
      `"${p.projectCode || ''}"`,
      `"${(p.clientName || '').replace(/"/g, '""')}"`,
      `"${p.clientCnic || ''}"`,
      `"${(p.siteAddress || '').replace(/"/g, '""')}"`,
      `"${(p.subDivision || '').replace(/"/g, '""')}"`,
      p.systemCapacityKw || 0,
      p.contractPricePkr || 0,
      p.estimatedCostPkr || 0,
      p.netProfitPkr || 0,
      `"${safeFormatDateTime(p.createdAt, '')}"`,
      `"${safeFormatDate(p.dealCloseDate, '')}"`,
      `"${safeFormatDate(p.targetDeliveryDate, '')}"`,
      `"${safeFormatDate(p.siteCompletedAt, 'In Progress')}"`,
      `"${getNormalizedStatus(p)}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Solar_Projects_Pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP EXECUTIVE HEADER & METRICS BANNER */}
      <div className="card-saas p-5 sm:p-6 bg-white border border-slate-200/80 shadow-xs rounded-2xl relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Projects Pipeline & Portfolio CRM
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live Master Record
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centralized solar project lifecycle tracking, milestone timeline audits, and commercial engineering oversight.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onRefreshProjects && (
              <button
                type="button"
                onClick={onRefreshProjects}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Refresh project list from database"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download portfolio spreadsheet (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewProjectModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Project Onboarding</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-5 relative z-10">
          {/* Card 1: Total Portfolio Projects */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Portfolio Sites
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {metrics.totalProjects}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Sites
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{metrics.commissionedCount} Net-Metered COD</span>
            </div>
          </div>

          {/* Card 2: Total Installed Capacity */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Pipeline Capacity
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {metrics.totalCapacityKw >= 1000
                  ? (metrics.totalCapacityKw / 1000).toFixed(2)
                  : metrics.totalCapacityKw.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {metrics.totalCapacityKw >= 1000 ? "MWp" : "kWp"}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-slate-600 font-medium">
              Avg: {metrics.avgCapacityKw} kWp / site
            </div>
          </div>

          {/* Card 3: Total Commercial Value (PKR) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Commercial Contract Value
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-600">PKR</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono truncate">
                {metrics.totalContractValuePkr >= 10000000
                  ? `${(metrics.totalContractValuePkr / 10000000).toFixed(2)} Cr`
                  : metrics.totalContractValuePkr >= 100000
                  ? `${(metrics.totalContractValuePkr / 100000).toFixed(1)} Lakh`
                  : metrics.totalContractValuePkr.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-slate-600 font-medium">
              Avg Deal: PKR {metrics.avgDealSizePkr.toLocaleString()}
            </div>
          </div>

          {/* Card 4: Commissioned / COD Complete */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Commissioned (COD)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono">
                {metrics.commissionedCount}
              </span>
              <span className="text-[11px] font-bold text-emerald-700">
                ({metrics.completionRatePct}%)
              </span>
            </div>
            <div className="mt-1 text-[10px] text-emerald-700 font-medium">
              WAPDA Net-Metering Active
            </div>
          </div>

          {/* Card 5: In Active Engineering / Installation */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
              Active In Progress
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
                {metrics.inInstallationCount + metrics.cadCount + metrics.surveyedCount}
              </span>
              <span className="text-[11px] font-bold text-amber-700">
                Sites
              </span>
            </div>
            <div className="mt-1 text-[10px] text-amber-800 font-medium truncate">
              {metrics.inInstallationCount} Install • {metrics.cadCount} CAD • {metrics.surveyedCount} Survey
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH, STAGE FILTER TABS & SORT TOOLBAR */}
      <div className="card-saas p-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Project ID (SLR-PK-...), Client Name, City/Sub-Division, Physical Address, CNIC..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
            >
              <option value="newest">Newest Survey / Created</option>
              <option value="targetCOD">Target COD (Earliest Handover)</option>
              <option value="capacity">System Capacity (High to Low)</option>
              <option value="contractPrice">Contract Value (High to Low)</option>
              <option value="clientName">Client Name (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-2.5 text-xs font-bold">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
            Lifecycle:
          </span>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatusFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <span>All Projects</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedStatusFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {metrics.totalProjects}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter("Surveyed")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatusFilter === "Surveyed"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/80"
            }`}
          >
            <span>1. Surveyed</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedStatusFilter === "Surveyed" ? "bg-white/20 text-white" : "bg-sky-200/70 text-sky-900"
            }`}>
              {metrics.surveyedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter("CAD Designed")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatusFilter === "CAD Designed"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/80"
            }`}
          >
            <span>2. CAD Designed</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedStatusFilter === "CAD Designed" ? "bg-white/20 text-white" : "bg-purple-200/70 text-purple-900"
            }`}>
              {metrics.cadCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter("In Installation")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatusFilter === "In Installation"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80"
            }`}
          >
            <span>3. In Installation</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedStatusFilter === "In Installation" ? "bg-white/20 text-white" : "bg-amber-200/70 text-amber-900"
            }`}>
              {metrics.inInstallationCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter("Commissioned / Closed")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatusFilter === "Commissioned / Closed"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80"
            }`}
          >
            <span>4. Commissioned (COD)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedStatusFilter === "Commissioned / Closed" ? "bg-white/20 text-white" : "bg-emerald-200/70 text-emerald-900"
            }`}>
              {metrics.commissionedCount}
            </span>
          </button>
        </div>
      </div>

      {/* 3. MASTER PROJECTS DIRECTORY TABLE VIEW */}
      <div className="card-saas bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        {filteredProjects.length === 0 ? (
          /* Empty State Display */
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <FolderKanban className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800">
                {projectsList.length === 0 ? "No Solar Projects Onboarded Yet" : "No Projects Match Your Filter"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {projectsList.length === 0
                  ? "Get started by onboarding your client's commercial or residential solar EPC project to begin CAD layout, BOQ calculation, and timeline monitoring."
                  : `No projects found matching "${searchQuery}" under ${selectedStatusFilter === "ALL" ? "any status" : selectedStatusFilter}. Try changing your search query or reset the filter.`}
              </p>
            </div>
            {projectsList.length === 0 ? (
              <button
                type="button"
                onClick={onOpenNewProjectModal}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Onboard First Solar Project</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatusFilter("ALL");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Reset Search & Filters
              </button>
            )}
          </div>
        ) : (
          /* Master Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Project ID & Client</th>
                  <th className="py-3.5 px-4">Site Location & Utility</th>
                  <th className="py-3.5 px-4">Capacity & Value</th>
                  <th className="py-3.5 px-4">Timeline & Milestones (COD)</th>
                  <th className="py-3.5 px-4">Lifecycle Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.map((p) => {
                  const isActiveWorkspace = activeProject?.id === p.id;
                  const stage = getNormalizedStatus(p);
                  const contractPrice = parseFloat(p.contractPricePkr) || 0;
                  const estimatedCost = parseFloat(p.estimatedCostPkr) || 0;
                  const netProfit = p.netProfitPkr !== undefined ? parseFloat(p.netProfitPkr) : (contractPrice - estimatedCost);
                  const profitMarginPct = contractPrice > 0 ? ((netProfit / contractPrice) * 100).toFixed(1) : null;

                  // Target COD calculation and overdue check
                  const isCommissioned = stage === "Commissioned / Closed" || Boolean(p.siteCompletedAt);
                  const targetDate = p.targetDeliveryDate ? new Date(p.targetDeliveryDate) : null;
                  const isOverdue = !isCommissioned && targetDate && targetDate.getTime() < Date.now();

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProject(p)}
                      className={`group transition cursor-pointer hover:bg-slate-50/90 ${
                        isActiveWorkspace ? "bg-emerald-50/40 border-l-4 border-l-emerald-600" : ""
                      }`}
                    >
                      {/* Column 1: Project ID & Client */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition">
                              {p.projectCode || "SLR-PK-DRAFT"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(p.projectCode, e)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                              title="Copy Project ID"
                            >
                              {copiedCode === p.projectCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {isActiveWorkspace && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-600 text-white tracking-wider uppercase">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-slate-900 text-xs">
                            {p.clientName}
                          </div>

                          {p.clientCnic && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              CNIC: {p.clientCnic}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Site Location & DISCO */}
                      <td className="py-3.5 px-4 align-top max-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-start gap-1.5 text-slate-700 text-xs leading-snug line-clamp-2" title={p.siteAddress}>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{p.siteAddress || "Site Location Pending"}</span>
                          </div>

                          {p.subDivision && (
                            <div className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                              ⚡ {p.subDivision}
                            </div>
                          )}

                          {p.latitude && p.longitude && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              GPS: {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Capacity & Commercial Value */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-bold border border-amber-200 text-xs">
                            <SunMedium className="w-3.5 h-3.5 text-amber-600" />
                            <span>{parseFloat(p.systemCapacityKw || 0).toFixed(1)} kWp</span>
                          </div>

                          <div className="font-mono font-bold text-slate-900 text-xs">
                            PKR {contractPrice.toLocaleString()}
                          </div>

                          {profitMarginPct !== null && estimatedCost > 0 && (
                            <div className="text-[10px] text-emerald-700 font-semibold">
                              Margin: {profitMarginPct}% (PKR {Math.round(netProfit).toLocaleString()})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Timeline & Dates Tracker */}
                      <td className="py-3.5 px-4 align-top min-w-[210px]">
                        <div className="space-y-1.5 text-[11px]">
                          {/* Kick-off / Start Date */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-medium">Start / Kick-Off:</span>
                            <span className="font-semibold text-slate-700 font-mono">
                              {safeFormatDate(p.dealCloseDate, "Not Set")}
                            </span>
                          </div>

                          {/* Target Handover / Estimated COD */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-medium">Target COD:</span>
                            <span className={`font-semibold font-mono ${
                              isOverdue ? "text-rose-600 font-bold" : "text-slate-700"
                            }`}>
                              {safeFormatDate(p.targetDeliveryDate, "Pending")}
                              {isOverdue && (
                                <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-bold uppercase">
                                  Overdue
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Actual Commissioning Date */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-medium">Actual COD:</span>
                            <span className={`font-mono font-bold ${
                              isCommissioned ? "text-emerald-700" : "text-slate-500"
                            }`}>
                              {isCommissioned ? (
                                `✅ ${safeFormatDate(p.siteCompletedAt, "Active")}`
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3 h-3 text-slate-400" /> In Progress
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Lifecycle Stage Status */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-2">
                          {/* Stage Pill */}
                          <div>
                            {stage === "Commissioned / Closed" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                WAPDA Active
                              </span>
                            )}
                            {stage === "In Installation" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                <Zap className="w-3.5 h-3.5 text-amber-600" />
                                In Installation
                              </span>
                            )}
                            {stage === "CAD Designed" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
                                <Layers className="w-3.5 h-3.5 text-purple-600" />
                                CAD Approved
                              </span>
                            )}
                            {stage === "Surveyed" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs">
                                <Activity className="w-3.5 h-3.5 text-sky-600" />
                                Surveyed
                              </span>
                            )}
                          </div>

                          {/* 4-Step Mini Timeline Indicator */}
                          <div className="flex items-center gap-1 w-24">
                            <div className="h-1 flex-1 rounded-full bg-emerald-500" title="1. Survey Complete" />
                            <div className={`h-1 flex-1 rounded-full ${
                              stage === "CAD Designed" || stage === "In Installation" || stage === "Commissioned / Closed"
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                            }`} title="2. CAD Designed" />
                            <div className={`h-1 flex-1 rounded-full ${
                              stage === "In Installation" || stage === "Commissioned / Closed"
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                            }`} title="3. In Installation" />
                            <div className={`h-1 flex-1 rounded-full ${
                              stage === "Commissioned / Closed"
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                            }`} title="4. Commissioned (COD)" />
                          </div>
                        </div>
                      </td>

                      {/* Column 6: Actions Button Group */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* 1. Open Survey / CAD */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(p);
                              setActiveTab("cad");
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                            title="Open HelioScope CAD & GIS Rooftop Layout"
                          >
                            <SunMedium className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden xl:inline text-[11px]">CAD</span>
                          </button>

                          {/* 2. View Financial Cashflow */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(p);
                              setActiveTab("financial");
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                            title="View 25-Year Financial Cashflow Matrix"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden xl:inline text-[11px]">25Y Yield</span>
                          </button>

                          {/* 3. Export Proposal PDF */}
                          <button
                            type="button"
                            disabled={exportingId === p.id}
                            onClick={(e) => handleDirectExportPDF(p, e)}
                            className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                            title="Export Turnkey Proposal & BOQ PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden xl:inline text-[11px]">PDF</span>
                          </button>

                          {/* 4. Edit Project */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(p);
                              onOpenEditProjectModal(p);
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition shadow-2xs cursor-pointer"
                            title="Edit Project Details & Timeline Dates"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {/* 5. Delete Project */}
                          <button
                            type="button"
                            onClick={() => onDeleteProject && onDeleteProject(p.id)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 rounded-lg transition shadow-2xs cursor-pointer"
                            title="Delete Project Record"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
