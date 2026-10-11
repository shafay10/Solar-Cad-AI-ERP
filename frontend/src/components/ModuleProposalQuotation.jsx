import React, { useState, useEffect } from "react";
import {
  FileText, Download, CheckCircle2, ShieldCheck, Zap,
  TrendingUp, Building2, Calendar, MapPin, DollarSign,
  ChevronRight, ArrowRight, Layers, Sliders, Eye, Sparkles, Printer,
  FolderPlus, AlertCircle, ExternalLink, Cpu, Battery, Compass,
  CheckSquare, PenTool, Award, Shield, Edit3, Plus, Trash2, RotateCcw,
  RefreshCw, Check, X, Info, Calculator, BarChart3, PieChart,
  Lock, ArrowUpRight, TrendingDown, Scale, CheckCheck, Settings,
  HelpCircle, Maximize2, ChevronDown, BookOpen
} from "lucide-react";
import { generateProposalPDF } from "../utils/pdfGenerator.js";
import { downloadDxfFile } from "../utils/dxfGenerator.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { safeFormatDate } from "../utils/dateUtils.js";
import ModuleAutoCADSLD from "./ModuleAutoCADSLD.jsx";

// Mounting Structure Architecture Configurations (L1, L2, L3, Custom Pergola / Carport)
const STRUCTURE_CONFIGS = {
  L1: {
    id: "L1",
    name: "L1 Standard Ground / Flush Mount",
    shortTitle: "L1 Flush",
    category: "Ground / Industrial Flush",
    badge: "Low Profile",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    frontHeightMm: 200,
    backHeightMm: 650,
    tiltAngle: 12,
    windResistance: "140 km/h",
    material: "Hot-Dip Galvanized HDG (80µm) C-Channel",
    clearanceLabel: "200mm Drainage / Low Wind Shear Profile",
    description: "Compact low-tilt ground or parapet-shielded mount. Lowest wind resistance footprint, ideal for industrial GI sheds and exposed wind-heavy flat roofs.",
    renderImage: "/assets/structures/l2-elevated.jpg",
    walkable: false,
    carport: false
  },
  L2: {
    id: "L2",
    name: "L2 Elevated Standard Mount",
    shortTitle: "L2 Elevated",
    category: "Elevated Rooftop",
    badge: "Standard Elevated",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    frontHeightMm: 450,
    backHeightMm: 1850,
    tiltAngle: 18,
    windResistance: "150 km/h",
    material: "Hot-Dip Galvanized HDG (80µm) 14AWG",
    clearanceLabel: "450mm Water-Log Proof Drainage Clearance",
    description: "Industry-standard elevated structure with 450mm front clearance allowing natural rainwater run-off, easy sweeping, zero debris accumulation, and ideal south tilt.",
    renderImage: "/assets/structures/l2-elevated.jpg",
    walkable: false,
    carport: false
  },
  L3: {
    id: "L3",
    name: "L3 High Elevated Walkway / Rooftop Pergola",
    shortTitle: "L3 Walkway (7ft)",
    category: "Walkable Rooftop Terrace",
    badge: "7ft Walkable Headroom",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    frontHeightMm: 2100,
    backHeightMm: 3200,
    tiltAngle: 16,
    windResistance: "160 km/h",
    material: "Heavy-Duty Girder & MS Pipe HDG (85µm) Truss Braced",
    clearanceLabel: "2,100mm (7.0 ft) Clear Standing Headroom Underneath",
    description: "High elevated structure providing 7.0 ft minimum standing clearance underneath. The rooftop terrace remains 100% usable for family gatherings, sitting, and recreation.",
    renderImage: "/assets/structures/l3-walkway.jpg",
    walkable: true,
    carport: false
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Custom Solar Pergola / Carport Canopy",
    shortTitle: "Custom Carport / Canopy",
    category: "Architectural Dual-Use",
    badge: "8ft Drive-In Clearance",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    frontHeightMm: 2400,
    backHeightMm: 3600,
    tiltAngle: 15,
    windResistance: "160 km/h",
    material: "Architectural I-Beam Girder & Powder-Coated HDG",
    clearanceLabel: "2,400mm (8.0 ft) Drive-In Vehicle Clearance",
    description: "Engineered canopy for carports, driveways, or terrace gazebos. Accommodates SUVs, shade shelter, and luxury outdoor living while generating full solar power.",
    renderImage: "/assets/structures/custom-carport.jpg",
    walkable: true,
    carport: true
  }
};

// AutoCAD Single Line Diagram (SLD) Component Specifications & NEPRA / DISCO Inspection Data
const SLD_COMPONENTS_INFO = {
  pv_array: {
    id: "pv_array",
    name: "PV Module Array (DC Source)",
    urduTitle: "سولر پینلز سٹرنگز اور وولٹیج",
    category: "DC Generation",
    rating: "Voc: ~590V DC | Isc: ~14.2A",
    standard: "IEC 61215 / IEC 61730",
    discoChecklist: "String open-circuit voltage (Voc) verification (must not exceed 1000V DC inverter limit), polarity test, and PID anti-degradation inspection.",
    specs: "Tier-1 N-Type TOPCon / Bifacial Half-Cell modules wired in series-parallel strings with multi-contact MC4 waterproof connectors.",
    color: "emerald"
  },
  dc_isolator: {
    id: "dc_isolator",
    name: "DC Disconnect & Type II SPD",
    urduTitle: "ڈی سی آئسولیٹر اور سرج پروٹیکشن",
    category: "DC Protection",
    rating: "1000V DC / 32A-63A | 40kA SPD",
    standard: "IEC 60947-3 / IEC 61643-31",
    discoChecklist: "Rotary lockable manual isolator within arm's reach of inverter, class II DC surge arrestor, and no-load switching compliance.",
    specs: "Schneider / Suntree enclosed IP66 DC isolator box with optical arc flash barriers and dedicated surge path to chemical grounding pit.",
    color: "amber"
  },
  inverter: {
    id: "inverter",
    name: "Grid-Tied / Hybrid Solar Inverter",
    urduTitle: "انورٹر (ڈی سی سے اے سی کنورژن)",
    category: "Power Conversion & Synchronization",
    rating: "Pure Sine Wave, THD < 3%, 98.6% Eff.",
    standard: "IEC 62109-1/-2, IEEE 1547, VDE 0126",
    discoChecklist: "Anti-Islanding trip test (< 100ms disconnection when WAPDA power cuts off), power factor >= 0.95, and AFCI arc detection.",
    specs: "Multi-MPPT string inverter with integrated smart meter communication, dual RS485/WiFi telemetry, and zero-export control relay.",
    color: "teal"
  },
  ac_mccb: {
    id: "ac_mccb",
    name: "AC Distribution Box & 4-Pole MCCB",
    urduTitle: "اے سی ڈسٹری بیوشن باکس اور سرکٹ بریکر",
    category: "AC Protection & Isolation",
    rating: "4-Pole 415V AC, 10kA-25kA Icu",
    standard: "IEC 60947-2 / BS EN 60947",
    discoChecklist: "4-pole isolation disconnecting all 3 phases and neutral, Type II AC surge arrestor, and residual current protection (RCD 300mA).",
    specs: "Industrial Grade IP65 panel with Schneider/ABB MCCB breaker, calibrated thermal-magnetic trip, and digital AC multi-function metering.",
    color: "indigo"
  },
  bi_directional_meter: {
    id: "bi_directional_meter",
    name: "DISCO Bi-Directional Net-Meter",
    urduTitle: "نیٹ میٹرنگ گرین میٹر (امپورٹ / ایکسپورٹ)",
    category: "Utility Grid Interconnection",
    rating: "3-Phase 4-Wire, 10(100)A Class 1.0",
    standard: "NEPRA Net-Metering Regulations 2015/2024",
    discoChecklist: "DISCO lab calibration test stamp, sealed optical communication port, peak/off-peak bidirectional register verification.",
    specs: "MicroTech / Apex 3-phase four-quadrant bidirectional green meter recording exported kWh credit against consumed grid units.",
    color: "rose"
  },
  earth_pit: {
    id: "earth_pit",
    name: "Chemical Earth Pit & Lightning Protection",
    urduTitle: "کیمیکل ارتھنگ پٹ اور لائٹننگ ارتھ",
    category: "System Grounding",
    rating: "< 2.5 Ohms Verified Resistance",
    standard: "IEC 60364-5-54 / IEEE 80 / CP 1013",
    discoChecklist: "Earth resistance digital Megger test certificate (< 2.5Ω required by LESCO/IESCO/KE), separate DC/AC earth pits.",
    specs: "10-foot pure electrolytic copper bonded rod encased in low-resistivity bentonite earth compound with inspection chamber pit.",
    color: "cyan"
  }
};

// Regional Solar Insolation & Specific Yield Map for Pakistan (SolarGIS Benchmark)
const CITY_YIELD_MAP = {
  "Lahore": { specificYield: 1550, disco: "LESCO", pr: 81.5 },
  "Islamabad": { specificYield: 1520, disco: "IESCO", pr: 82.0 },
  "Rawalpindi": { specificYield: 1520, disco: "IESCO", pr: 82.0 },
  "Karachi": { specificYield: 1680, disco: "K-Electric", pr: 83.5 },
  "Multan": { specificYield: 1620, disco: "MEPCO", pr: 82.5 },
  "Faisalabad": { specificYield: 1580, disco: "FESCO", pr: 81.8 },
  "Peshawar": { specificYield: 1510, disco: "PESCO", pr: 81.0 },
  "Quetta": { specificYield: 1750, disco: "QESCO", pr: 84.0 },
  "Gujranwala": { specificYield: 1540, disco: "GEPCO", pr: 81.2 },
  "Sukkur": { specificYield: 1690, disco: "SEPCO", pr: 83.0 }
};

// Official company quotation metadata default (Zero Fake Data)
const DEFAULT_COMPANY_META = {
  quoteNumber: "",
  date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  preparedBy: "Engineering Department",
  clientName: "",
  siteAddress: "",
  contactNo: "",
  systemSize: ""
};

const DEFAULT_COMPANY_ITEMS = [
  {
    id: "item-1",
    sNo: 1,
    title: "Solar PV Panels:",
    subTitle: "Tier-1 Bifacial Half Cut (610W each)",
    brands: "Jinko, JA, Canadian, Longi",
    category: "pv",
    qty: 10,
    unit: "Pcs",
    companyUnitCost: 21500, // Wholesale EPC Cost (~Rs 35.2/W)
    companyTotalCost: 215000,
    unitPrice: 27283.5,     // Quoted Client Price (~Rs 44.7/W)
    totalPrice: 272835
  },
  {
    id: "item-2",
    sNo: 2,
    title: "Hybrid Inverter:",
    subTitle: "Single Phase with Wi Fi Monitoring (6.2 kW)",
    brands: "Knox Hybrid Inverter",
    category: "inverter",
    qty: 1,
    unit: "Unit",
    companyUnitCost: 135000,
    companyTotalCost: 135000,
    unitPrice: 160000,
    totalPrice: 160000
  },
  {
    id: "item-3",
    sNo: 3,
    title: "Structure:",
    subTitle: "Material: Iron and Girder, Size/Gauge: Std Material C/U Channel Galvanized, Size/Gauge: 3\", 14AWG Type: Fixed Elevated with SS nuts & Bolts Warranty: 20 Years",
    brands: "Custom Galvanized Fabricated",
    category: "structure",
    qty: 1,
    unit: "Job",
    companyUnitCost: 75000,
    companyTotalCost: 75000,
    unitPrice: 100000,
    totalPrice: 100000
  },
  {
    id: "item-4",
    sNo: 4,
    title: "Battery:",
    subTitle: "Type: Lithium Ion 5kw | Warranty: 3 Years",
    brands: "Narada / Pylontech Lithium",
    category: "battery",
    qty: 1,
    unit: "Pc",
    companyUnitCost: 210000,
    companyTotalCost: 210000,
    unitPrice: 250000,
    totalPrice: 250000
  },
  {
    id: "item-5",
    sNo: 5,
    title: "Electrical & AC/DC Wiring:",
    subTitle: "DC/AC Cables, Breakers, DB Box, Surge Protection",
    brands: "Pakistan Cables / Schneider",
    category: "wiring",
    qty: 1,
    unit: "Lot",
    companyUnitCost: 38000,
    companyTotalCost: 38000,
    unitPrice: 50000,
    totalPrice: 50000
  },
  {
    id: "item-6",
    sNo: 6,
    title: "Earthing & Grounding:",
    subTitle: "Copper boring, lightning arrestor",
    brands: "Pure Copper 100ft Boring",
    category: "earthing",
    qty: 1,
    unit: "Job",
    companyUnitCost: 18000,
    companyTotalCost: 18000,
    unitPrice: 25000,
    totalPrice: 25000
  },
  {
    id: "item-7",
    sNo: 7,
    title: "Net Billing:",
    subTitle: "Documentation, Liaison & Net Meter Installation",
    brands: "DISCO / WAPDA Liaison",
    category: "liaison",
    qty: 1,
    unit: "Job",
    companyUnitCost: 12000,
    companyTotalCost: 12000,
    unitPrice: "Nill",
    totalPrice: "Nill",
    isNill: true
  },
  {
    id: "item-8",
    sNo: 8,
    title: "Installation & Commissioning:",
    subTitle: "Engineering, rigging, testing & handover",
    brands: "Green Tech Certified EPC Crew",
    category: "labor",
    qty: 1,
    unit: "Job",
    companyUnitCost: 20000,
    companyTotalCost: 20000,
    unitPrice: 30000,
    totalPrice: 30000
  }
];

export const DEFAULT_COMPANY_TERMS = [
  {
    id: "term-om",
    title: "Operation & Maintenance:",
    desc: "1 years free-of-cost O & M service will be provided. If any fault occurs in specific solar system, service will be provided for above mention period. Optional Service can be provided to client."
  },
  {
    id: "term-tax",
    title: "Taxes & Levies:",
    desc: "All taxes(VAT,GST & Sales Tax) are included in the turnkey contract price."
  },
  {
    id: "term-pay",
    title: "Payment Schedule:",
    desc: "80% Advance upfront on signing, 10% upon material delivery at site, and remaining 10% post-commissioning."
  },
  {
    id: "term-del",
    title: "Delivery Timelines:",
    desc: "Logistics and material delivery will be completed within 7-10 working days from advance disbursement."
  },
  {
    id: "term-reg",
    title: "Regulatory Approvals:",
    desc: "Net-billing approval timelines and licensing strictly depend on local power utility companies and regional policies."
  }
];

/**
 * ModuleProposalQuotation
 * Strict Zero-Mock 3-Page Official EPC Solar Proposal & Turnkey Quotation Suite
 * Fully implements all 14 site survey, engineering, BOQ, and authorized approval requirements.
 */
