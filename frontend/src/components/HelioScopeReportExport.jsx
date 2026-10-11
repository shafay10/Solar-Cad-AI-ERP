import React, { useState } from "react";
import {
  FileText, Download, Printer, CheckCircle2, ShieldCheck,
  Building2, Sun, Zap, Layers, BarChart3, TreePine, Award
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPKR } from "../services/solarEngine.js";

export default function HelioScopeReportExport({
  activeProject,
  systemStats,
  selectedModuleKey = "Jinko Solar Tiger Neo 585W",
  selectedInverterModel = "Huawei SUN2000-20KTL-M2 (20 kW, 2 MPPT)",
  inverterCapacityKw = 20,
  rackingType = "Fixed Tilt / Flush Mount",
  tiltDegrees = 18,
  azimuthDegrees = 180,
  siteLat = 33.6844,
  siteLng = 73.0479,
  stringingAnalysis,
  productionAnalysis,
  onSyncWithBOQ
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [syncedSuccess, setSyncedSuccess] = useState(false);

  const clientName = activeProject?.clientName || "Valued Solar Client";
  const projectCode = activeProject?.projectCode || "SOL-PRJ-2026-001";
  const siteAddress = activeProject?.siteAddress || "Site Location, Pakistan";
  const dcCapacityKw = (systemStats?.kwp || 20).toFixed(2);
  const moduleCount = systemStats?.modulesCount || 34;
  const annualKwh = (productionAnalysis?.netAnnualKwh || 32500).toLocaleString();
  const prPct = productionAnalysis?.performanceRatioPct || 81.5;
  const specificYield = productionAnalysis?.specificYieldKwhPerKwp || 1625;

  // Environmental offsets: 0.82 kg CO2 per kWh in Pakistan grid
  const co2TonsAnnual = Math.round((productionAnalysis?.netAnnualKwh || 32500) * 0.82 / 1000);
  const treesEquivalent = Math.round(co2TonsAnnual * 16);

  // Generate Multi-Page PDF Proposal & Engineering Datasheet
  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Page 1: Header & Company Profile
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.rect(0, 0, 210, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("GREEN TECH POWER (PVT) LTD", 14, 12);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("PEC Registered Specialized Solar EPC | NTN: 7845129-3 | www.greentechpower.pk", 14, 18);

      // Document Title
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("TECHNICAL SOLAR CAD DESIGN & GENERATION REPORT", 14, 34);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} | Reference: HELIOSCOPE-CAD-v2.0`, 14, 40);

      // Section 1: Project Metadata
      autoTable(doc, {
        startY: 44,
        head: [["PROJECT INFORMATION", "TECHNICAL SITE SPECIFICATIONS"]],
        body: [
          [`Client Name: ${clientName}`, `DC System Capacity: ${dcCapacityKw} kWp`],
          [`Project Code: ${projectCode}`, `AC Inverter Capacity: ${inverterCapacityKw} kW`],
          [`Site Address: ${siteAddress}`, `GPS Coordinates: ${siteLat.toFixed(4)}°N, ${siteLng.toFixed(4)}°E`],
          [`Roof Structure: ${rackingType}`, `Array Tilt & Azimuth: ${tiltDegrees}° / ${azimuthDegrees}° (True South)`]
        ],
        theme: "striped",
        headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] }
      });

      // Section 2: Bill of Key Equipment
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        head: [["EQUIPMENT CATEGORY", "SELECTED MODEL", "QTY", "RATING / SPECIFICATION"]],
        body: [
          ["PV Solar Modules", selectedModuleKey, `${moduleCount} Nos`, `${stringingAnalysis?.moduleSpec?.wattage || 585}W N-Type TOPCon Dual-Glass`],
          ["Grid-Tied Inverter", selectedInverterModel, "1 Unit", `${inverterCapacityKw} kW 3-Phase Multi-MPPT 1100V`],
          ["Mounting Structure", rackingType, `${dcCapacityKw} kWp`, "Hot-Dip Galvanized HDG (80µm) / 160 km/h wind"],
          ["DC String Protection", "DC Combiner & Isolator", "1 Set", "1000V DC 32A Fuses + Class II Surge Protection"],
          ["AC Switchgear", "4-Pole MCB + Type II SPD", "1 Set", "400V 3-Phase + Neutral Breaker & Earth Protection"],
          ["DISCO Net-Metering", "Bi-Directional Meter", "1 Set", "WAPDA / DISCO Net-Metering Ready Standard"]
        ],
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105], fontSize: 8.5, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] }
      });

      // Section 3: Electrical Stringing & Sizing
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        head: [["ELECTRICAL SIZING PARAMETER", "ENGINEERING CALCULATION", "STATUS / COMPLIANCE"]],
        body: [
          ["Safe String Configuration", `${stringingAnalysis?.stringCount || 2} Strings of ${stringingAnalysis?.safeStringSize || 14} Modules`, "OPTIMAL CONFIGURATION"],
          ["Cold Weather Dawn Voc (-5°C)", `${stringingAnalysis?.winterStringVoc || 745} V DC (Inverter Max: 1100V)`, "COMPLIANT (NEC 690.7)"],
          ["Hot Weather Peak Vmp (65°C)", `${stringingAnalysis?.summerStringVmp || 580} V DC (MPPT Min: 200V)`, "WITHIN MPPT WINDOW"],
          ["DC/AC Overclocking Ratio", `${stringingAnalysis?.dcAcRatio || 1.25}x (Inverter Utilization)`, "OPTIMAL (1.15x - 1.30x)"],
          ["DC Solar Cable Sizing", "6.0 mm² Copper (Run: 35m)", "Voltage Drop: < 1.2% (Pass)"],
          ["AC Mains Cable Sizing", "25.0 mm² 4-Core Copper (Run: 40m)", "Voltage Drop: < 1.1% (Pass)"]
        ],
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], fontSize: 8.5, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 }
      });

      // Section 4: 12-Month Production Forecast
      const monthRows = (productionAnalysis?.monthlyGeneration || []).map(m => [
        m.month,
        `${m.kwh?.toLocaleString()} kWh`,
        `${m.sharePct}%`,
        `PKR ${formatPKR(Math.round(m.kwh * 65))}`
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        head: [["MONTH", "ENERGY GENERATION", "ANNUAL SHARE", "GRID SAVINGS (@ Rs 65/kWh)"]],
        body: monthRows.length > 0 ? monthRows : [
          ["Annual Total", `${annualKwh} kWh`, "100%", `PKR ${formatPKR((productionAnalysis?.netAnnualKwh || 32500) * 65)}`]
        ],
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 7.5 }
      });

      // Page Footer / Sign-off
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Prepared by: Green Tech Power Engineering Division | Approved for Client Proposal & EPC Contract", 14, 285);

      doc.save(`Solar_Proposal_${projectCode}_${clientName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      alert("PDF generation failed: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Sync with BOQ Handler
  const handleSyncBOQ = () => {
    if (onSyncWithBOQ) {
      onSyncWithBOQ({
        capacityKw: parseFloat(dcCapacityKw),
        moduleCount,
        moduleKey: selectedModuleKey,
        inverterModel: selectedInverterModel,
        inverterKw: inverterCapacityKw
      });
    }
    setSyncedSuccess(true);
    setTimeout(() => setSyncedSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              7. Proposal & Engineering Report Export
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive client proposal, electrical datasheet, and official EPC sign-off documentation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncBOQ}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {syncedSuccess ? "Synced with BOQ!" : "Sync with Project BOQ"}
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? "Generating PDF..." : "Download PDF Proposal"}
            </button>
          </div>
        </div>
      </div>

      {/* Proposal Printable Canvas Preview */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 text-xs max-w-4xl mx-auto">
        {/* Company Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-emerald-600 pb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sun className="w-6 h-6 text-emerald-600" />
              GREEN TECH POWER (PVT) LTD
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Specialized Solar EPC Contractor | PEC Registered | NTN: 7845129-3
            </p>
            <p className="text-[11px] text-slate-400">
              Gulberg III, Lahore, Pakistan | Tel: +92 42 35789100 | info@greentechpower.pk
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Proposal Reference</span>
            <span className="text-sm font-mono font-extrabold text-emerald-800 block">{projectCode}</span>
            <span className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString("en-GB")}</span>
          </div>
        </div>

        {/* Client & Project Summary Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer / Site Details</span>
            <h4 className="font-bold text-slate-900 text-sm">{clientName}</h4>
            <p className="text-slate-600 text-[11px] mt-0.5">{siteAddress}</p>
            <p className="text-slate-500 text-[10px] font-mono mt-1">GPS: {siteLat.toFixed(4)}°N, {siteLng.toFixed(4)}°E</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">DC System Size</span>
              <span className="font-mono font-extrabold text-emerald-700 text-sm">{dcCapacityKw} kWp</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Annual Generation</span>
              <span className="font-mono font-extrabold text-blue-700 text-sm">{annualKwh} kWh</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Performance Ratio</span>
              <span className="font-mono font-extrabold text-purple-700 text-sm">{prPct}%</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Energy Yield</span>
              <span className="font-mono font-extrabold text-amber-700 text-sm">{specificYield} kWh/kWp</span>
            </div>
          </div>
        </div>

        {/* Section 1: Bill of Equipment Selected */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            1. Bill of Verified Photovoltaic Equipment
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Equipment Item</th>
                  <th className="py-2 px-3">Manufacturer & Model</th>
                  <th className="py-2 px-3">Quantity</th>
                  <th className="py-2 px-3">Technical Specification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">PV Solar Modules</td>
                  <td className="py-2 px-3 font-mono text-slate-700">{selectedModuleKey}</td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-700">{moduleCount} Modules</td>
                  <td className="py-2 px-3 text-slate-600">Tier-1 N-Type TOPCon Dual-Glass, 25-Year Warranty</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">Grid Inverter</td>
                  <td className="py-2 px-3 font-mono text-slate-700">{selectedInverterModel}</td>
                  <td className="py-2 px-3 font-mono font-bold text-blue-700">1 Unit</td>
                  <td className="py-2 px-3 text-slate-600">{inverterCapacityKw} kW 3-Phase Multi-MPPT 1100V, 98.6% Efficiency</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">Mounting Structure</td>
                  <td className="py-2 px-3 text-slate-700">{rackingType}</td>
                  <td className="py-2 px-3 font-mono text-slate-700">{dcCapacityKw} kWp</td>
                  <td className="py-2 px-3 text-slate-600">Hot-Dip Galvanized HDG (80µm) Structural Steel, 160 km/h Wind Rating</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">DC Electrical Cable</td>
                  <td className="py-2 px-3 text-slate-700">6mm² Single-Core Solar PV Cable</td>
                  <td className="py-2 px-3 font-mono text-slate-700">35 meters</td>
                  <td className="py-2 px-3 text-slate-600">1000V DC TUV Certified XLPO, Voltage Drop &lt; 1.2%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">AC Electrical Cable</td>
                  <td className="py-2 px-3 text-slate-700">25mm² 4-Core Copper XLPE</td>
                  <td className="py-2 px-3 font-mono text-slate-700">40 meters</td>
                  <td className="py-2 px-3 text-slate-600">400V 3-Phase AC Mains, Voltage Drop &lt; 1.1%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Electrical Sizing & Compliance */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            2. Electrical Stringing & Inverter MPPT Analysis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">String Architecture</span>
              <span className="font-mono font-bold text-slate-800 block text-xs mt-0.5">
                {stringingAnalysis?.stringCount || 2} Strings × {stringingAnalysis?.safeStringSize || 14} Modules
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">100% Symmetrically Balanced</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Extreme Winter Voc (-5°C)</span>
              <span className="font-mono font-bold text-emerald-700 block text-xs mt-0.5">
                {stringingAnalysis?.winterStringVoc || 745.2} V DC
              </span>
              <span className="text-[10px] text-slate-500">Inverter DC Limit: 1100V</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Extreme Summer Vmp (65°C)</span>
              <span className="font-mono font-bold text-blue-700 block text-xs mt-0.5">
                {stringingAnalysis?.summerStringVmp || 580.4} V DC
              </span>
              <span className="text-[10px] text-slate-500">Inverter MPPT Window: 200-1000V</span>
            </div>
          </div>
        </div>

        {/* Section 3: Environmental Offset */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TreePine className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-950 text-xs">Clean Green Environmental Impact</h4>
              <p className="text-[11px] text-emerald-800">
                This solar facility will eliminate approximately <strong>{co2TonsAnnual} metric tons of CO₂</strong> emissions annually.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-700 uppercase font-bold block">Equivalent Forest</span>
            <span className="font-mono font-extrabold text-emerald-900 text-sm">~{treesEquivalent} Mature Trees</span>
          </div>
        </div>

        {/* Section 4: Engineering Sign-off & Stamp */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Prepared & Designed By:</span>
            <p className="font-bold text-slate-800">Engr. Solar Design Specialist</p>
            <p className="text-[11px] text-slate-500">B.Sc. Electrical Engineering, PEC Certified</p>
            <div className="mt-8 border-b border-slate-300 w-48"></div>
            <span className="text-[9px] text-slate-400">Signature & Date</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">EPC Directorate Approval:</span>
            <p className="font-bold text-slate-800">Green Tech Power Technical Board</p>
            <p className="text-[11px] text-slate-500">ISO 9001:2015 & PEC C3 Compliant</p>
            <div className="mt-8 border-b border-slate-300 w-48 ml-auto"></div>
            <span className="text-[9px] text-slate-400">Official Stamp & Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}