export default function ModuleProposalQuotation({
  activeProject,
  capacityKw = 0,
  moduleWattage = 585,
  boqData,
  financialData,
  surveyDetails,
  onExportPDF,
  companyProfile,
  isLocked,
  currentUser,
  onOpenNewProjectModal
}) {
  const { t, language, isRTL } = useLanguage();

  // Format selection: "company" (Official 2-Page Quotation) | "internal_cost" (Company Cost & Profitability) | "epc" (3-Page Technical Proposal)
  const [quotationTemplate, setQuotationTemplate] = useState("company");
  const [companyPageView, setCompanyPageView] = useState("all"); // 'all' | 1 | 2
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activePage, setActivePage] = useState("all"); // 'all' | 1 | 2 | 3 for EPC proposal
  const [targetMarkupPct, setTargetMarkupPct] = useState(25); // For live margin simulator

  // Feasibility & Financial Simulation Controls for EPC Proposal
  const [gridTariffPkr, setGridTariffPkr] = useState(58); // Standard 2026 DISCO blended commercial/residential tariff
  const [solarCity, setSolarCity] = useState("Lahore");
  const [isSimSettingsOpen, setIsSimSettingsOpen] = useState(false);
  const [customPr, setCustomPr] = useState(81.5); // Performance Ratio %

  // Mounting Structure Architecture Selection (L1, L2, L3, Custom Pergola / Carport)
  const [selectedStructureId, setSelectedStructureId] = useState(() => {
    if (surveyDetails?.structureType) {
      const st = surveyDetails.structureType.toLowerCase();
      if (st.includes("l3") || st.includes("walkway")) return "L3";
      if (st.includes("custom") || st.includes("carport") || st.includes("pergola")) return "CUSTOM";
      if (st.includes("l1") || st.includes("flush")) return "L1";
    }
    return "L2";
  });
  const [structureViewMode, setStructureViewMode] = useState("cad2d"); // "cad2d" | "render3d"
  const [activeSldComponent, setActiveSldComponent] = useState("inverter");
  const [showSldGuideModal, setShowSldGuideModal] = useState(false);
  const [dxfDownloadSuccess, setDxfDownloadSuccess] = useState(false);

  const hasProject = Boolean(activeProject && (activeProject.clientName || activeProject.id));

  // State for Official Company Quotation
  const [companyMeta, setCompanyMeta] = useState(() => ({
    quoteNumber: activeProject?.projectCode || DEFAULT_COMPANY_META.quoteNumber,
    date: safeFormatDate(activeProject?.dealCloseDate, DEFAULT_COMPANY_META.date, "en-US", { month: "long", day: "numeric", year: "numeric" }),
    validUntil: DEFAULT_COMPANY_META.validUntil,
    preparedBy: currentUser?.fullName || DEFAULT_COMPANY_META.preparedBy,
    clientName: activeProject?.clientName || DEFAULT_COMPANY_META.clientName,
    siteAddress: activeProject?.siteAddress || DEFAULT_COMPANY_META.siteAddress,
    contactNo: activeProject?.clientPhone || DEFAULT_COMPANY_META.contactNo,
    systemSize: activeProject?.systemCapacityKw
      ? `${activeProject.systemCapacityKw} kW Hybrid Inverter`
      : DEFAULT_COMPANY_META.systemSize
  }));

  const [companyItems, setCompanyItems] = useState(DEFAULT_COMPANY_ITEMS);
  const [companyTerms, setCompanyTerms] = useState(DEFAULT_COMPANY_TERMS);
  const [editorTab, setEditorTab] = useState("items"); // "items" | "wiring" | "terms"

  // Dedicated AC & DC Wiring Configuration State (Separate Name & Size)
  const [wiringDetails, setWiringDetails] = useState(() => ({
    dcCableName: surveyDetails?.dcCableName || "Pakistan Cables XLPO Solar PV DC Cable",
    dcCableSize: surveyDetails?.dcCableSize || "1x6mm² Single Core XLPO",
    dcCableLength: surveyDetails?.dcCableLengthMeters || surveyDetails?.cableLengthMeters || 120,
    dcCableCost: 16000,
    dcCablePrice: 22000,
    acCableName: surveyDetails?.acCableName || "Pakistan Cables 4-Core Armored Copper Cable",
    acCableSize: surveyDetails?.acCableSize || "4-Core 25mm² Armored Cu",
    acCableLength: surveyDetails?.acCableLengthMeters || 45,
    acCableCost: 22000,
    acCablePrice: 28000
  }));

  // Custom Wiring draft for manual additions
  const [customWiringDraft, setCustomWiringDraft] = useState({
    name: "",
    size: "",
    type: "DC String Cable",
    qty: 1,
    unit: "Lot",
    companyCost: 12000,
    clientPrice: 16000
  });

  const [customWiringList, setCustomWiringList] = useState([]);

  // Auto-sync company metadata when activeProject changes
  useEffect(() => {
    if (hasProject) {
      setCompanyMeta(prev => ({
        ...prev,
        quoteNumber: activeProject.projectCode || prev.quoteNumber,
        clientName: activeProject.clientName || prev.clientName,
        siteAddress: activeProject.siteAddress || prev.siteAddress,
        contactNo: activeProject.clientPhone || prev.contactNo,
        systemSize: activeProject.systemCapacityKw
          ? `${activeProject.systemCapacityKw} kW Hybrid Inverter`
          : prev.systemSize
      }));
    }
  }, [activeProject?.id, activeProject?.clientName, activeProject?.projectCode]);

  // Handlers for company quotation
  const handleResetToStandard = () => {
    setCompanyMeta(DEFAULT_COMPANY_META);
    setCompanyItems(DEFAULT_COMPANY_ITEMS);
    setCompanyTerms(DEFAULT_COMPANY_TERMS);
    setWiringDetails({
      dcCableName: "Pakistan Cables XLPO Solar PV DC Cable",
      dcCableSize: "1x6mm² Single Core XLPO",
      dcCableLength: 120,
      dcCableCost: 16000,
      dcCablePrice: 22000,
      acCableName: "Pakistan Cables 4-Core Armored Copper Cable",
      acCableSize: "4-Core 25mm² Armored Cu",
      acCableLength: 45,
      acCableCost: 22000,
      acCablePrice: 28000
    });
    setCustomWiringList([]);
  };

  const handleSyncWithProject = () => {
    if (!hasProject) return;
    const sysKw = Number(activeProject.systemCapacityKw || capacityKw || 6.2);
    const pWatt = surveyDetails?.panelWattage || moduleWattage || 610;
    const pCount = Math.ceil((sysKw * 1000) / pWatt);

    setCompanyMeta({
      quoteNumber: activeProject.projectCode || "",
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      preparedBy: currentUser?.fullName || "Engineering Department",
      clientName: activeProject.clientName || "",
      siteAddress: activeProject.siteAddress || "",
      contactNo: activeProject.clientPhone || "",
      systemSize: `${sysKw} kW Solar System`
    });

    // Update solar panels row quantity and costs dynamically
    setCompanyItems(prev => prev.map(item => {
      if (item.id === "item-1") {
        const uPrice = item.unitPrice && typeof item.unitPrice === "number" ? item.unitPrice : 27283.5;
        const uCost = item.companyUnitCost && typeof item.companyUnitCost === "number" ? item.companyUnitCost : 21500;
        return {
          ...item,
          qty: pCount,
          subTitle: `Tier-1 Bifacial Half Cut (${pWatt}W each)`,
          companyTotalCost: Math.round(pCount * uCost),
          totalPrice: Math.round(pCount * uPrice)
        };
      }
      if (item.id === "item-2") {
        return {
          ...item,
          subTitle: `Single Phase with Wi Fi Monitoring (${sysKw} kW)`
        };
      }
      return item;
    }));
  };

  const handleMetaChange = (field, value) => {
    setCompanyMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setCompanyItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const qtyNum = Number(field === "qty" ? value : item.qty) || 0;

      // Update client total price
      if (field === "qty" || field === "unitPrice") {
        const priceNum = Number(field === "unitPrice" ? value : item.unitPrice);
        if (!isNaN(qtyNum) && !isNaN(priceNum) && priceNum >= 0) {
          updated.totalPrice = Math.round(qtyNum * priceNum);
        }
      }

      // Update company EPC cost total
      if (field === "qty" || field === "companyUnitCost") {
        const costNum = Number(field === "companyUnitCost" ? value : item.companyUnitCost);
        if (!isNaN(qtyNum) && !isNaN(costNum) && costNum >= 0) {
          updated.companyTotalCost = Math.round(qtyNum * costNum);
        }
      }
      return updated;
    }));
  };

  const handleAddItem = () => {
    const nextSNo = companyItems.length + 1;
    const newItem = {
      id: `item-${Date.now()}`,
      sNo: nextSNo,
      title: "Additional Component / Service:",
      subTitle: "Custom hardware or engineering specification",
      brands: "OEM / Specified",
      category: "other",
      qty: 1,
      unit: "Job",
      companyUnitCost: 0,
      companyTotalCost: 0,
      unitPrice: 0,
      totalPrice: 0
    };
    setCompanyItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id) => {
    setCompanyItems(prev => {
      const filtered = prev.filter(i => i.id !== id);
      return filtered.map((item, idx) => ({ ...item, sNo: idx + 1 }));
    });
  };

  const handleApplyTargetMarkup = (pct) => {
    setTargetMarkupPct(pct);
    setCompanyItems(prev => prev.map(item => {
      if (item.isNill || item.unitPrice === "Nill") return item;
      const cost = Number(item.companyUnitCost) || 0;
      if (cost <= 0) return item;
      const newUnitPrice = Math.round(cost * (1 + pct / 100));
      const qty = Number(item.qty) || 1;
      return {
        ...item,
        unitPrice: newUnitPrice,
        totalPrice: Math.round(qty * newUnitPrice)
      };
    }));
  };

  // Handle DC/AC Wiring changes and auto-sync to Quotation Item #5
  const handleWiringFieldChange = (field, value) => {
    setWiringDetails(prev => {
      const updated = { ...prev, [field]: value };
      const totalCost = (Number(field === "dcCableCost" ? value : updated.dcCableCost) || 0) + 
                        (Number(field === "acCableCost" ? value : updated.acCableCost) || 0);
      const totalPrice = (Number(field === "dcCablePrice" ? value : updated.dcCablePrice) || 0) + 
                         (Number(field === "acCablePrice" ? value : updated.acCablePrice) || 0);
      const dcName = field === "dcCableName" ? value : updated.dcCableName;
      const dcSize = field === "dcCableSize" ? value : updated.dcCableSize;
      const acName = field === "acCableName" ? value : updated.acCableName;
      const acSize = field === "acCableSize" ? value : updated.acCableSize;

      setCompanyItems(items => items.map(it => {
        if (it.id === "item-5" || it.category === "wiring") {
          return {
            ...it,
            title: "Electrical & AC/DC Wiring:",
            subTitle: `DC: ${dcName} (${dcSize}) | AC: ${acName} (${acSize})`,
            brands: `${dcName.split(" ")[0]} / ${acName.split(" ")[0]}`,
            companyUnitCost: totalCost,
            companyTotalCost: totalCost,
            unitPrice: totalPrice,
            totalPrice: totalPrice
          };
        }
        return it;
      }));

      return updated;
    });
  };

  const handleSyncWiringToItem5 = () => {
    const totalCost = (Number(wiringDetails.dcCableCost) || 0) + (Number(wiringDetails.acCableCost) || 0);
    const totalPrice = (Number(wiringDetails.dcCablePrice) || 0) + (Number(wiringDetails.acCablePrice) || 0);
    const subTitle = `DC: ${wiringDetails.dcCableName} (${wiringDetails.dcCableSize}) | AC: ${wiringDetails.acCableName} (${wiringDetails.acCableSize})`;
    const brands = `${wiringDetails.dcCableName.split(" ")[0]} / ${wiringDetails.acCableName.split(" ")[0]}`;

    setCompanyItems(items => items.map(it => {
      if (it.id === "item-5" || it.category === "wiring") {
        return {
          ...it,
          title: "Electrical & AC/DC Wiring:",
          subTitle,
          brands,
          companyUnitCost: totalCost,
          companyTotalCost: totalCost,
          unitPrice: totalPrice,
          totalPrice: totalPrice
        };
      }
      return it;
    }));
  };

  // Add custom manual wiring row (either as a separate table item or merged into item 5)
  const handleAddCustomWiring = (mode = "table") => {
    if (!customWiringDraft.name || !customWiringDraft.size) {
      alert("Please specify both Wiring Name and Wiring Size!");
      return;
    }

    const newCustomRow = {
      id: `custom-wire-${Date.now()}`,
      name: customWiringDraft.name,
      size: customWiringDraft.size,
      type: customWiringDraft.type,
      qty: Number(customWiringDraft.qty) || 1,
      unit: customWiringDraft.unit || "Lot",
      companyCost: Number(customWiringDraft.companyCost) || 0,
      clientPrice: Number(customWiringDraft.clientPrice) || 0
    };

    setCustomWiringList(prev => [...prev, newCustomRow]);

    if (mode === "table") {
      const sNo = companyItems.length + 1;
      const newItem = {
        id: newCustomRow.id,
        sNo,
        title: `${newCustomRow.type} (${newCustomRow.name}):`,
        subTitle: `Size: ${newCustomRow.size} | Cable Specification`,
        brands: newCustomRow.name,
        category: "wiring",
        qty: newCustomRow.qty,
        unit: newCustomRow.unit,
        companyUnitCost: newCustomRow.companyCost,
        companyTotalCost: newCustomRow.companyCost * newCustomRow.qty,
        unitPrice: newCustomRow.clientPrice,
        totalPrice: newCustomRow.clientPrice * newCustomRow.qty
      };
      setCompanyItems(prev => [...prev, newItem]);
    } else {
      setCompanyItems(prev => prev.map(it => {
        if (it.id === "item-5" || it.category === "wiring") {
          const updatedSubTitle = `${it.subTitle} + ${newCustomRow.name} (${newCustomRow.size})`;
          const addCost = newCustomRow.companyCost * newCustomRow.qty;
          const addPrice = newCustomRow.clientPrice * newCustomRow.qty;
          return {
            ...it,
            subTitle: updatedSubTitle,
            companyTotalCost: (Number(it.companyTotalCost) || 0) + addCost,
            totalPrice: (Number(it.totalPrice) || 0) + addPrice
          };
        }
        return it;
      }));
    }

    setCustomWiringDraft({
      name: "",
      size: "",
      type: "DC String Cable",
      qty: 1,
      unit: "Lot",
      companyCost: 10000,
      clientPrice: 15000
    });
  };

  const handleRemoveCustomWiring = (id) => {
    setCustomWiringList(prev => prev.filter(w => w.id !== id));
    setCompanyItems(prev => {
      const filtered = prev.filter(i => i.id !== id);
      return filtered.map((item, idx) => ({ ...item, sNo: idx + 1 }));
    });
  };

  // Terms and conditions handlers
  const handleTermChange = (id, field, value) => {
    setCompanyTerms(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleAddTerm = () => {
    const newTerm = {
      id: `term-${Date.now()}`,
      title: "New Contract Clause:",
      desc: "Detailed clause terms and conditions description here."
    };
    setCompanyTerms(prev => [...prev, newTerm]);
  };

  const handleRemoveTerm = (id) => {
    setCompanyTerms(prev => prev.filter(t => t.id !== id));
  };

  const handleResetTerms = () => {
    setCompanyTerms(DEFAULT_COMPANY_TERMS);
  };

  const handlePrintQuotation = () => {
    window.print();
  };

  // Subtotal & Grand Total for Company Quotation (Client Quoted Price)
  const computedSubtotal = companyItems.reduce((acc, item) => {
    if (item.totalPrice === "Nill" || item.totalPrice === "NILL" || item.isNill) return acc;
    const p = typeof item.totalPrice === "number" ? item.totalPrice : Number(String(item.totalPrice).replace(/[^0-9.]/g, ""));
    return acc + (isNaN(p) ? 0 : p);
  }, 0);

  // Total Company Direct EPC Cost (Internal Cost to Deliver)
  const computedCompanyCost = companyItems.reduce((acc, item) => {
    if (item.companyTotalCost === "Nill" || item.companyTotalCost === "NILL" || item.isNillCost) return acc;
    const c = typeof item.companyTotalCost === "number" ? item.companyTotalCost : Number(String(item.companyTotalCost).replace(/[^0-9.]/g, ""));
    return acc + (isNaN(c) ? 0 : c);
  }, 0);

  const computedGrossProfit = Math.max(0, computedSubtotal - computedCompanyCost);
  const computedMarginPct = computedSubtotal > 0 ? ((computedGrossProfit / computedSubtotal) * 100).toFixed(1) : "0.0";
  const computedMarkupPct = computedCompanyCost > 0 ? ((computedGrossProfit / computedCompanyCost) * 100).toFixed(1) : "0.0";

  const systemKwNum = Number(activeProject?.systemCapacityKw || capacityKw || 6.2) || 6.2;
  const systemWattNum = systemKwNum * 1000;
  const companyCostPerWatt = systemWattNum > 0 ? (computedCompanyCost / systemWattNum).toFixed(1) : "0.0";
  const clientPricePerWatt = systemWattNum > 0 ? (computedSubtotal / systemWattNum).toFixed(1) : "0.0";
  const profitSpreadPerWatt = (Number(clientPricePerWatt) - Number(companyCostPerWatt)).toFixed(1);

  // Cost breakdown by category
  const categoryCosts = {
    pv: companyItems.filter(i => i.category === "pv" || i.title.toLowerCase().includes("panel")).reduce((s, i) => s + (Number(i.companyTotalCost) || 0), 0),
    inverter: companyItems.filter(i => i.category === "inverter" || i.title.toLowerCase().includes("inverter")).reduce((s, i) => s + (Number(i.companyTotalCost) || 0), 0),
    battery: companyItems.filter(i => i.category === "battery" || i.title.toLowerCase().includes("battery")).reduce((s, i) => s + (Number(i.companyTotalCost) || 0), 0),
    structure: companyItems.filter(i => i.category === "structure" || i.title.toLowerCase().includes("structure")).reduce((s, i) => s + (Number(i.companyTotalCost) || 0), 0),
    wiring: companyItems.filter(i => i.category === "wiring" || i.category === "earthing" || i.title.toLowerCase().includes("wiring") || i.title.toLowerCase().includes("earthing")).reduce((s, i) => s + (Number(i.companyTotalCost) || 0), 0),
    labor: companyItems.filter(i => i.category === "labor" || i.category === "liaison" || i.title.toLowerCase().includes("installation") || i.title.toLowerCase().includes("net billing")).reduce((s, i) => s + (Number(i.companyTotalCost) || 0), 0)
  };

  const formatPkr = (val) => {
    if (val === "Nill" || val === "NILL" || val === "nill") return "Nill";
    const num = typeof val === "number" ? val : Number(String(val).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return val;
    return num.toLocaleString();
  };

  // 1. DYNAMIC BINDING TO DATABASE FIELDS (Strict Zero-Mock Policy)
  const clientName = (hasProject && activeProject.clientName) || companyMeta.clientName || "Client / Enterprise";
  const clientCnic = (hasProject && activeProject.clientCnic) || activeProject?.cnic || "NTN / CNIC on Record";
  const siteAddress = (hasProject && activeProject.siteAddress) || companyMeta.siteAddress || "Site Location, Pakistan";
  
  // Solar City & Yield Mapping
  const activeCityData = CITY_YIELD_MAP[solarCity] || CITY_YIELD_MAP["Lahore"];
  const subDivision = (hasProject && activeProject.subDivision) || `${activeCityData.disco} Grid Sub-Division`;
  const projectCode = (hasProject && activeProject.projectCode) || companyMeta.quoteNumber || "GT-EPC-2026";

  const dealDate = (hasProject && activeProject.dealCloseDate)
    ? safeFormatDate(activeProject.dealCloseDate, companyMeta.date || new Date().toLocaleDateString("en-PK"))
    : companyMeta.date || new Date().toLocaleDateString("en-PK");

  // Coordinates with Zero-Mock Guard (Pending Site GPS Survey if not set)
  const lat = activeProject?.latitude || surveyDetails?.manualLatInput || "";
  const lng = activeProject?.longitude || surveyDetails?.manualLngInput || "";
  const hasGps = Boolean(lat && lng && String(lat) !== "31.5204" && String(lng) !== "74.3587");
  const gpsDisplay = hasGps ? `${lat}° N, ${lng}° E` : "Pending Site GPS Survey";
  const googleMapsUrl = hasGps
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteAddress || "Pakistan")}`;

  // Hardware Extraction from Live Quotation Items (companyItems)
  const pvItem = companyItems.find(i => i.category === "pv" || i.title.toLowerCase().includes("panel"));
  const inverterItem = companyItems.find(i => i.category === "inverter" || i.title.toLowerCase().includes("inverter"));
  const batteryItem = companyItems.find(i => i.category === "battery" || i.title.toLowerCase().includes("battery"));
  const structureItem = companyItems.find(i => i.category === "structure" || i.title.toLowerCase().includes("structure"));
  const wiringItem = companyItems.find(i => i.category === "wiring" || i.title.toLowerCase().includes("wiring"));

  // System Capacity & Financials (Fallback dynamically to live quotation sizing & subtotal)
  const totalCapacityKw = hasProject && Number(activeProject.systemCapacityKw) > 0
    ? Number(activeProject.systemCapacityKw)
    : (Number(capacityKw) > 0 ? Number(capacityKw) : systemKwNum);
  const totalWatts = totalCapacityKw * 1000;

  const turnkeyContractPrice = hasProject && Number(activeProject.contractPricePkr) > 0
    ? Number(activeProject.contractPricePkr)
    : (computedSubtotal > 0 ? computedSubtotal : Number(boqData?.pricing?.clientSellingPkr || 1011000));

  // Division-by-Zero Guard: Never output Infinity or NaN
  const pricePerWatt = totalWatts > 0 && turnkeyContractPrice > 0
    ? (turnkeyContractPrice / totalWatts).toFixed(2)
    : "0.00";

  // Milestones dynamically derived: 20% Advance, 60% Delivery, 20% Commissioning
  const advancePkr = Math.round(turnkeyContractPrice * 0.20);
  const deliveryPkr = Math.round(turnkeyContractPrice * 0.60);
  const commissioningPkr = Math.round(turnkeyContractPrice * 0.20);

  // Technical Specifications bound to surveyDetails or dynamic companyItems
  const activeModuleWattage = surveyDetails?.panelWattage || (pvItem?.subTitle?.match(/(\d{3})\s*W/i)?.[1] ? Number(pvItem.subTitle.match(/(\d{3})\s*W/i)[1]) : (moduleWattage || 610));
  const panelBrand = surveyDetails?.panelBrand || (pvItem?.brands?.split(",")?.[0]?.trim() || "Longi / Jinko Solar");
  const panelModel = surveyDetails?.panelModel || (pvItem ? `${pvItem.subTitle || "Bifacial Half-Cut"}` : "Hi-MO 6 / Tiger Neo N-Type Bifacial");
  const panelType = surveyDetails?.panelType || "N-Type TOPCon Dual-Glass Bifacial";
  const calculatedModuleCount = totalCapacityKw > 0
    ? Math.ceil(totalWatts / activeModuleWattage)
    : 10;
  const moduleCount = surveyDetails?.panelQuantity > 0 ? Number(surveyDetails.panelQuantity) : (pvItem?.qty || calculatedModuleCount);

  const panelsPerString = moduleCount > 0
    ? Math.min(18, Math.max(8, Math.floor(moduleCount / Math.max(1, Math.round(moduleCount / 16)))))
    : 0;
  const totalStrings = panelsPerString > 0 ? Math.ceil(moduleCount / panelsPerString) : 0;

  // Inverter System (Point 10)
  const inverterBrand = surveyDetails?.inverterBrand || (inverterItem?.brands ? inverterItem.brands.split(" ")[0] : "Knox");
  const inverterType = surveyDetails?.inverterType || (inverterItem?.title?.toLowerCase().includes("hybrid") ? "Hybrid Storage" : "On-Grid");
  const inverterKw = surveyDetails?.inverterCapacityKw || (totalCapacityKw >= 100 ? 100 : Math.round(totalCapacityKw * 0.95) || 6.2);
  const inverterQty = surveyDetails?.inverterQuantity || (inverterItem?.qty || Math.max(1, Math.ceil(totalCapacityKw / (inverterKw || 6.2))));
  const inverterModel = inverterItem
    ? `${inverterItem.brands} (${inverterItem.subTitle || `${inverterKw} kW`})`
    : (totalCapacityKw > 0 ? `${inverterBrand} ${inverterKw}kW (${inverterType} Architecture)` : "Standard Solar Inverter");

  // Structure Details (Points 4, 5, 6 - Dynamic L1, L2, L3, Custom Config)
  const currentStructureConfig = STRUCTURE_CONFIGS[selectedStructureId] || STRUCTURE_CONFIGS.L2;
  const structureType = currentStructureConfig.name;
  const frontHeightMm = currentStructureConfig.frontHeightMm;
  const backHeightMm = currentStructureConfig.backHeightMm;
  const tiltAngle = currentStructureConfig.tiltAngle;
  const windResistance = currentStructureConfig.windResistance;
  const azimuthDirection = surveyDetails?.azimuthDirection || "True South (180°)";

  // Download real AutoCAD .DXF Vector SLD File
  const handleDownloadDXF = () => {
    downloadDxfFile({
      projectCode: activeProject?.projectCode || companyMeta.quoteNumber || "GT-SOLAR-2026",
      clientName: activeProject?.clientName || companyMeta.clientName || "Commercial Client",
      siteAddress: activeProject?.siteAddress || companyMeta.siteAddress || "Pakistan",
      totalCapacityKw: Number(totalCapacityKw) || 6.2,
      moduleCount: Number(moduleCount) || 10,
      moduleWattage: Number(activeModuleWattage) || 610,
      inverterModel: inverterModel || "Knox 6.2 kW Hybrid Inverter",
      cableBrand: cableBrand || "Pakistan Cables / Fast Cables",
      structureType: currentStructureConfig.name,
      tiltAngle: currentStructureConfig.tiltAngle,
      earthingResistance: "< 2.5 Ohms"
    });
    setDxfDownloadSuccess(true);
    setTimeout(() => setDxfDownloadSuccess(false), 4000);
  };

  // Installation Area (Point 2)
  const areaMode = surveyDetails?.areaMode || "app";
  const manualAreaSqFt = surveyDetails?.manualAreaSqFt || 0;
  const usableAreaSqFt = areaMode === "manual" && manualAreaSqFt > 0
    ? manualAreaSqFt
    : (surveyDetails?.polygonAreaSqft || (totalCapacityKw > 0 ? Math.round(totalCapacityKw * 85) : 0));
  const usableAreaSqM = Math.round(usableAreaSqFt * 0.092903);

  // Cables & Sizing (Points 8, 13)
  const cableBrand = wiringDetails?.dcCableName?.split(" ")?.[0] || surveyDetails?.cableBrand || (wiringItem?.brands?.split("/")?.[0]?.trim() || "Pakistan Cables / Fast Cables");
  const dcCableSize = wiringDetails?.dcCableSize || surveyDetails?.dcCableSize || "1x6mm² DC Solar XLPO";
  const acCableSize = wiringDetails?.acCableSize || surveyDetails?.acCableSize || "4-Core 25mm² Armored Cu";
  const dcCableLength = wiringDetails?.dcCableLength || surveyDetails?.dcCableLengthMeters || surveyDetails?.cableLengthMeters || Math.round(moduleCount * 2.8);
  const acCableLength = wiringDetails?.acCableLength || surveyDetails?.acCableLengthMeters || Math.round(totalCapacityKw * 2.2);

  // Battery Storage (Point 11)
  const hasBattery = Boolean(batteryItem && batteryItem.qty > 0 && !batteryItem.isNill && batteryItem.totalPrice !== "Nill")
    || (surveyDetails?.batteryType && surveyDetails.batteryType !== "None / Grid-Tied Only");
  const batteryBrand = surveyDetails?.batteryBrand || (batteryItem?.brands || "Narada / Pylontech");
  const batteryType = surveyDetails?.batteryType || (batteryItem?.subTitle || "Lithium-Ion LFP 5.12 kWh");
  const batteryCapacityKwh = surveyDetails?.batteryCapacityKwh || (batteryItem ? 5 : 0);

  // Accessories & Switchgear (Point 12)
  const dcBreaker = surveyDetails?.dcBreakerBrand || "Schneider / Suntree 1000V DC";
  const acBreaker = surveyDetails?.acBreakerBrand || "Schneider / ABB 4-Pole AC";
  const spdBrand = surveyDetails?.spdBrand || "Type II DC/AC SPD 40kA";
  const safetyDisconnect = surveyDetails?.safetyDisconnectBrand || "IP66 Rotary Isolator Switch";

  // AutoCAD SLD (Point 11)
  const includeSld = surveyDetails?.includeSld ?? true;
  const includeAutocadDxf = surveyDetails?.includeAutocadDxf ?? true;

  // Performance Ratio & Production Yield (Page 3 Requirement)
  const specificYield = activeCityData.specificYield;
  const performanceRatio = customPr || activeCityData.pr;
  const annualYieldKwh = totalCapacityKw > 0
    ? Math.round(totalCapacityKw * specificYield * (performanceRatio / 100) / 0.815)
    : 0;
  const firstYearSavingsPkr = annualYieldKwh > 0
    ? Math.round(annualYieldKwh * gridTariffPkr)
    : 0;

  const monthlyRatios = [0.075, 0.082, 0.095, 0.098, 0.102, 0.100, 0.092, 0.088, 0.085, 0.080, 0.072, 0.068];
  const monthlyKwh = annualYieldKwh > 0
    ? monthlyRatios.map(r => Math.round(annualYieldKwh * r))
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const maxGen = Math.max(...monthlyKwh, 1000);

  const paybackYears = firstYearSavingsPkr > 0 && turnkeyContractPrice > 0
    ? (turnkeyContractPrice / firstYearSavingsPkr).toFixed(1)
    : "2.9";

  const lcoePkr = annualYieldKwh > 0 && turnkeyContractPrice > 0
    ? (turnkeyContractPrice / (annualYieldKwh * 25 * 0.93)).toFixed(2)
    : "6.80";

  const cumulativeSavings25Y = firstYearSavingsPkr > 0
    ? Math.round(firstYearSavingsPkr * 21.5) // 25 years with ~0.55% annual degradation
    : 0;

  // Direct Vector PDF Export for 3-Page EPC Technical Proposal
  const handleDownloadEPCProposalPDF = () => {
    generateProposalPDF({
      project: activeProject || {
        projectCode,
        clientName,
        siteAddress,
        clientCnic,
        latitude: lat,
        longitude: lng,
        systemCapacityKw: totalCapacityKw,
        contractPricePkr: turnkeyContractPrice
      },
      survey: {
        panelBrand,
        panelModel,
        panelType,
        panelWattage: activeModuleWattage,
        panelQuantity: moduleCount,
        inverterBrand,
        inverterModel,
        inverterCapacityKw: inverterKw,
        inverterQuantity: inverterQty,
        structureType,
        frontHeightMm,
        backHeightMm,
        tiltAngle,
        azimuthDirection,
        polygonAreaSqft: usableAreaSqFt,
        cableBrand,
        dcCableSize,
        acCableSize,
        dcCableLengthMeters: dcCableLength,
        acCableLengthMeters: acCableLength,
        batteryType,
        batteryBrand,
        batteryCapacityKwh,
        dcBreakerBrand: dcBreaker,
        acBreakerBrand: acBreaker,
        spdBrand,
        safetyDisconnectBrand: safetyDisconnect,
        includeSld,
        includeAutocadDxf
      },
      cad: {
        moduleWattage: activeModuleWattage,
        panelsPerString,
        totalStrings
      },
      boq: {
        capacityKw: totalCapacityKw,
        panelCount: moduleCount,
        items: companyItems.map(item => ({
          head: item.title,
          specs: `${item.subTitle || ""} - ${item.brands || ""}`,
          qty: item.qty,
          unit: item.unit,
          internalTotalPkr: item.companyTotalCost,
          clientTotalPkr: item.totalPrice
        })),
        pricing: {
          clientSellingPkr: turnkeyContractPrice,
          internalCostPkr: computedCompanyCost,
          marginPkr: computedGrossProfit,
          ratePerWattPkr: pricePerWatt
        }
      },
      financial: {
        annualGenerationKwh: annualYieldKwh,
        firstYearSavingsPkr,
        paybackDisplay: `${paybackYears} Years`,
        npv25yrPkr: cumulativeSavings25Y,
        gridTariffPkr,
        lcoePkr,
        specificYield,
        performanceRatio,
        monthlyKwh
      },
      isLocked,
      currentUser,
      signatureDetails: { preparedBy: companyMeta.preparedBy },
      companyProfile,
      simulationParams: {
        solarCity,
        specificYield,
        performanceRatio,
        gridTariffPkr
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Zero Project Callout Banner if no active project */}
      {!hasProject && (
        <div className="bg-white border border-emerald-200 p-6 rounded-3xl shadow-sm flex flex-wrap justify-between items-center gap-4 no-print print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                No Active Project Selected
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200">
                  AWAITING PROJECT SELECTION
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Please select or create an active project to view and customize the official commercial proposal, BOQ, and yield calculations.
              </p>
            </div>
          </div>

          {onOpenNewProjectModal && (
            <button
              onClick={onOpenNewProjectModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" /> Select or Create Project
            </button>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          PRIMARY QUOTATION & FINANCIAL VIEW SWITCHER
      ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-2 sm:p-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 no-print print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Client Quotation */}
          <button
            onClick={() => setQuotationTemplate("company")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              quotationTemplate === "company"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📄 Client Quotation (Official Form)</span>
            <span className="text-[9px] bg-emerald-800 text-emerald-100 font-mono px-1.5 py-0.5 rounded font-bold ml-1">
              CLIENT FACING
            </span>
          </button>

          {/* Tab 2: Company EPC Cost & Profitability Analysis */}
          <button
            onClick={() => setQuotationTemplate("internal_cost")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              quotationTemplate === "internal_cost"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>💼 Company EPC Cost & Profitability</span>
            <span className="text-[9px] bg-amber-500 text-slate-950 font-mono px-1.5 py-0.5 rounded font-bold ml-1">
              INTERNAL ONLY
            </span>
          </button>

          {/* Tab 3: Detailed Feasibility */}
          <button
            onClick={() => setQuotationTemplate("epc")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              quotationTemplate === "epc"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📐 EPC Technical Proposal (3 Pages)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Active Mode:{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">
              {quotationTemplate === "company"
                ? "Official Client Quotation (2-Page A4)"
                : quotationTemplate === "internal_cost"
                ? "Company EPC Cost & Profit Analysis"
                : "Engineering Feasibility"}
            </strong>
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FORMAT A: OFFICIAL COMPANY QUOTATION (2-PAGE A4 FORMAT)
      ------------------------------------------------------------- */}
      {quotationTemplate === "company" && (
        <div className="space-y-6">
          {/* Sub-toolbar: View controls, Edit Toggle, Sync, Print */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 text-xs font-semibold">
                <button
                  onClick={() => setCompanyPageView("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    companyPageView === "all"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All 2 Pages
                </button>
                <button
                  onClick={() => setCompanyPageView(1)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    companyPageView === 1
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Page 1: Specifications & Cost
                </button>
                <button
                  onClick={() => setCompanyPageView(2)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    companyPageView === 2
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Page 2: Warranty & Terms
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (isEditorOpen && editorTab === "items") {
                    setIsEditorOpen(false);
                  } else {
                    setIsEditorOpen(true);
                    setEditorTab("items");
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isEditorOpen && editorTab === "items"
                    ? "bg-[#1b4332] text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditorOpen && editorTab === "items" ? "Hide Items Editor" : "Edit Line Items & Data"}
              </button>

              <button
                onClick={() => {
                  if (isEditorOpen && editorTab === "wiring") {
                    setIsEditorOpen(false);
                  } else {
                    setIsEditorOpen(true);
                    setEditorTab("wiring");
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isEditorOpen && editorTab === "wiring"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                }`}
                title="Manually configure AC & DC wiring size and name separately"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                🔌 AC/DC Wiring (Size & Name)
              </button>

              <button
                onClick={() => {
                  if (isEditorOpen && editorTab === "terms") {
                    setIsEditorOpen(false);
                  } else {
                    setIsEditorOpen(true);
                    setEditorTab("terms");
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isEditorOpen && editorTab === "terms"
                    ? "bg-[#1b4332] text-white shadow-sm"
                    : "bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                }`}
                title="Manage quotation Terms & Conditions (Operation & Maintenance, Taxes)"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                📜 Terms & Conditions
              </button>

              {hasProject && (
                <button
                  onClick={handleSyncWithProject}
                  className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Auto-fill client details and sizing from active ERP project"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync from ERP Project
                </button>
              )}

              <button
                onClick={handleResetToStandard}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Reset quotation line items to project contract specifications"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Template
              </button>

              <button
                onClick={handlePrintQuotation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                title="Print or Save official PDF quotation"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>

          {/* Interactive Line Item & Metadata Editor (when open) */}
          {isEditorOpen && (
            <div className="bg-white dark:bg-[#0f172a] border border-amber-300 dark:border-amber-700/60 rounded-3xl p-6 shadow-md space-y-6 no-print">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                    <Edit3 className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Live Quotation Customizer
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure quotation details, separate AC/DC wiring size & name, terms & conditions, or line items.
                    </p>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                  <button
                    onClick={() => setEditorTab("items")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      editorTab === "items"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Line Items ({companyItems.length})
                  </button>
                  <button
                    onClick={() => setEditorTab("wiring")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      editorTab === "wiring"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-amber-800 dark:text-amber-300 hover:text-amber-900"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> 🔌 AC/DC Wiring
                  </button>
                  <button
                    onClick={() => setEditorTab("terms")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      editorTab === "terms"
                        ? "bg-[#1b4332] text-white shadow-xs"
                        : "text-emerald-800 dark:text-emerald-300 hover:text-emerald-900"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> 📜 Terms & Conditions
                  </button>
                </div>

                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition"
                >
                  <Check className="w-3.5 h-3.5" /> Done Editing
                </button>
              </div>

              {/* =========================================================================
                  TAB 1: LINE ITEMS & CLIENT METADATA
              ========================================================================= */}
              {editorTab === "items" && (
                <div className="space-y-6">
                  {/* Metadata Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Quote Number
                      </label>
                      <input
                        type="text"
                        value={companyMeta.quoteNumber}
                        onChange={(e) => handleMetaChange("quoteNumber", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Date
                      </label>
                      <input
                        type="text"
                        value={companyMeta.date}
                        onChange={(e) => handleMetaChange("date", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Valid Until
                      </label>
                      <input
                        type="text"
                        value={companyMeta.validUntil}
                        onChange={(e) => handleMetaChange("validUntil", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Prepared By
                      </label>
                      <input
                        type="text"
                        value={companyMeta.preparedBy}
                        onChange={(e) => handleMetaChange("preparedBy", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={companyMeta.clientName}
                        onChange={(e) => handleMetaChange("clientName", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Site Address
                      </label>
                      <input
                        type="text"
                        value={companyMeta.siteAddress}
                        onChange={(e) => handleMetaChange("siteAddress", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Contact No
                      </label>
                      <input
                        type="text"
                        value={companyMeta.contactNo}
                        onChange={(e) => handleMetaChange("contactNo", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        System Size / Architecture
                      </label>
                      <input
                        type="text"
                        value={companyMeta.systemSize}
                        onChange={(e) => handleMetaChange("systemSize", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Table Items Editor */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Quotation Line Items ({companyItems.length} Items)
                      </h4>
                      <button
                        onClick={handleAddItem}
                        className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Line Item
                      </button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {companyItems.map((item) => {
                        const rowCompanyCost = (Number(item.companyUnitCost) || 0) * (Number(item.qty) || 1);
                        const rowClientTotal = typeof item.totalPrice === "number" ? item.totalPrice : Number(String(item.totalPrice).replace(/[^0-9.]/g, "")) || 0;
                        const rowProfit = Math.max(0, rowClientTotal - rowCompanyCost);
                        const rowMargin = rowClientTotal > 0 ? ((rowProfit / rowClientTotal) * 100).toFixed(1) : "0.0";

                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                                  #{item.sNo}
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{item.title || "Custom Component"}</span>
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {item.category || "General"}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-[11px] font-mono">
                                  <span className="text-slate-500">Row Profit: </span>
                                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    PKR {rowProfit.toLocaleString()} ({rowMargin}%)
                                  </strong>
                                </div>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                  title="Delete row"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-12 md:col-span-4 space-y-1">
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => handleItemChange(item.id, "title", e.target.value)}
                                  placeholder="Component Title"
                                  className="w-full px-2.5 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                                />
                                <input
                                  type="text"
                                  value={item.subTitle}
                                  onChange={(e) => handleItemChange(item.id, "subTitle", e.target.value)}
                                  placeholder="Description & specs"
                                  className="w-full px-2.5 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] bg-white dark:bg-slate-900"
                                />
                                <input
                                  type="text"
                                  value={item.brands || ""}
                                  onChange={(e) => handleItemChange(item.id, "brands", e.target.value)}
                                  placeholder="Brands / models"
                                  className="w-full px-2.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] text-slate-500 bg-white dark:bg-slate-900"
                                />
                              </div>

                              <div className="col-span-4 md:col-span-1">
                                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Qty</label>
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-900"
                                />
                              </div>

                              <div className="col-span-4 md:col-span-1">
                                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Unit</label>
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-center bg-white dark:bg-slate-900"
                                />
                              </div>

                              <div className="col-span-6 md:col-span-3 bg-amber-50/70 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-200 dark:border-amber-900/50">
                                <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                                  🏢 Company Cost (PKR/Unit)
                                </label>
                                <input
                                  type="number"
                                  value={item.companyUnitCost || 0}
                                  onChange={(e) => handleItemChange(item.id, "companyUnitCost", e.target.value)}
                                  className="w-full px-2 py-1 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200"
                                  placeholder="Wholesale Cost"
                                />
                                <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-mono">
                                  Total Cost: PKR {rowCompanyCost.toLocaleString()}
                                </div>
                              </div>

                              <div className="col-span-6 md:col-span-3 bg-emerald-50/70 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                                <label className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                                  🏷️ Client Price (PKR/Unit)
                                </label>
                                <input
                                  type="text"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                                  className="w-full px-2 py-1 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200"
                                  placeholder="Client Price"
                                />
                                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                                  Total Quote: PKR {formatPkr(item.totalPrice)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  TAB 2: DEDICATED AC/DC WIRING MANAGER (SEPARATE NAME & SIZE)
              ========================================================================= */}
              {editorTab === "wiring" && (
                <div className="space-y-6">
                  {/* Info & Sync Banner */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 rounded-xl mt-0.5">
                        <Zap className="w-5 h-5" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                          Dedicated AC/DC Wiring Manager (Manual Name & Size Inputs)
                        </h4>
                        <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 max-w-2xl">
                          Specify wiring size and wiring brand/name separately for DC Solar Strings and AC Mains. Add custom wiring lines or sync directly into Quotation Table Item #5.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSyncWiringToItem5}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                      title="Sync wiring configuration into Item #5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Sync to Quotation Item #5
                    </button>
                  </div>

                  {/* Primary DC and AC Wiring Configuration Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* DC Solar String Cabling Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                            ⚡ DC Solar String Cabling
                          </h5>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          1500V DC Rated
                        </span>
                      </div>

                      {/* Manual DC Wiring Name (Alag Se) */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          DC Wiring Name / Brand <span className="text-amber-600 font-normal">(Manual Input)</span>
                        </label>
                        <input
                          type="text"
                          value={wiringDetails.dcCableName}
                          onChange={(e) => handleWiringFieldChange("dcCableName", e.target.value)}
                          placeholder="e.g. Pakistan Cables XLPO Solar PV DC Cable"
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                        />
                        {/* Quick Presets for DC Cable Name */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-400 py-0.5">Presets:</span>
                          {["Pakistan Cables XLPO Solar", "Fast Cables Solar PV", "Newage Cables DC Solar", "Universal Cables DC"].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleWiringFieldChange("dcCableName", preset)}
                              className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 rounded-md text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual DC Wiring Size (Alag Se) */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          DC Wiring Size / Cross-Section <span className="text-amber-600 font-normal">(Manual Input)</span>
                        </label>
                        <input
                          type="text"
                          value={wiringDetails.dcCableSize}
                          onChange={(e) => handleWiringFieldChange("dcCableSize", e.target.value)}
                          placeholder="e.g. 1x6mm² Single Core XLPO"
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300"
                        />
                        {/* Quick Presets for DC Cable Size */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-400 py-0.5">Sizes:</span>
                          {["1x4.0mm² XLPO", "1x6.0mm² Single Core", "1x10.0mm² XLPO", "1x16.0mm² Single Core"].map(sz => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleWiringFieldChange("dcCableSize", sz)}
                              className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 rounded-md font-mono text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* DC Cable Length, Cost & Quoted Price */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Length (M)</label>
                          <input
                            type="number"
                            value={wiringDetails.dcCableLength}
                            onChange={(e) => handleWiringFieldChange("dcCableLength", Number(e.target.value))}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">Company Cost</label>
                          <input
                            type="number"
                            value={wiringDetails.dcCableCost}
                            onChange={(e) => handleWiringFieldChange("dcCableCost", Number(e.target.value))}
                            className="w-full px-2 py-1 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-center font-mono font-bold bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">Client Price</label>
                          <input
                            type="number"
                            value={wiringDetails.dcCablePrice}
                            onChange={(e) => handleWiringFieldChange("dcCablePrice", Number(e.target.value))}
                            className="w-full px-2 py-1 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs text-center font-mono font-bold bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* AC Inverter-to-Main Distribution Cabling Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                            🏢 AC Mains Distribution Cabling
                          </h5>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                          600/1000V Armored
                        </span>
                      </div>

                      {/* Manual AC Wiring Name (Alag Se) */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          AC Wiring Name / Brand <span className="text-blue-600 font-normal">(Manual Input)</span>
                        </label>
                        <input
                          type="text"
                          value={wiringDetails.acCableName}
                          onChange={(e) => handleWiringFieldChange("acCableName", e.target.value)}
                          placeholder="e.g. Pakistan Cables 4-Core Armored Copper Cable"
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                        />
                        {/* Quick Presets for AC Cable Name */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-400 py-0.5">Presets:</span>
                          {["Pakistan Cables 4-Core Armored Cu", "Fast Cables 4-Core Cu Feeder", "Newage Cables Armored Cu", "Pioneer Multi-Strand"].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleWiringFieldChange("acCableName", preset)}
                              className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 rounded-md text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual AC Wiring Size (Alag Se) */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          AC Wiring Size / Cross-Section <span className="text-blue-600 font-normal">(Manual Input)</span>
                        </label>
                        <input
                          type="text"
                          value={wiringDetails.acCableSize}
                          onChange={(e) => handleWiringFieldChange("acCableSize", e.target.value)}
                          placeholder="e.g. 4-Core 25mm² Armored Cu"
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300"
                        />
                        {/* Quick Presets for AC Cable Size */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-400 py-0.5">Sizes:</span>
                          {["4-Core 10mm²", "4-Core 16mm² Armored", "4-Core 25mm² Armored Cu", "4-Core 35mm² Armored Cu", "4-Core 50mm² Armored"].map(sz => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleWiringFieldChange("acCableSize", sz)}
                              className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 rounded-md font-mono text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AC Cable Length, Cost & Quoted Price */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Length (M)</label>
                          <input
                            type="number"
                            value={wiringDetails.acCableLength}
                            onChange={(e) => handleWiringFieldChange("acCableLength", Number(e.target.value))}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">Company Cost</label>
                          <input
                            type="number"
                            value={wiringDetails.acCableCost}
                            onChange={(e) => handleWiringFieldChange("acCableCost", Number(e.target.value))}
                            className="w-full px-2 py-1 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-center font-mono font-bold bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">Client Price</label>
                          <input
                            type="number"
                            value={wiringDetails.acCablePrice}
                            onChange={(e) => handleWiringFieldChange("acCablePrice", Number(e.target.value))}
                            className="w-full px-2 py-1 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs text-center font-mono font-bold bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Add Custom Wiring Line Item (Manually Add Wiring Size & Name Alag Se) */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                          ➕ Add Custom Wiring Line Item (Separate Name & Size)
                        </h5>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Manually add additional cables (e.g. Earthing conductor, RS485 comms, battery interlink)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      {/* Wiring Name (Alag Se) */}
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Wiring Name / Label
                        </label>
                        <input
                          type="text"
                          value={customWiringDraft.name}
                          onChange={(e) => setCustomWiringDraft(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Earthing Bare Copper Cable"
                          className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                        />
                      </div>

                      {/* Wiring Size (Alag Se) */}
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Wiring Size / Gauge
                        </label>
                        <input
                          type="text"
                          value={customWiringDraft.size}
                          onChange={(e) => setCustomWiringDraft(prev => ({ ...prev, size: e.target.value }))}
                          placeholder="e.g. 16mm² Pure Cu"
                          className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["16mm²", "25mm²", "35mm²", "70mm²", "2x0.75mm²"].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setCustomWiringDraft(prev => ({ ...prev, size: s }))}
                              className="text-[9px] px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 hover:border-emerald-400 cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Wiring Type */}
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Type
                        </label>
                        <select
                          value={customWiringDraft.type}
                          onChange={(e) => setCustomWiringDraft(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900"
                        >
                          <option value="DC Solar Cable">DC Solar Cable</option>
                          <option value="AC Mains Cable">AC Mains Cable</option>
                          <option value="Earthing Ground Cable">Earthing Ground Cable</option>
                          <option value="RS485 Communication Cable">RS485 Communication</option>
                          <option value="Battery DC Feeder">Battery DC Feeder</option>
                        </select>
                      </div>

                      {/* Qty & Unit */}
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={customWiringDraft.qty}
                          onChange={(e) => setCustomWiringDraft(prev => ({ ...prev, qty: Number(e.target.value) }))}
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-900"
                        />
                      </div>

                      {/* Client Quoted Price */}
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                          Price
                        </label>
                        <input
                          type="number"
                          value={customWiringDraft.clientPrice}
                          onChange={(e) => setCustomWiringDraft(prev => ({ ...prev, clientPrice: Number(e.target.value) }))}
                          className="w-full px-2 py-1.5 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs text-center font-mono font-bold bg-white dark:bg-slate-900"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="md:col-span-2 flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleAddCustomWiring("table")}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                          title="Add as a new row in quotation table"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add as Table Row
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddCustomWiring("merge")}
                          className="w-full py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium text-[10px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition"
                          title="Merge into Item #5 lot"
                        >
                          Merge into Item #5
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of Custom Added Wiring Items (if any) */}
                  {customWiringList.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                      <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-bold text-[11px] text-slate-700 dark:text-slate-300 flex justify-between items-center">
                        <span>Custom Added Wiring Items ({customWiringList.length})</span>
                        <span className="text-[10px] font-normal text-slate-500">Reflected in quotation sheets</span>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {customWiringList.map((cw) => (
                          <div key={cw.id} className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900">
                            <div>
                              <strong className="text-slate-900 dark:text-slate-100">{cw.name}</strong>
                              <span className="text-slate-500 text-[11px] ml-2 font-mono">({cw.size})</span>
                              <span className="text-[10px] px-2 py-0.5 ml-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {cw.type} • {cw.qty} {cw.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                PKR {Number(cw.clientPrice * cw.qty).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleRemoveCustomWiring(cw.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                                title="Remove wiring line"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Active Quotation Sheet Wiring Line Item Preview */}
                  <div className="bg-slate-100/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Currently Reflected on Quotation Page 1 (Item #5)
                      </span>
                      <strong className="text-slate-900 dark:text-slate-100 text-sm">Electrical & AC/DC Wiring: </strong>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
                        DC: {wiringDetails.dcCableName} ({wiringDetails.dcCableSize}) | AC: {wiringDetails.acCableName} ({wiringDetails.acCableSize})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Total Quoted Wiring Price:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-black">
                        PKR {formatPkr((Number(wiringDetails.dcCablePrice) || 0) + (Number(wiringDetails.acCablePrice) || 0))}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  TAB 3: TERMS & CONDITIONS (O&M AND TAXES)
              ========================================================================= */}
              {editorTab === "terms" && (
                <div className="space-y-6">
                  {/* Terms Header Banner */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 rounded-xl mt-0.5">
                        <BookOpen className="w-5 h-5" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                          Project Terms & Conditions (Page 2 Contractual Clauses)
                        </h4>
                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 max-w-2xl">
                          Includes officially mandated <strong>Operation & Maintenance</strong> (1-year free O&M) and <strong>Taxes & Levies</strong> (VAT, GST & Sales Tax included). Modify, add, or reorder clauses as needed.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddTerm}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Clause
                      </button>
                      <button
                        onClick={handleResetTerms}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                        title="Reset terms to standard clauses including O&M and Taxes"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Terms
                      </button>
                    </div>
                  </div>

                  {/* Terms List */}
                  <div className="space-y-3">
                    {companyTerms.map((term, idx) => {
                      const isOm = term.id === "term-om" || term.title?.toLowerCase().includes("operation");
                      const isTax = term.id === "term-tax" || term.title?.toLowerCase().includes("tax");

                      return (
                        <div
                          key={term.id || idx}
                          className={`p-3.5 rounded-2xl border space-y-2 text-xs transition ${
                            isOm
                              ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                              : isTax
                              ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800"
                              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={term.title}
                                onChange={(e) => handleTermChange(term.id, "title", e.target.value)}
                                placeholder="Clause Heading (e.g. Operation & Maintenance:)"
                                className="w-72 max-w-full px-2.5 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                              />
                              {isOm && (
                                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                                  Circled Clause
                                </span>
                              )}
                              {isTax && (
                                <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                                  Tax Mandate
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveTerm(term.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Delete clause"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <textarea
                              rows={2}
                              value={term.desc}
                              onChange={(e) => handleTermChange(term.id, "desc", e.target.value)}
                              placeholder="Clause description..."
                              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 leading-relaxed"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rendered Physical A4 Sheets Backdrop */}
          <div id="printable-quotation" className="printable-area py-8 px-2 sm:px-6 bg-slate-200/70 dark:bg-[#070b14] rounded-3xl border border-slate-300 dark:border-slate-800 space-y-10">
            
            {/* =============================================================
                PAGE 1: COMMERCIAL QUOTATION, SPECS & COST BREAKDOWN
            ============================================================= */}
            {(companyPageView === "all" || companyPageView === 1) && (
              <div className="a4-print-sheet bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-sm p-8 sm:p-12 relative mx-auto max-w-[850px] min-h-[1080px] flex flex-col justify-between select-text">
                {/* Architectural Corner Crop Marks */}
                <div className="absolute top-2.5 left-2.5 text-slate-400 select-none font-mono text-xs leading-none">⌜</div>
                <div className="absolute top-2.5 right-2.5 text-slate-400 select-none font-mono text-xs leading-none">⌝</div>
                <div className="absolute bottom-2.5 left-2.5 text-slate-400 select-none font-mono text-xs leading-none">⌞</div>
                <div className="absolute bottom-2.5 right-2.5 text-slate-400 select-none font-mono text-xs leading-none">⌟</div>

                <div>
                  {/* Header: Company Profile (Left) & Quotation Title/Logo (Right) */}
                  <div className="flex justify-between items-start gap-4">
                    {/* Left: Company Details */}
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        Green Tech Power
                      </h1>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight -mt-0.5">
                        Engineering PVT Ltd
                      </h2>
                      <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 font-medium leading-normal">
                        <p>Office 501 Main Service Road DHA PH II Islamabad.</p>
                        <p>Email: greentechpowereng@gmail.com</p>
                        <p>Phone: +923214183404</p>
                      </div>
                    </div>

                    {/* Right: Circular Logo + QUOTATION + Official Cost Estimate */}
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-emerald-500 bg-white flex items-center justify-center p-0.5 shadow-xs">
                          <img
                            src="/assets/greentech-logo.svg"
                            alt="Green Tech Power"
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.src = "/greentech-logo.png"; }}
                          />
                        </div>
                        <div className="text-right">
                          <h2 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] tracking-wider leading-none">
                            QUOTATION
                          </h2>
                          <p className="text-[11px] text-slate-500 font-semibold mt-1">
                            Official Cost Estimate <span className="text-slate-400 font-normal">|</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thick Horizontal Dark Green Divider Bar */}
                  <div className="w-full h-[3.5px] bg-[#1b4332] my-4 sm:my-5"></div>

                  {/* Metadata 2-Boxes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Left Box: QUOTATION DETAILS */}
                    <div className="border border-slate-400 rounded-xs overflow-hidden">
                      <div className="bg-slate-100 font-bold text-slate-800 text-[11px] px-3 py-1 border-b border-slate-400 tracking-wide uppercase">
                        QUOTATION DETAILS
                      </div>
                      <div className="divide-y divide-slate-200">
                        <div className="grid grid-cols-12 px-3 py-1">
                          <span className="col-span-5 text-slate-600 font-semibold text-[11px]">Quote Number:</span>
                          <span className="col-span-7 font-bold text-slate-900 text-[11px] border-l border-slate-200 pl-2">
                            {companyMeta.quoteNumber}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1">
                          <span className="col-span-5 text-slate-600 font-semibold text-[11px]">Date:</span>
                          <span className="col-span-7 font-medium text-slate-900 text-[11px] border-l border-slate-200 pl-2">
                            {companyMeta.date}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1">
                          <span className="col-span-5 text-slate-600 font-semibold text-[11px]">Valid Until:</span>
                          <span className="col-span-7 font-medium text-slate-900 text-[11px] border-l border-slate-200 pl-2">
                            {companyMeta.validUntil}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1">
                          <span className="col-span-5 text-slate-600 font-semibold text-[11px]">Prepared By:</span>
                          <span className="col-span-7 font-bold text-slate-900 text-[11px] border-l border-slate-200 pl-2">
                            {companyMeta.preparedBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Box: CLIENT & SITE INFO */}
                    <div className="border border-slate-400 rounded-xs overflow-hidden">
                      <div className="bg-slate-100 font-bold text-slate-800 text-[11px] px-3 py-1 border-b border-slate-400 tracking-wide uppercase">
                        CLIENT & SITE INFO
                      </div>
                      <div className="divide-y divide-slate-200">
                        <div className="grid grid-cols-12 px-3 py-1">
                          <span className="col-span-5 text-slate-600 font-semibold text-[11px]">Client Name:</span>
                          <span className="col-span-7 font-bold text-slate-900 text-[11px] border-l border-slate-200 pl-2">
                            {companyMeta.clientName}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1">
                          <span className="col-span-5 text-slate-600 font-semibold text-[11px]">Site Address:</span>
                          <span className="col-span-7 font-medium text-slate-900 text-[11px] border-l border-slate-200 pl-2">
                            {companyMeta.siteAddress}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1">
                          <span className="col-span-5 text-slate-600 font-semibold text-[11px]">Contact No:</span>
                          <span className="col-span-7 font-medium text-slate-900 text-[11px] border-l border-slate-200 pl-2">
                            {companyMeta.contactNo}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1">
                          <span className="col-span-5 text-slate-600 font-semibold text-[11px]">System Size:</span>
                          <span className="col-span-7 font-bold text-slate-900 text-[11px] border-l border-slate-200 pl-2">
                            {companyMeta.systemSize}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Header: | SYSTEM SPECIFICATIONS & COST BREAKDOWN */}
                  <div className="flex items-center gap-2 mt-5 mb-2.5">
                    <div className="w-1.5 h-4 bg-[#1b4332]"></div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      SYSTEM SPECIFICATIONS & COST BREAKDOWN
                    </h3>
                  </div>

                  {/* 8-Item Standard Cost Table */}
                  <div className="overflow-x-auto border border-slate-400">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#1b4332] text-white font-bold text-[10.5px]">
                          <th className="py-2 px-2 border-r border-[#153e2e] text-center w-12">S.NO</th>
                          <th className="py-2 px-3 border-r border-[#153e2e] text-left">ITEM DESCRIPTION</th>
                          <th className="py-2 px-2 border-r border-[#153e2e] text-center w-12">QTY</th>
                          <th className="py-2 px-2 border-r border-[#153e2e] text-center w-14">UNIT</th>
                          <th className="py-2 px-2 border-r border-[#153e2e] text-center w-28">UNIT PRICE (PKR)</th>
                          <th className="py-2 px-2 text-center w-28">TOTAL PRICE (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {companyItems.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-2 px-2 text-center font-bold text-slate-800 border-r border-slate-300 align-top text-[11px]">
                              {row.sNo}
                            </td>
                            <td className="py-2 px-3 text-slate-900 border-r border-slate-300 text-[11px] leading-snug">
                              <span className="font-bold text-slate-900">{row.title} </span>
                              <span className="text-slate-700">{row.subTitle}</span>
                              {row.brands && (
                                <div className="text-slate-600 text-[10px] mt-0.5">{row.brands}</div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center font-medium text-slate-800 border-r border-slate-300 align-top text-[11px]">
                              {row.qty}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-700 border-r border-slate-300 align-top text-[11px]">
                              {row.unit}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-800 border-r border-slate-300 align-top text-[11px]">
                              {row.unitPrice === "Nill" || row.isNill ? (
                                <span className="text-red-600 font-bold border-b border-red-500">Nill</span>
                              ) : (
                                formatPkr(row.unitPrice)
                              )}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 align-top text-[11px]">
                              {row.totalPrice === "Nill" || row.isNill ? (
                                <span className="text-red-600 font-bold border-b border-red-500">Nill</span>
                              ) : (
                                formatPkr(row.totalPrice)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer of Page 1: Footnotes, Subtotal & Grand Total Box */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-4 pt-2 gap-3">
                  <p className="text-[9.5px] text-slate-500 italic max-w-sm leading-tight">
                    * Prices include standard installation and dynamic structural validation. Any additional civil work will be charged separate.
                  </p>

                  <div className="text-right self-end sm:self-auto min-w-[220px]">
                    <div className="text-xs text-slate-700 font-semibold mb-1">
                      Subtotal: {formatPkr(computedSubtotal)}
                    </div>
                    <div className="border-t-2 border-b-2 border-slate-900 py-1.5 px-4 inline-block font-black text-sm text-slate-900 tracking-wide bg-slate-50/50">
                      Grand Total: {formatPkr(computedSubtotal)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================
                PAGE 2: WARRANTY, GUARANTEES, TERMS & CONDITIONS & SIGNATURES
            ============================================================= */}
            {(companyPageView === "all" || companyPageView === 2) && (
              <div className="a4-print-sheet bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-sm p-8 sm:p-12 relative mx-auto max-w-[850px] min-h-[1080px] flex flex-col justify-between select-text">
                {/* Architectural Corner Crop Marks */}
                <div className="absolute top-2.5 left-2.5 text-slate-400 select-none font-mono text-xs leading-none">⌜</div>
                <div className="absolute top-2.5 right-2.5 text-slate-400 select-none font-mono text-xs leading-none">⌝</div>
                <div className="absolute bottom-2.5 left-2.5 text-slate-400 select-none font-mono text-xs leading-none">⌞</div>
                <div className="absolute bottom-2.5 right-2.5 text-slate-400 select-none font-mono text-xs leading-none">⌟</div>

                <div>
                  {/* Section 1: | WARRANTY & GUARANTEES */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-4 bg-[#1b4332]"></div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      WARRANTY & GUARANTEES
                    </h3>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-800 pl-1 leading-normal">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-slate-900">•</span>
                      <div>
                        <strong className="text-slate-900 font-bold">Solar Panels: </strong>
                        <span>10-Year comprehensive product warranty / 25-Year linear power output warranty.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-slate-900">•</span>
                      <div>
                        <strong className="text-slate-900 font-bold">Inverter System: </strong>
                        <span>5-Year standard manufacturer replacement warranty.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-slate-900">•</span>
                      <div>
                        <strong className="text-slate-900 font-bold">Workmanship & Service: </strong>
                        <span>1-Year comprehensive layout and installation warranty.</span>
                      </div>
                    </li>
                  </ul>

                  {/* Section 2: | TERMS & CONDITIONS */}
                  <div className="flex items-center gap-2 mt-10 mb-3">
                    <div className="w-1.5 h-4 bg-[#1b4332]"></div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      TERMS & CONDITIONS
                    </h3>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-800 pl-1 leading-normal">
                    {companyTerms.map((term, index) => (
                      <li key={term.id || index} className="flex items-start gap-2">
                        <span className="font-bold text-slate-900">•</span>
                        <div>
                          <strong className="text-slate-900 font-bold">{term.title} </strong>
                          <span>{term.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dual Authorization Signatures (Bottom of Page 2) */}
                <div className="mt-auto pt-16 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-16">
                  <div>
                    <div className="border-t border-slate-500 pt-2 text-center">
                      <p className="text-xs font-bold text-slate-800">Authorized Signature (Company Stamp)</p>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-500 pt-2 text-center">
                      <p className="text-xs font-bold text-slate-800">Client Acceptance Signature & Date</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          FORMAT B: COMPANY EPC COST & PROFITABILITY ANALYSIS (INTERNAL ONLY)
      ------------------------------------------------------------- */}
      {quotationTemplate === "internal_cost" && (
        <div className="space-y-6">
          {/* Sub-toolbar */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 no-print print:hidden">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Company EPC Costing & Profitability Dashboard
                  <span className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 font-mono px-2 py-0.5 rounded-full font-bold">
                    STRICTLY CONFIDENTIAL
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Wholesale procurement costs, direct execution expenses, gross profits & commercial margins.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsEditorOpen(!isEditorOpen)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isEditorOpen
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditorOpen ? "Close Editor" : "Edit Wholesale Costs & Prices"}
              </button>

              {hasProject && (
                <button
                  onClick={handleSyncWithProject}
                  className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Auto-fill sizing and recalculate from active ERP project"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync from ERP Project
                </button>
              )}

              <button
                onClick={() => setQuotationTemplate("company")}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> View Client Quotation
              </button>

              <button
                onClick={handlePrintQuotation}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                title="Print Internal Cost Audit Sheet for Management Files"
              >
                <Printer className="w-4 h-4" /> Print Internal Cost Sheet
              </button>
            </div>
          </div>

          {/* Interactive Line Item & Wholesale Cost Editor (when open) */}
          {isEditorOpen && (
            <div className="bg-white dark:bg-[#0f172a] border border-amber-300 dark:border-amber-700/60 rounded-3xl p-6 shadow-md space-y-6 no-print print:hidden">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                    <Edit3 className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Wholesale Cost & Quotation Rate Customizer
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Modify company wholesale acquisition costs, client quoted prices, or add new components.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition"
                >
                  <Check className="w-3.5 h-3.5" /> Done Editing
                </button>
              </div>

              {/* Table Items Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Components & Cost Breakdown ({companyItems.length} Items)
                  </h4>
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Component
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {companyItems.map((item) => {
                    const rowCompanyCost = (Number(item.companyUnitCost) || 0) * (Number(item.qty) || 1);
                    const rowClientTotal = typeof item.totalPrice === "number" ? item.totalPrice : Number(String(item.totalPrice).replace(/[^0-9.]/g, "")) || 0;
                    const rowProfit = Math.max(0, rowClientTotal - rowCompanyCost);
                    const rowMargin = rowClientTotal > 0 ? ((rowProfit / rowClientTotal) * 100).toFixed(1) : "0.0";

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                              #{item.sNo}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.title || "Custom Component"}</span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {item.category || "General"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-[11px] font-mono">
                              <span className="text-slate-500">Row Profit: </span>
                              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                                PKR {rowProfit.toLocaleString()} ({rowMargin}%)
                              </strong>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-12 md:col-span-4 space-y-1">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleItemChange(item.id, "title", e.target.value)}
                              placeholder="Component Title"
                              className="w-full px-2.5 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                            />
                            <input
                              type="text"
                              value={item.subTitle}
                              onChange={(e) => handleItemChange(item.id, "subTitle", e.target.value)}
                              placeholder="Description & specs"
                              className="w-full px-2.5 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] bg-white dark:bg-slate-900"
                            />
                            <input
                              type="text"
                              value={item.brands || ""}
                              onChange={(e) => handleItemChange(item.id, "brands", e.target.value)}
                              placeholder="Brands / models"
                              className="w-full px-2.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] text-slate-500 bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div className="col-span-4 md:col-span-1">
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Qty</label>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div className="col-span-4 md:col-span-1">
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Unit</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-center bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div className="col-span-6 md:col-span-3 bg-amber-50/70 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-200 dark:border-amber-900/50">
                            <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                              🏢 Company Cost (PKR/Unit)
                            </label>
                            <input
                              type="number"
                              value={item.companyUnitCost || 0}
                              onChange={(e) => handleItemChange(item.id, "companyUnitCost", e.target.value)}
                              className="w-full px-2 py-1 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200"
                              placeholder="Wholesale Cost"
                            />
                            <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-mono">
                              Total Cost: PKR {rowCompanyCost.toLocaleString()}
                            </div>
                          </div>

                          <div className="col-span-6 md:col-span-3 bg-emerald-50/70 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                            <label className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                              🏷️ Client Price (PKR/Unit)
                            </label>
                            <input
                              type="text"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                              className="w-full px-2 py-1 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200"
                              placeholder="Client Price"
                            />
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                              Total Quote: PKR {formatPkr(item.totalPrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Top Executive KPI Cards (5 Cards Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Card 1: Company Cost */}
            <div className="bg-white dark:bg-[#0f172a] border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Company EPC Cost
                </span>
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
                PKR {formatPkr(computedCompanyCost)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <span>Wholesale & execution:</span>
                <strong className="text-slate-700 dark:text-slate-300 font-mono">Rs {companyCostPerWatt}/W</strong>
              </div>
            </div>

            {/* Card 2: Client Quotation */}
            <div className="bg-white dark:bg-[#0f172a] border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Client Quotation
                </span>
                <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-2">
                PKR {formatPkr(computedSubtotal)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <span>Quoted selling rate:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-mono">Rs {clientPricePerWatt}/W</strong>
              </div>
            </div>

            {/* Card 3: Net Profit */}
            <div className="bg-white dark:bg-[#0f172a] border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  Net Gross Profit
                </span>
                <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono mt-2">
                PKR {formatPkr(computedGrossProfit)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <span>Spread margin:</span>
                <strong className="text-blue-700 dark:text-blue-400 font-mono">+{profitSpreadPerWatt} PKR/W</strong>
              </div>
            </div>

            {/* Card 4: Profit Margin % */}
            <div className="bg-white dark:bg-[#0f172a] border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                  Gross Margin %
                </span>
                <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 font-mono mt-2">
                {computedMarginPct}%
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                <span>Markup on cost:</span>
                <strong className="text-slate-700 dark:text-slate-300 font-mono">{computedMarkupPct}%</strong>
              </div>
            </div>

            {/* Card 5: Project Sizing */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Project System
                </span>
                <span className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg">
                  <Zap className="w-4 h-4" />
                </span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2 truncate" title={companyMeta.systemSize}>
                {companyMeta.systemSize}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-1">
                Client: <strong className="text-slate-700 dark:text-slate-300">{companyMeta.clientName}</strong>
              </div>
            </div>
          </div>

          {/* Active Project Details Card */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Project Code:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {companyMeta.quoteNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Client:</span>
                <strong className="text-slate-900 dark:text-slate-100">{companyMeta.clientName}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Contact:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{companyMeta.contactNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Site Location:</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{companyMeta.siteAddress}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                hasProject ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
              }`}>
                {hasProject ? "● Live Project Synced" : "○ Standalone Estimate"}
              </span>
            </div>
          </div>

          {/* Target Markup Simulator Panel */}
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-600" />
                Target Commercial Markup Simulator
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Click a target markup to instantly calculate recommended client quotes and profit projections based on company wholesale costs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[15, 20, 25, 30, 35].map((pct) => {
                const projectedSelling = Math.round(computedCompanyCost * (1 + pct / 100));
                return (
                  <button
                    key={pct}
                    onClick={() => handleApplyTargetMarkup(pct)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center ${
                      targetMarkupPct === pct
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400"
                    }`}
                  >
                    <span>+{pct}% Markup</span>
                    <span className="text-[10px] font-mono opacity-80">
                      PKR {formatPkr(projectedSelling)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Cost vs Quote Comparison Table */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  Itemized Company Cost vs Client Quotation Comparison
                </h4>
                <p className="text-[11px] text-slate-500">
                  Full financial transparency: Wholesale acquisition cost vs Client billing price per component.
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                {companyItems.length} Total Components
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px]">
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3">Item Specification & Brand</th>
                    <th className="py-2.5 px-2 text-center w-16">Qty</th>
                    <th className="py-2.5 px-2 text-center w-16">Unit</th>
                    <th className="py-2.5 px-3 text-right bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                      Company Unit Cost (PKR)
                    </th>
                    <th className="py-2.5 px-3 text-right bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 font-bold">
                      Company Total Cost (PKR)
                    </th>
                    <th className="py-2.5 px-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200">
                      Client Unit Price (PKR)
                    </th>
                    <th className="py-2.5 px-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-bold">
                      Client Total Price (PKR)
                    </th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      Gross Profit (PKR)
                    </th>
                    <th className="py-2.5 px-3 text-center w-20">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {companyItems.map((item) => {
                    const rowCompanyCost = (Number(item.companyUnitCost) || 0) * (Number(item.qty) || 1);
                    const rowClientTotal = typeof item.totalPrice === "number" ? item.totalPrice : Number(String(item.totalPrice).replace(/[^0-9.]/g, "")) || 0;
                    const rowProfit = Math.max(0, rowClientTotal - rowCompanyCost);
                    const rowMargin = rowClientTotal > 0 ? ((rowProfit / rowClientTotal) * 100).toFixed(1) : "0.0";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-sans font-bold">
                          {item.sNo}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400">{item.subTitle}</div>
                          {item.brands && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{item.brands}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-800 dark:text-slate-200">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500 font-sans">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-800 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">
                          {item.companyUnitCost === "Nill" || item.isNillCost ? "Nill" : formatPkr(item.companyUnitCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-900 dark:text-amber-200 bg-amber-50/30 dark:bg-amber-950/20">
                          {item.companyTotalCost === "Nill" || item.isNillCost ? "Nill" : formatPkr(item.companyTotalCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-800 dark:text-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10">
                          {item.unitPrice === "Nill" || item.isNill ? "Nill" : formatPkr(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20">
                          {item.totalPrice === "Nill" || item.isNill ? "Nill" : formatPkr(item.totalPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          +{formatPkr(rowProfit)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            Number(rowMargin) >= 25 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                            Number(rowMargin) > 0 ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {rowMargin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold border-t-2 border-slate-300 dark:border-slate-600 font-mono">
                    <td colSpan={4} className="py-3 px-3 text-right font-sans font-bold text-slate-900 dark:text-slate-100 uppercase">
                      Total Project Commercials:
                    </td>
                    <td className="py-3 px-3 text-right text-amber-900 dark:text-amber-200">
                      —
                    </td>
                    <td className="py-3 px-3 text-right text-amber-900 dark:text-amber-200 text-sm font-black bg-amber-100/50 dark:bg-amber-950/40">
                      PKR {formatPkr(computedCompanyCost)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-900 dark:text-emerald-200">
                      —
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-900 dark:text-emerald-200 text-sm font-black bg-emerald-100/50 dark:bg-emerald-950/40">
                      PKR {formatPkr(computedSubtotal)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700 dark:text-blue-400 text-sm font-black">
                      +PKR {formatPkr(computedGrossProfit)}
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-black text-indigo-700 dark:text-indigo-400">
                      {computedMarginPct}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Cost Category Distribution Progress Bars */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Company Procurement & Execution Cost Distribution
                </h4>
                <p className="text-[11px] text-slate-500">
                  Breakdown of where capital is expended across physical equipment and field services.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                100% = PKR {formatPkr(computedCompanyCost)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {[
                { label: "Solar PV Modules", amount: categoryCosts.pv, color: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
                { label: "Inverters & Electronics", amount: categoryCosts.inverter, color: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
                { label: "Battery Storage", amount: categoryCosts.battery, color: "bg-purple-500", text: "text-purple-700 dark:text-purple-300" },
                { label: "Structure & Civil BOS", amount: categoryCosts.structure, color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
                { label: "Electrical & AC/DC Cabling", amount: categoryCosts.wiring, color: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
                { label: "Installation Labor & Liaison", amount: categoryCosts.labor, color: "bg-slate-600", text: "text-slate-700 dark:text-slate-300" }
              ].map((cat, idx) => {
                const pct = computedCompanyCost > 0 ? ((cat.amount / computedCompanyCost) * 100).toFixed(1) : "0.0";
                return (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.label}</span>
                      <span className={`font-mono font-bold ${cat.text}`}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      PKR {formatPkr(cat.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physical Printable A4 Sheet for Internal EPC Cost Audit (when printing from this tab) */}
          <div id="printable-quotation" className="printable-area hidden print:block space-y-8">
            <div className="a4-print-sheet bg-white text-slate-900 border border-slate-300 shadow-none rounded-sm p-8 sm:p-12 relative mx-auto max-w-[850px] min-h-[1080px] flex flex-col justify-between select-text">
              <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-4 border-b-2 border-[#1b4332] pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      Green Tech Power Engineering PVT Ltd
                    </h1>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Office 501 Main Service Road DHA PH II Islamabad • greentechpowereng@gmail.com
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-1 rounded border border-amber-300 uppercase">
                      CONFIDENTIAL INTERNAL AUDIT
                    </span>
                    <h2 className="text-xl font-black text-[#1e3a5f] mt-1">EPC COST & PROFIT SHEET</h2>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs my-4 bg-slate-50 p-3 rounded border border-slate-300">
                  <div>
                    <p><strong>Quote / Project Code:</strong> {companyMeta.quoteNumber}</p>
                    <p><strong>Client:</strong> {companyMeta.clientName}</p>
                    <p><strong>Site:</strong> {companyMeta.siteAddress}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>System Size:</strong> {companyMeta.systemSize}</p>
                    <p><strong>Date:</strong> {companyMeta.date}</p>
                    <p><strong>Prepared By:</strong> {companyMeta.preparedBy}</p>
                  </div>
                </div>

                {/* Internal Comparison Table */}
                <div className="overflow-x-auto border border-slate-400 mt-4">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1b4332] text-white font-bold text-[10.5px]">
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2">COMPONENT</th>
                        <th className="p-2 text-center w-12">QTY</th>
                        <th className="p-2 text-right">EPC COST</th>
                        <th className="p-2 text-right">CLIENT QUOTE</th>
                        <th className="p-2 text-right">PROFIT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {companyItems.map((item) => {
                        const rowCost = (Number(item.companyUnitCost) || 0) * (Number(item.qty) || 1);
                        const rowTotal = typeof item.totalPrice === "number" ? item.totalPrice : Number(String(item.totalPrice).replace(/[^0-9.]/g, "")) || 0;
                        const rowProfit = Math.max(0, rowTotal - rowCost);
                        return (
                          <tr key={item.id} className="text-[11px]">
                            <td className="p-2 text-center font-bold">{item.sNo}</td>
                            <td className="p-2 font-medium">{item.title} <span className="text-slate-600">{item.subTitle}</span></td>
                            <td className="p-2 text-center font-mono">{item.qty} {item.unit}</td>
                            <td className="p-2 text-right font-mono">{formatPkr(rowCost)}</td>
                            <td className="p-2 text-right font-mono">{formatPkr(rowTotal)}</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-700">+{formatPkr(rowProfit)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-xs font-mono">
                        <td colSpan={3} className="p-2 text-right font-bold uppercase">TOTALS:</td>
                        <td className="p-2 text-right text-amber-900 font-black">PKR {formatPkr(computedCompanyCost)}</td>
                        <td className="p-2 text-right text-emerald-900 font-black">PKR {formatPkr(computedSubtotal)}</td>
                        <td className="p-2 text-right text-blue-900 font-black">+PKR {formatPkr(computedGrossProfit)} ({computedMarginPct}%)</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-300 pt-4 mt-auto text-[10px] text-slate-500 flex justify-between">
                <span>Green Tech Power Engineering Management Reporting</span>
                <span>Authorized Signatory: _________________________</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          FORMAT B: EPC DETAILED TECHNICAL PROPOSAL (3 PAGES)
      ------------------------------------------------------------- */}
      {quotationTemplate === "epc" && (
        <>
          {/* Top Header Controls */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-wrap justify-between items-center gap-4 no-print print:hidden">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm bg-white flex items-center justify-center shrink-0">
                  <img
                    src="/assets/greentech-logo.svg"
                    alt="Green Tech Power"
                    className="w-full h-full object-cover block"
                    onError={(e) => { e.target.src = "/greentech-logo.svg"; }}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Official EPC Solar Proposal & Turnkey Quotation
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      GREEN TECH EPC CONTRACT
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    Turnkey commercial quotation, itemized BOQ, and 25-year financial feasibility for <strong className="text-emerald-700">{clientName}</strong> ({totalCapacityKw.toFixed(2)} kWp DC)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Page Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 text-xs font-semibold">
                <button
                  onClick={() => setActivePage("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${activePage === "all" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  All 3 Pages
                </button>
                <button
                  onClick={() => setActivePage(1)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${activePage === 1 ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Page 1: Commercial
                </button>
                <button
                  onClick={() => setActivePage(2)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${activePage === 2 ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Page 2: BOQ & SLD
                </button>
                <button
                  onClick={() => setActivePage(3)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${activePage === 3 ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Page 3: Yield & Approval
                </button>
              </div>

              {/* Toggle Feasibility & Tariff Customizer */}
              <button
                onClick={() => setIsSimSettingsOpen(!isSimSettingsOpen)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isSimSettingsOpen
                    ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                }`}
                title="Configure DISCO tariff, city irradiance, and performance ratio"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isSimSettingsOpen ? "Close Simulation" : "Feasibility Settings"}</span>
              </button>

              {/* Native 3-Page Browser Print */}
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Print all 3 pages or save to PDF via browser print"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print 3 Pages</span>
              </button>

              {/* Export to Official Vector PDF Button */}
              <button
                onClick={handleDownloadEPCProposalPDF}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Generate and download 3-page vector PDF proposal"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Interactive Feasibility & Simulation Controls Panel */}
          {isSimSettingsOpen && (
            <div className="bg-white border-2 border-emerald-500/40 p-5 rounded-3xl shadow-md space-y-4 no-print print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Engineering Feasibility & DISCO Tariff Customizer
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded font-bold">
                        LIVE SIMULATION
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Adjust DISCO grid rate, Pakistani irradiation zone, and performance ratio (PR%) for real-time yield and financial ROI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSimSettingsOpen(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  ✕ Close Panel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. DISCO Grid Electricity Tariff */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span>DISCO Grid Tariff:</span>
                    <span className="text-emerald-700 font-mono font-bold text-xs">PKR {gridTariffPkr} / kWh</span>
                  </label>
                  <input
                    type="range"
                    min="35"
                    max="85"
                    step="1"
                    value={gridTariffPkr}
                    onChange={(e) => setGridTariffPkr(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Off-Peak (Rs 45)</span>
                    <span>Avg (Rs 58)</span>
                    <span>Peak (Rs 75+)</span>
                  </div>
                </div>

                {/* 2. City / Solar Irradiance Zone */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span>City & DISCO Region:</span>
                    <span className="text-emerald-700 font-mono font-bold text-xs">{specificYield} kWh/kWp</span>
                  </label>
                  <select
                    value={solarCity}
                    onChange={(e) => setSolarCity(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl p-2 text-slate-800 focus:outline-emerald-500 cursor-pointer"
                  >
                    {Object.entries(CITY_YIELD_MAP).map(([city, data]) => (
                      <option key={city} value={city}>
                        {city} ({data.disco}) - {data.specificYield} kWh/kWp/yr
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block">
                    SolarGIS solar irradiance benchmark for {solarCity}
                  </span>
                </div>

                {/* 3. Performance Ratio (PR %) */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span>System PR (%):</span>
                    <span className="text-emerald-700 font-mono font-bold text-xs">{performanceRatio}% PR</span>
                  </label>
                  <input
                    type="range"
                    min="75"
                    max="86"
                    step="0.5"
                    value={customPr}
                    onChange={(e) => setCustomPr(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Standard (78%)</span>
                    <span>Tier-1 (81.5%)</span>
                    <span>Optimal (84%)</span>
                  </div>
                </div>

                {/* 4. Instant Output Summary */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">Simulated Year-1 Savings:</span>
                  <div className="text-xl font-black text-emerald-800 font-mono">
                    PKR {firstYearSavingsPkr.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-700 flex justify-between pt-1 border-t border-emerald-200">
                    <span>Payback: <strong>{paybackYears} yrs</strong></span>
                    <span>LCOE: <strong>Rs {lcoePkr}/kWh</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Printable Proposal Area */}
          <div id="printable-quotation" className="printable-area space-y-8">

      {/* =========================================================================
          PAGE 1: COMMERCIAL & EXECUTIVE QUOTATION SUMMARY
      ========================================================================= */}
      {(activePage === "all" || activePage === 1) && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                Page 1: Commercial & Executive Quotation Summary
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-emerald-50 text-emerald-800 font-mono font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Performance Ratio: {performanceRatio}% PR
              </span>
              <span className="text-xs text-emerald-800 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Ref: {projectCode}
              </span>
            </div>
          </div>

          {/* Client & System Snapshot Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Client Identity & Location */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
              <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Client Identification & Site Coordinates
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Corporate Client:</span>
                  <strong className="text-slate-900 text-xs">{clientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">CNIC / NTN:</span>
                  <strong className="font-mono text-slate-900 text-xs">{clientCnic}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 text-[10px] block font-medium">Site Physical Address:</span>
                  <span className="text-slate-900">{siteAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Utility Sub-Division:</span>
                  <strong className="text-amber-800 font-bold">{subDivision}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Proposal Date:</span>
                  <span className="text-slate-700 font-mono">{dealDate}</span>
                </div>

                {/* Point 1: Coordinates & Google Location */}
                <div className="col-span-2 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-medium">GPS Coordinates:</span>
                    <strong className="text-emerald-700 font-mono text-xs">
                      {gpsDisplay}
                    </strong>
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition"
                  >
                    <MapPin className="w-3 h-3 text-rose-500" /> Open in Google Maps <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Point 2: Usable Installation Area */}
                <div className="col-span-2 pt-1 flex items-center justify-between text-slate-600">
                  <span>Usable Installation Area:</span>
                  <span className="text-slate-900 font-mono font-bold">
                    {usableAreaSqFt > 0 ? `${usableAreaSqFt.toLocaleString()} sq ft (${usableAreaSqM.toLocaleString()} m²)` : "Awaiting Survey Measurement"}
                    <span className="ml-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {areaMode === "manual" ? "Manual Measurement" : "Satellite CAD Photogrammetry"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* System Sizing & Hardware */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
              <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> System Sizing & Technical Hardware
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Total DC Capacity:</span>
                  <strong className="text-emerald-700 text-sm font-mono">
                    {totalCapacityKw > 0 ? `${totalCapacityKw.toFixed(2)} kWp DC` : "0.00 kWp DC"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Estimated AC Output:</span>
                  <strong className="text-emerald-700 text-sm font-mono">
                    {totalCapacityKw > 0 ? `${Math.round(totalCapacityKw * 0.92)} kW AC` : "0 kW AC"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Tier-1 PV Modules:</span>
                  <strong className="text-slate-900">{panelBrand} {activeModuleWattage}W</strong>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    ({moduleCount} Modules • {panelType})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Inverter System:</span>
                  <strong className="text-slate-900">{inverterModel}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Mounting Structure:</span>
                  <span className="text-slate-800 font-bold">{structureType} HDG 80µm</span>
                  <span className="text-[10px] text-slate-500 block">
                    Tilt: {tiltAngle}° | Azimuth: {azimuthDirection}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Battery Storage (BESS):</span>
                  <span className="text-slate-700">
                    {hasBattery ? `${batteryBrand} ${batteryType} (${batteryCapacityKwh} kWh)` : "Grid-Tied (No Battery)"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Cabling Infrastructure:</span>
                  <span className="text-slate-700">{cableBrand} ({dcCableSize})</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-medium">Net-Metering & Earthing:</span>
                  <span className="text-emerald-700 font-bold">Bi-directional + &lt;2.5Ω Ground Pit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Turnkey Quotation & Payment Milestones */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Turnkey EPC Contract Price</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-0.5">
                  PKR {turnkeyContractPrice.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Per Watt Turnkey Rate</span>
                <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
                  PKR {pricePerWatt} / Watt DC
                </div>
              </div>
            </div>

            {/* 3 Payment Milestones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-xs">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-emerald-800">1. Advance (20%)</span>
                  <span className="font-mono text-slate-900">PKR {advancePkr.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Payable with Signed Contract / Letter of Intent (LOI) to initiate procurement and engineering approval.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-xs">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-emerald-800">2. Delivery (60%)</span>
                  <span className="font-mono text-slate-900">PKR {deliveryPkr.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Payable upon complete arrival of Tier-1 solar modules, inverters, and mounting frames at client site.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-xs">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-emerald-800">3. Energization (20%)</span>
                  <span className="font-mono text-slate-900">PKR {commissioningPkr.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Payable after DISCO bi-directional net meter installation, testing, and successful grid commissioning.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 2: ENGINEERING BOQ, STRUCTURE SCHEMATICS & AUTOCAD SLD SPECS
      ========================================================================= */}
      {(activePage === "all" || activePage === 2) && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                Page 2: Itemized BOQ, Structural Engineering & AutoCAD SLD
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {includeSld && (
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-mono font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> AutoCAD .dwg / .dxf SLD Included
                </span>
              )}
              <span className="text-xs text-emerald-800 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                IEC 60364-7-712 Compliant
              </span>
            </div>
          </div>

          {/* Itemized BOQ Table (Reflecting all points 1 to 13) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Component Description & Brand</th>
                  <th className="px-4 py-3 text-center">Qty / Rating</th>
                  <th className="px-4 py-3 text-right">Standard / Specs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                {/* 1. PV Modules */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">PV Modules</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">{panelBrand} {panelModel} ({activeModuleWattage}W)</strong>
                    <span className="text-[10px] text-slate-500">{panelType}, SMBB half-cell technology, PID/LID resistant</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    {moduleCount > 0 ? `${moduleCount} Panels` : "0 Panels"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">IEC 61215 / 61730</td>
                </tr>

                {/* 2. Inverters */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">Inverters</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">{inverterModel}</strong>
                    <span className="text-[10px] text-slate-500">High-efficiency IP66 multi-MPPT string inverter with AFCI arc-fault protection</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    {inverterQty} Unit(s)
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">98.8% Max Efficiency</td>
                </tr>

                {/* 3. Mounting Structure */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">Structure</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">{structureType} (Hot-Dip Galvanized HDG 80µm)</strong>
                    <span className="text-[10px] text-slate-500">
                      Front: {frontHeightMm}mm | Back: {backHeightMm}mm | Tilt: {tiltAngle}° | Azimuth: {azimuthDirection}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    {totalCapacityKw > 0 ? `${totalCapacityKw.toFixed(1)} kWp` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">120-150 km/h Wind Rated</td>
                </tr>

                {/* 4. Battery Storage (if selected) */}
                {hasBattery && (
                  <tr>
                    <td className="px-4 py-3 font-bold text-emerald-800">Battery Storage</td>
                    <td className="px-4 py-3">
                      <strong className="text-slate-900 block">{batteryBrand} {batteryType}</strong>
                      <span className="text-[10px] text-slate-500">Modular lithium-ion LFP energy storage with integrated BMS</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                      {batteryCapacityKwh} kWh
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">6,000+ Cycles (90% DoD)</td>
                  </tr>
                )}

                {/* 5. DC Cables */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">DC Cables</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">{cableBrand} {dcCableSize}</strong>
                    <span className="text-[10px] text-slate-500">Tinned copper, electron-beam cross-linked polyolefin, UV and ozone resistant</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    {dcCableLength > 0 ? `${dcCableLength} Meters` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">EN 50618 (1500V DC)</td>
                </tr>

                {/* 6. AC Cables */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">AC Cables</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">{cableBrand} {acCableSize}</strong>
                    <span className="text-[10px] text-slate-500">Low-tension copper heavy armored power cable for main inverter to LT panel run</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    {acCableLength > 0 ? `${acCableLength} Meters` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">BS 5467 / IEC 60502</td>
                </tr>

                {/* 7. Accessories & Switchgear */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">Accessories</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">{dcBreaker} DC Breakers & {acBreaker} AC Switchgear</strong>
                    <span className="text-[10px] text-slate-500">{spdBrand} surge protection, {safetyDisconnect} emergency lockable rotary switch</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    1 Complete Set
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">IP65 Weatherproof DB</td>
                </tr>

                {/* 8. Earthing Package (Point 7 of Page 3: Earthing input option as one Job) */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">Earthing Package</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">Chemical Grounding Pit & Lightning Protection (One Job)</strong>
                    <span className="text-[10px] text-slate-500">Pure electrolytic copper bonded rods with low-resistivity bentonite compound (&lt;2.5Ω)</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    1 Complete Job
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold">&lt; 2.5 Ohms Verified</td>
                </tr>

                {/* 9. Civil Foundation Works */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">Civil Works</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">C25/30 Concrete Ballasts & Chemical Anchor Fastening</strong>
                    <span className="text-[10px] text-slate-500">Non-penetrative civil blocks for RCC roofs or chemical expansion bolts into purlins</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    1 Complete Lot
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">Structural Seal</td>
                </tr>

                {/* 10. Turnkey Installation & Commissioning */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">Installation</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">Mechanical Assembly, DC/AC Cabling & Commissioning</strong>
                    <span className="text-[10px] text-slate-500">Turnkey engineering execution conforming to IEEE and AEDB certified installation protocols</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    1 Complete Job
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">AEDB Certified</td>
                </tr>

                {/* 11. Net-Metering & DISCO Synchronization */}
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-800">Net-Metering</td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">DISCO Bi-Directional 3-Phase Green Meter & NEPRA License</strong>
                    <span className="text-[10px] text-slate-500">Complete documentation, load flow study, DISCO testing & bidirectional meter installation</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    1 Job Complete
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold">NEPRA Approved</td>
                </tr>

                {/* 12. AutoCAD SLD Package */}
                {includeSld && (
                  <tr>
                    <td className="px-4 py-3 font-bold text-emerald-800">AutoCAD SLD</td>
                    <td className="px-4 py-3">
                      <strong className="text-slate-900 block">Single Line Diagram (SLD) in AutoCAD .dwg / .dxf Format</strong>
                      <span className="text-[10px] text-slate-500">Multi-string electrical architecture, cable sizing chart, and protection schematics</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                      1 Drawing Set
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-semibold">AutoCAD 2026 Ready</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Visual 3D Structure Schematic & AutoCAD SLD Preview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Structural Schematic & 3D AI Render Preview */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      Structure Elevation & 3D Model
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${currentStructureConfig.badgeColor}`}>
                        {currentStructureConfig.badge}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      ASTM A123 HDG Steel • Hot-Dip Galvanized ≥ 80µm
                    </p>
                  </div>
                </div>

                {/* 2D CAD vs 3D AI Render Mode Toggle */}
                <div className="flex items-center p-0.5 bg-slate-200/80 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setStructureViewMode("cad2d")}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                      structureViewMode === "cad2d"
                        ? "bg-white text-emerald-800 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Sliders className="w-3 h-3" /> 2D CAD
                  </button>
                  <button
                    type="button"
                    onClick={() => setStructureViewMode("render3d")}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                      structureViewMode === "render3d"
                        ? "bg-white text-emerald-800 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" /> 3D AI Render
                  </button>
                </div>
              </div>

              {/* Structure Selection Tabs (L1, L2, L3, Custom Carport) */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-xs">
                {Object.values(STRUCTURE_CONFIGS).map(cfg => (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => setSelectedStructureId(cfg.id)}
                    className={`px-2 py-1.5 rounded-lg text-center font-semibold transition-all ${
                      selectedStructureId === cfg.id
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[11px] leading-tight">{cfg.shortTitle}</span>
                    <span className={`block text-[9px] font-mono opacity-80 ${selectedStructureId === cfg.id ? "text-emerald-100" : "text-slate-400"}`}>
                      {cfg.frontHeightMm}mm
                    </span>
                  </button>
                ))}
              </div>

              {/* Visual Display: 2D CAD SVG or 3D AI Render */}
              <div className="h-48 bg-white rounded-xl border border-slate-200 relative overflow-hidden shadow-2xs flex items-center justify-center">
                {structureViewMode === "render3d" ? (
                  /* 3D Photorealistic AI Architectural Render */
                  <div className="relative w-full h-full group">
                    <img
                      src={currentStructureConfig.renderImage}
                      alt={currentStructureConfig.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-between p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-emerald-600/90 backdrop-blur-md text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                          <Sparkles className="w-3 h-3 text-amber-300" /> AI Architectural 3D Simulation
                        </span>
                        <span className="text-[10px] bg-slate-900/80 backdrop-blur-md text-slate-200 font-mono px-2 py-0.5 rounded border border-white/10">
                          {currentStructureConfig.shortTitle}
                        </span>
                      </div>
                      <div>
                        <h5 className="text-white font-bold text-xs drop-shadow-sm">{currentStructureConfig.name}</h5>
                        <p className="text-emerald-300 text-[10px] font-medium drop-shadow-sm flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> {currentStructureConfig.clearanceLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Dynamic 2D CAD Vector Schematic SVG with Headroom / Vehicle Scale */
                  <svg viewBox="0 0 420 180" className="w-full h-full select-none">
                    <defs>
                      <pattern id="concreteHatchSub" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="1" />
                      </pattern>
                      <marker id="dimArrowBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
                      </marker>
                    </defs>

                    {/* Finish Floor / Ground Level */}
                    <line x1="20" y1="150" x2="400" y2="150" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 3" />
                    <text x="345" y="163" fill="#475569" fontSize="8.5" fontFamily="monospace" fontWeight="bold">Roof / Base Slab</text>

                    {/* Concrete Plinths */}
                    <rect x="95" y="150" width="30" height="15" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="1" />
                    <rect x="95" y="150" width="30" height="15" fill="url(#concreteHatchSub)" opacity="0.7" rx="1" />
                    <rect x="245" y="150" width="34" height="15" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="1" />
                    <rect x="245" y="150" width="34" height="15" fill="url(#concreteHatchSub)" opacity="0.7" rx="1" />

                    {/* Dynamic Coordinates based on Structure Type */}
                    {(() => {
                      const ground = 150;
                      const fX = 110;
                      const rX = 262;

                      // Dynamic SVG Heights based on configuration
                      let fH = 40;
                      let rH = 80;
                      if (selectedStructureId === "L1") { fH = 20; rH = 46; }
                      else if (selectedStructureId === "L2") { fH = 38; rH = 82; }
                      else if (selectedStructureId === "L3") { fH = 75; rH = 115; }
                      else if (selectedStructureId === "CUSTOM") { fH = 84; rH = 125; }

                      const fY = ground - fH;
                      const rY = ground - rH;

                      // Rafter overhang
                      const angle = Math.atan2(fY - rY, rX - fX);
                      const cos = Math.cos(angle);
                      const sin = Math.sin(angle);
                      const startX = fX - 35 * cos;
                      const startY = fY + 35 * sin;
                      const endX = rX + 35 * cos;
                      const endY = rY - 35 * sin;

                      return (
                        <g>
                          {/* Front leg */}
                          <line x1={fX} y1={ground} x2={fX} y2={fY} stroke="#0284c7" strokeWidth="4.5" strokeLinecap="round" />
                          <circle cx={fX} cy={ground} r="3" fill="#0369a1" />

                          {/* Back leg */}
                          <line x1={rX} y1={ground} x2={rX} y2={rY} stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                          <circle cx={rX} cy={ground} r="3" fill="#0369a1" />

                          {/* Diagonal Wind Braces */}
                          <line x1={fX} y1={ground} x2={(fX + rX) / 2} y2={(fY + rY) / 2} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                          <line x1={(fX + rX) / 2} y1={(fY + rY) / 2} x2={rX} y2={ground} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />

                          {/* Horizontal Tie Beam for L3 & Custom */}
                          {(selectedStructureId === "L3" || selectedStructureId === "CUSTOM") && (
                            <line x1={fX} y1={ground - 22} x2={rX} y2={ground - 22} stroke="#64748b" strokeWidth="2" strokeDasharray="2 2" />
                          )}

                          {/* Main Galvanized Steel Rafter */}
                          <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#047857" strokeWidth="5.5" strokeLinecap="round" />

                          {/* Solar PV Modules mounted on rafter */}
                          <line x1={startX + 8} y1={startY - 6} x2={startX + 65} y2={startY - 6 - 57 * sin} stroke="#0f172a" strokeWidth="7" strokeLinecap="butt" />
                          <line x1={startX + 8} y1={startY - 6} x2={startX + 65} y2={startY - 6 - 57 * sin} stroke="#38bdf8" strokeWidth="1" />
                          
                          <line x1={startX + 75} y1={startY - 6 - 67 * sin} x2={startX + 132} y2={startY - 6 - 124 * sin} stroke="#0f172a" strokeWidth="7" strokeLinecap="butt" />
                          <line x1={startX + 75} y1={startY - 6 - 67 * sin} x2={startX + 132} y2={startY - 6 - 124 * sin} stroke="#38bdf8" strokeWidth="1" />

                          {/* Dimension H1 leader */}
                          <line x1={fX - 25} y1={ground} x2={fX - 25} y2={fY} stroke="#0284c7" strokeWidth="1" markerStart="url(#dimArrowBlue)" markerEnd="url(#dimArrowBlue)" />
                          <text x={fX - 28} y={(ground + fY) / 2 + 3} fill="#0369a1" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                            H1:{frontHeightMm}mm
                          </text>

                          {/* Dimension H2 leader */}
                          <line x1={rX + 25} y1={ground} x2={rX + 25} y2={rY} stroke="#0284c7" strokeWidth="1" markerStart="url(#dimArrowBlue)" markerEnd="url(#dimArrowBlue)" />
                          <text x={rX + 28} y={(ground + rY) / 2 + 3} fill="#0369a1" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                            H2:{backHeightMm}mm
                          </text>

                          {/* Tilt Angle Arc */}
                          <line x1={rX} y1={rY} x2={rX - 35} y2={rY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                          <path d={`M ${rX - 22} ${rY} A 22 22 0 0 1 ${rX - 18} ${rY + 12}`} fill="none" stroke="#d97706" strokeWidth="1.5" />
                          <text x={rX - 38} y={rY + 14} fill="#b45309" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                            θ={tiltAngle}°
                          </text>

                          {/* SCALE SILHOUETTES */}
                          {/* L3 Walkway: Human figure silhouette walking underneath with headroom leader */}
                          {selectedStructureId === "L3" && (
                            <g transform="translate(165, 90)">
                              {/* Human head */}
                              <circle cx="12" cy="8" r="4.5" fill="#0284c7" />
                              {/* Torso */}
                              <path d="M 7 15 L 17 15 L 15 34 L 9 34 Z" fill="#0284c7" />
                              {/* Legs */}
                              <line x1="10" y1="34" x2="8" y2="58" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                              <line x1="14" y1="34" x2="16" y2="58" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                              {/* Arms */}
                              <line x1="7" y1="17" x2="4" y2="35" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                              <line x1="17" y1="17" x2="20" y2="35" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                              {/* Headroom arrow */}
                              <line x1="28" y1="-8" x2="28" y2="58" stroke="#047857" strokeWidth="1" strokeDasharray="2 2" />
                              <text x="32" y="16" fill="#047857" fontSize="8" fontFamily="monospace" fontWeight="bold">7.0 ft (2.1m)</text>
                              <text x="32" y="27" fill="#065f46" fontSize="7" fontFamily="sans-serif">Walkable Headroom</text>
                            </g>
                          )}

                          {/* CUSTOM Carport: Parked vehicle silhouette underneath with clearance leader */}
                          {selectedStructureId === "CUSTOM" && (
                            <g transform="translate(135, 98)">
                              {/* SUV car body */}
                              <path d="M 5 36 L 16 22 L 52 22 L 68 28 L 84 30 L 84 44 L 5 44 Z" fill="#d97706" opacity="0.85" />
                              {/* Wheels */}
                              <circle cx="22" cy="46" r="6" fill="#0f172a" />
                              <circle cx="22" cy="46" r="3" fill="#cbd5e1" />
                              <circle cx="68" cy="46" r="6" fill="#0f172a" />
                              <circle cx="68" cy="46" r="3" fill="#cbd5e1" />
                              {/* Windows */}
                              <path d="M 20 25 L 34 25 L 34 33 L 15 33 Z" fill="#ffffff" opacity="0.9" />
                              <path d="M 37 25 L 50 25 L 55 33 L 37 33 Z" fill="#ffffff" opacity="0.9" />
                              {/* Vehicle clearance indicator */}
                              <line x1="92" y1="-12" x2="92" y2="44" stroke="#b45309" strokeWidth="1" strokeDasharray="2 2" />
                              <text x="96" y="10" fill="#b45309" fontSize="8" fontFamily="monospace" fontWeight="bold">8.0 ft (2.4m)</text>
                              <text x="96" y="21" fill="#92400e" fontSize="7" fontFamily="sans-serif">Drive-In SUV Space</text>
                            </g>
                          )}

                          {/* L2 Standard: Roof drainage clearance callout */}
                          {selectedStructureId === "L2" && (
                            <g transform="translate(155, 118)">
                              <line x1="0" y1="0" x2="0" y2="30" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
                              <text x="5" y="14" fill="#0369a1" fontSize="8" fontFamily="monospace" fontWeight="bold">450mm Drainage Clearance</text>
                              <text x="5" y="24" fill="#64748b" fontSize="7" fontFamily="sans-serif">Prevents Rain Waterlogging</text>
                            </g>
                          )}

                          {/* L1 Flush: Low profile callout */}
                          {selectedStructureId === "L1" && (
                            <g transform="translate(145, 125)">
                              <text x="5" y="12" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold">200mm Low-Drag Profile</text>
                              <text x="5" y="21" fill="#64748b" fontSize="7" fontFamily="sans-serif">Optimal for High-Wind Sheds</text>
                            </g>
                          )}
                        </g>
                      );
                    })()}
                  </svg>
                )}
              </div>

              {/* Dynamic KPI Footer */}
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block">Front H1</span>
                    <strong className="text-slate-900 font-mono text-xs">{frontHeightMm} mm</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block">Back H2</span>
                    <strong className="text-slate-900 font-mono text-xs">{backHeightMm} mm</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block">Tilt / Azimuth</span>
                    <strong className="text-slate-900 font-mono text-xs">{tiltAngle}° S</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block">Wind Rating</span>
                    <strong className="text-emerald-700 font-mono font-bold text-xs">{windResistance}</strong>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-700 shadow-2xs">
                  <span className="text-slate-500 font-medium">Clearance Utility:</span>
                  <strong className="text-emerald-800 font-semibold">{currentStructureConfig.clearanceLabel}</strong>
                </div>
              </div>
            </div>

            {/* AutoCAD Single Line Diagram (SLD) Interactive Engineering Canvas & DXF Downloader */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Cpu className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      AutoCAD Single Line Diagram (SLD) Schematic
                      <span className="text-[9px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                        NEPRA SDO Ready
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      IEC 60617 / IEC 60364-7-712 & IEEE 1547 Net-Metering Synchronization
                    </p>
                  </div>
                </div>

                {/* Educational SLD Guide Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowSldGuideModal(prev => !prev)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="AutoCAD SLD kia hai aur DISCO net-metering me iska kam samjhein"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>{showSldGuideModal ? "✕ Close SLD Guide" : "📖 SLD Educational Guide"}</span>
                </button>
              </div>

              {/* Authentic AutoCAD Engineering Drawing Sheet Canvas */}
              <ModuleAutoCADSLD
                project={activeProject}
                totalCapacityKw={totalCapacityKw}
                moduleCount={moduleCount}
                moduleWattage={activeModuleWattage}
                inverterModel={inverterModel}
                inverterKw={inverterKw}
                cableBrand={cableBrand}
                dcCableSize={dcCableSize}
                acCableSize={acCableSize}
                discoUtility={activeProject?.subDivision || surveyDetails?.utilityProvider || "LESCO / IESCO / KE"}
                onDownloadDxf={handleDownloadDXF}
                language={language}
                t={t}
              />
            </div>
          </div>

          {/* Educational AutoCAD SLD Guide Card (Toggleable with Dynamic Multi-Language Support) */}
          {showSldGuideModal && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
                      AutoCAD SLD Architecture (.dwg / .dxf) Complete Guide
                    </h4>
                    <p className="text-xs text-blue-700">
                      {language === "ur"
                        ? "آٹوکیڈ سنگل لائن ڈایاگرام کیا ہے اور واپڈا / نیپرا نیٹ میٹرنگ میں اس کا کیا کام ہے؟"
                        : "Understanding Single Line Diagram (SLD) architecture and utility net-metering compliance"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSldGuideModal(false)}
                  className="p-1 rounded-lg hover:bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. What is SLD? */}
                <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                    <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[10px]">1</span>
                    <h5>{language === "ur" ? "SLD (Single Line Diagram) کیا ہے؟" : "What is an SLD (Single Line Diagram)?"}</h5>
                  </div>
                  {language === "ur" ? (
                    <>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>Single Line Diagram (SLD)</strong> سولر پاور پلانٹ کا بنیادی الیکٹریکل نقشہ ہوتا ہے۔ یہ ایک ہی سنگل لائن کے ذریعے دکھاتا ہے کہ سولر پینلز (DC) سے شروع ہو کر، انورٹر سے گزرتے ہوئے، بجلی کس طرح گرڈ (AC) میں داخل ہوتی ہے۔
                      </p>
                      <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                        اس میں پینلز کی سٹرنگز، DC/AC بریکرز، سرج پروٹیکشن (SPDs)، کیبل کا سائز (mm²)، اور ارتھنگ پٹ کی پوری تفصیل ہوتی ہے۔
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600 leading-relaxed">
                        A <strong>Single Line Diagram (SLD)</strong> is the primary electrical schematic of a solar power plant. It represents the complete electrical circuit using a simplified single-line route—from solar panels (DC), through protection disconnects and inverters, to the AC panel and utility grid.
                      </p>
                      <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                        Specifies exact PV string sizing, DC/AC circuit breakers, Type II SPDs, cable cross-sections (mm²), and chemical grounding pits.
                      </p>
                    </>
                  )}
                </div>

                {/* 2. What are .dwg and .dxf? */}
                <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                    <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[10px]">2</span>
                    <h5>{language === "ur" ? ".dwg اور .dxf فارمیٹس کیا ہیں؟" : "What are .DWG and .DXF CAD Formats?"}</h5>
                  </div>
                  {language === "ur" ? (
                    <>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>.DWG</strong> آٹوڈیسک آٹوکیڈ (Autodesk AutoCAD) کا بنیادی بائنری فارمیٹ ہے جس میں تمام سولر آرکیٹیکچرل نقشے تیار ہوتے ہیں۔
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>.DXF (Drawing Exchange Format)</strong> ایک اوپن ویکٹر فارمیٹ ہے جو دنیا کے کسی بھی کیڈ سوفٹ ویئر (AutoCAD, FreeCAD, SolidWorks) اور CNC لیزر مشین میں کھل جاتا ہے۔
                      </p>
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-medium">
                        ہماری ویب سائٹ سے آپ ایک کلک میں اپنے پراجیکٹ کی <strong>.dxf</strong> فائل ڈاؤنلوڈ کر کے آٹوکیڈ میں کھول سکتے ہیں!
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>.DWG</strong> is Autodesk AutoCAD's native binary format used by consulting engineers worldwide for architectural and electrical drawings.
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>.DXF (Drawing Exchange Format)</strong> is an open vector standard compatible with all CAD tools (AutoCAD, SolidWorks, FreeCAD) and CNC machines.
                      </p>
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-medium">
                        Download your project's certified vector <strong>.dxf</strong> file in 1 click and open it directly in AutoCAD!
                      </div>
                    </>
                  )}
                </div>

                {/* 3. Role in Net-Metering */}
                <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                    <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[10px]">3</span>
                    <h5>{language === "ur" ? "نیٹ میٹرنگ میں اس کا کیا کام ہے؟" : "Role in DISCO Net-Metering Sanction"}</h5>
                  </div>
                  {language === "ur" ? (
                    <>
                      <p className="text-slate-600 leading-relaxed">
                        نیپرا (NEPRA) اور واپڈا ڈسکوز (LESCO, IESCO, K-Electric, MEPCO) بغیر تصدیق شدہ آٹوکیڈ SLD کے گرین نیٹ میٹر کی <strong>Demand Notice اور NOC جاری نہیں کرتے</strong>۔
                      </p>
                      <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
                        <li><strong>اینٹی آئی لینڈنگ ٹیسٹ:</strong> گرڈ فیل ہوتے ہی انورٹر 0.1 سیکنڈ میں کٹ آف ہو تا کہ لائن مین کو کرنٹ نہ لگے۔</li>
                        <li><strong>ارتھنگ مزاحمت:</strong> کیمیکل ارتھ پٹ &lt; 2.5 اوہم ہونی چاہیے۔</li>
                        <li><strong>وولٹیج ڈراپ:</strong> کیبل کے نقصان 1.5% سے کم ہونے چاہییں۔</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600 leading-relaxed">
                        Electric utility companies require a certified AutoCAD SLD before approving Demand Notices and issuing bi-directional green net-metering sanctions.
                      </p>
                      <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
                        <li><strong>Anti-Islanding Protection:</strong> Inverter cuts off within &lt; 100ms on grid loss to prevent line-worker electrocution.</li>
                        <li><strong>Grounding Resistance:</strong> Verified chemical earth pit resistance &lt; 2.5 Ohms.</li>
                        <li><strong>Voltage Drop Compliance:</strong> DC and AC circuit losses strictly maintained below 1.5%.</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          PAGE 3: 25-YEAR YIELD, PERFORMANCE RATIO & FINAL AUTHORIZED APPROVAL
      ========================================================================= */}
      {(activePage === "all" || activePage === 3) && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                Page 3: 25-Year Yield Simulation & Final Authorized Approval
              </h3>
            </div>
            <span className="text-xs text-emerald-800 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              High-Yield SolarGIS Feasibility
            </span>
          </div>

          {/* 12-Month Expected Generation Bar Chart with Performance Ratio */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> 12-Month Generation Forecast (kWh/Month)
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-600">
                  Specific Yield: <strong className="text-slate-900 font-mono">{specificYield} kWh/kWp/yr</strong>
                </span>
                <span className="text-slate-600">
                  Performance Ratio: <strong className="text-emerald-700 font-mono">{performanceRatio}% PR</strong>
                </span>
                <span className="text-slate-600">
                  Annual Yield: <strong className="text-emerald-700 font-mono">{annualYieldKwh.toLocaleString()} kWh/yr</strong>
                </span>
              </div>
            </div>

            <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
              {monthlyKwh.map((kwh, idx) => {
                const heightPct = maxGen > 0 && kwh > 0 ? Math.max(8, (kwh / maxGen) * 100) : 4;
                return (
                  <div key={months[idx]} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-mono text-slate-500 group-hover:text-emerald-700 transition-colors font-semibold">
                      {kwh > 0 ? `${Math.round(kwh / 1000)}k` : "0"}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all shadow-xs ${kwh > 0 ? "bg-gradient-to-t from-emerald-700 to-emerald-500 group-hover:brightness-110" : "bg-slate-200"}`}
                    />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{months[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Financial Payback</span>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {paybackYears}
              </div>
              <p className="text-[10px] text-slate-600">Breakeven timeline against active NEPRA grid tariff</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Levelized Cost (LCOE)</span>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {lcoePkr !== "—" ? `PKR ${lcoePkr} / kWh` : "—"}
              </div>
              <p className="text-[10px] text-slate-600">Compared to DISCO grid rate of ~PKR {gridTariffPkr}/kWh</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">1st Year Net Savings</span>
              <div className="text-2xl font-black text-amber-800 font-mono">
                PKR {firstYearSavingsPkr.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-600">Annual bill reduction offset in Pakistani Rupees</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">25-Year Cumulative</span>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                PKR {cumulativeSavings25Y.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-600">Estimated cumulative lifetime savings (0.55% degradation)</p>
            </div>
          </div>

          {/* =========================================================================
              POINT 14: FINAL APPROVAL WITH AUTHORIZED SIGNATURE (DUAL SIGN-OFF)
          ========================================================================= */}
          <div className="bg-slate-50 border border-emerald-300 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-600 rounded-xl text-white font-bold shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    Contractual Execution & Authorized Final Approval
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-300 font-bold">
                      POINT 14 COMPLIANT
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Legally binding EPC turnkey commercial agreement, technical BOQ schedule, and handover authorization
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Approval Status</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${isLocked ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"}`}>
                  {isLocked ? "SUPER-ADMIN SEALED & LOCKED" : "PENDING CLIENT COUNTERSIGN"}
                </span>
              </div>
            </div>

            {/* Dual Authorization Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Column 1: Authorized EPC Contractor */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 relative shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Authorized EPC Contractor
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-semibold">
                    {companyProfile?.pecLicense ? `PEC Lic: ${companyProfile.pecLicense}` : "PEC Registered Solar EPC"}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Corporate Entity:</span>
                    <strong className="text-slate-900">{companyProfile?.companyName || "Green Tech Power Engineering (Pvt) Ltd"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Designated Signatory:</span>
                    <strong className="text-slate-800">{currentUser?.fullName || companyMeta.preparedBy || "Lead Solar EPC Engineer"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Executive Title:</span>
                    <span className="text-slate-700">Technical Director / Lead EPC Engineer</span>
                  </div>
                </div>

                {/* Signature Box & Digital Seal */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="w-44 border-b border-slate-400 pb-1 mb-1 font-serif text-emerald-800 italic text-sm font-semibold">
                      {currentUser?.fullName || companyMeta.preparedBy || "Lead Solar EPC Engineer"}
                    </div>
                    <span className="text-[10px] text-slate-500 block font-medium">Authorized EPC Signature & Date</span>
                  </div>

                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center text-center p-1 bg-emerald-50">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span className="text-[8px] text-emerald-800 uppercase font-black leading-tight mt-0.5">CORPORATE SEAL</span>
                    <span className="text-[7px] text-emerald-700 font-mono font-bold">VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Client Acceptance & Authorization */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 relative shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-emerald-600" /> Client Acceptance & Sign-off
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-semibold">Turnkey Acceptance</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Authorized Client:</span>
                    <strong className="text-slate-900">{clientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client CNIC / NTN:</span>
                    <strong className="text-slate-800 font-mono">{clientCnic}</strong>
                  </div>
                  <p className="text-[10px] text-slate-600 pt-1 leading-snug">
                    "I hereby approve the system DC capacity of <strong>{totalCapacityKw > 0 ? `${totalCapacityKw.toFixed(2)} kWp` : "0 kWp"}</strong>, technical equipment BOQ, milestone payment schedule, and turnkey contract sum of <strong>PKR {turnkeyContractPrice.toLocaleString()}</strong>."
                  </p>
                </div>

                {/* Signature Line & Client Stamp Box */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="w-44 border-b border-slate-400 pb-1 mb-1 font-serif text-slate-700 italic text-sm">
                      {clientName || "Authorized Signature"}
                    </div>
                    <span className="text-[10px] text-slate-500 block font-medium">Authorized Client Signature & Date</span>
                  </div>

                  <div className="w-20 h-20 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-1 bg-slate-50">
                    <span className="text-[8px] text-slate-600 uppercase font-bold leading-tight">CLIENT STAMP</span>
                    <span className="text-[7px] text-slate-400 font-mono mt-1">[ AFFIX HERE ]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Export Action Footer */}
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-wrap justify-between items-center gap-4 shadow-xs no-print print:hidden">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Export Print-Ready Commercial Contract Proposal
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Generate the high-resolution 3-page vector PDF contract document with executive seals and dual signature verification
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" /> Print / Save 3 Pages (PDF)
              </button>
              <button
                onClick={handleDownloadEPCProposalPDF}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Official Proposal (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
        </>
      )}
    </div>
  );
}
