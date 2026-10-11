import React, { useState, useEffect } from "react";
import {
  Package, Search, Plus, Filter, Trash2, Edit3, Check, CheckCircle2,
  Zap, ShieldCheck, Sun, Layers, Cpu, Compass, X, AlertTriangle
} from "lucide-react";
import { formatPKR } from "../services/solarEngine.js";

export default function HelioScopeCatalog({
  onSelectPanel,
  onSelectInverter,
  onSelectRacking,
  activePanelKey,
  activeInverterModel,
  activeRackingName
}) {
  // Category Tab: 'PANELS' | 'INVERTERS' | 'RACKING'
  const [activeCategory, setActiveCategory] = useState("PANELS");

  // Data states
  const [panels, setPanels] = useState([]);
  const [inverters, setInverters] = useState([]);
  const [racking, setRacking] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("ALL");
  const [wattageFilter, setWattageFilter] = useState("ALL");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({});

  // Show temporary toast notification
  const showToast = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch Catalog data from Backend API
  const fetchCatalogData = async () => {
    setLoading(true);
    try {
      const [resPanels, resInverters, resRacking] = await Promise.all([
        fetch("/api/catalog/panels").then(r => r.json()).catch(() => ({ data: [] })),
        fetch("/api/catalog/inverters").then(r => r.json()).catch(() => ({ data: [] })),
        fetch("/api/catalog/racking").then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (resPanels.data) setPanels(resPanels.data);
      if (resInverters.data) setInverters(resInverters.data);
      if (resRacking.data) setRacking(resRacking.data);
    } catch (err) {
      console.warn("Failed to load catalog data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Manufacturers unique list
  const panelManufacturers = ["ALL", ...new Set(panels.map(p => p.manufacturer).filter(Boolean))];
  const inverterManufacturers = ["ALL", ...new Set(inverters.map(i => i.manufacturer).filter(Boolean))];

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    if (activeCategory === "PANELS") {
      setFormData({
        manufacturer: "Jinko Solar",
        modelName: "",
        wattage: 585,
        efficiency: 22.65,
        lengthMm: 2278,
        widthMm: 1134,
        thicknessMm: 30,
        weightKg: 28.5,
        voc: 51.5,
        vmp: 43.2,
        isc: 14.36,
        imp: 13.54,
        tempCoeffPmax: -0.0030,
        tempCoeffVoc: -0.0028,
        warrantyYears: 25,
        pricePerUnit: 18000,
        isDefault: false
      });
    } else if (activeCategory === "INVERTERS") {
      setFormData({
        manufacturer: "Huawei",
        modelName: "",
        type: "string",
        ratedAcOutputKw: 20.0,
        maxDcInputVoltage: 1100.0,
        mpptRangeMin: 160.0,
        mpptRangeMax: 1000.0,
        numberOfMpptInputs: 2,
        maxInputCurrentPerMppt: 25.0,
        efficiencyPct: 98.6,
        warrantyYears: 5,
        pricePerUnit: 400000,
        isDefault: false
      });
    } else {
      setFormData({
        name: "",
        type: "rooftop",
        tiltRangeMin: 5,
        tiltRangeMax: 30,
        material: "Hot-Dip Galvanized HDG (80µm)",
        windRatingKmh: 160,
        pricePerKwp: 7500,
        isDefault: false
      });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let endpoint = "";
      if (activeCategory === "PANELS") endpoint = "/api/catalog/panels";
      else if (activeCategory === "INVERTERS") endpoint = "/api/catalog/inverters";
      else endpoint = "/api/catalog/racking";

      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(editingItem ? "Equipment specifications updated." : "New equipment added to catalog.");
        setIsModalOpen(false);
        fetchCatalogData();
      } else {
        alert(data.error || "Failed to save equipment");
      }
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  // Handle Delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the equipment catalog?`)) return;
    try {
      let endpoint = "";
      if (activeCategory === "PANELS") endpoint = `/api/catalog/panels/${id}`;
      else if (activeCategory === "INVERTERS") endpoint = `/api/catalog/inverters/${id}`;
      else endpoint = `/api/catalog/racking/${id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        showToast(`Removed "${name}" from catalog.`);
        fetchCatalogData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // Filtered Panels
  const filteredPanels = panels.filter(p => {
    const matchesSearch = !searchQuery ||
      p.modelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMfr = selectedManufacturer === "ALL" || p.manufacturer === selectedManufacturer;
    const matchesWatt = wattageFilter === "ALL" ||
      (wattageFilter === "500-599" && p.wattage >= 500 && p.wattage < 600) ||
      (wattageFilter === "600-699" && p.wattage >= 600 && p.wattage < 700) ||
      (wattageFilter === "700+" && p.wattage >= 700);
    return matchesSearch && matchesMfr && matchesWatt;
  });

  // Filtered Inverters
  const filteredInverters = inverters.filter(i => {
    const matchesSearch = !searchQuery ||
      i.modelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMfr = selectedManufacturer === "ALL" || i.manufacturer === selectedManufacturer;
    return matchesSearch && matchesMfr;
  });

  // Filtered Racking
  const filteredRacking = racking.filter(r => {
    return !searchQuery ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.material?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{notification.msg}</span>
        </div>
      )}

      {/* Header & Sub-Category Tabs */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              1. Photovoltaic Equipment Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified Tier-1 equipment database with exact electrical STC ratings, physical dimensions, and cost schedule.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add {activeCategory === "PANELS" ? "Solar Panel" : activeCategory === "INVERTERS" ? "Inverter" : "Racking System"}
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveCategory("PANELS"); setSelectedManufacturer("ALL"); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === "PANELS"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sun className="w-4 h-4" />
              Solar Panels ({panels.length})
            </button>
            <button
              onClick={() => { setActiveCategory("INVERTERS"); setSelectedManufacturer("ALL"); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === "INVERTERS"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-4 h-4" />
              Inverters ({inverters.length})
            </button>
            <button
              onClick={() => { setActiveCategory("RACKING"); setSelectedManufacturer("ALL"); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === "RACKING"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              Racking & Mounting ({racking.length})
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeCategory.toLowerCase()}...`}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 sm:w-60 focus:ring-1 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {activeCategory === "PANELS" && (
              <>
                <select
                  value={selectedManufacturer}
                  onChange={(e) => setSelectedManufacturer(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium outline-hidden"
                >
                  {panelManufacturers.map(m => (
                    <option key={m} value={m}>{m === "ALL" ? "All Brands" : m}</option>
                  ))}
                </select>

                <select
                  value={wattageFilter}
                  onChange={(e) => setWattageFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium outline-hidden"
                >
                  <option value="ALL">All Wattages</option>
                  <option value="500-599">500W - 599W</option>
                  <option value="600-699">600W - 699W</option>
                  <option value="700+">700W+</option>
                </select>
              </>
            )}

            {activeCategory === "INVERTERS" && (
              <select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium outline-hidden"
              >
                {inverterManufacturers.map(m => (
                  <option key={m} value={m}>{m === "ALL" ? "All Inverter Brands" : m}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          1. SOLAR PANELS TABLE
      ===================================================================== */}
      {activeCategory === "PANELS" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Brand / Manufacturer</th>
                  <th className="py-3 px-4">Model Description</th>
                  <th className="py-3 px-4">STC Wattage</th>
                  <th className="py-3 px-4">Efficiency</th>
                  <th className="py-3 px-4">Dimensions (L × W × T)</th>
                  <th className="py-3 px-4">Voc / Vmp</th>
                  <th className="py-3 px-4">Isc / Imp</th>
                  <th className="py-3 px-4">Temp Coeff</th>
                  <th className="py-3 px-4">Price (PKR)</th>
                  <th className="py-3 px-4 text-center">Design Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPanels.map((p) => {
                  const isSelected = activePanelKey && (
                    activePanelKey.includes(p.modelName) ||
                    p.modelName.includes(activePanelKey) ||
                    activePanelKey.includes(p.wattage?.toString())
                  );

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition ${isSelected ? "bg-emerald-50/50" : ""}`}>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{p.manufacturer}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {p.modelName}
                        {p.isDefault && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 rounded font-bold">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                        {p.wattage} W
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.efficiency}%
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.lengthMm} × {p.widthMm} × {p.thicknessMm} mm
                        <span className="block text-[10px] text-slate-400">{p.weightKg} kg</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <span className="text-blue-600 font-bold">{p.voc}V</span> / {p.vmp}V
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {p.isc}A / {p.imp}A
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        Pmax: {(p.tempCoeffPmax * 100).toFixed(2)}%/°C
                        <span className="block">Voc: {(p.tempCoeffVoc * 100).toFixed(2)}%/°C</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatPKR(p.pricePerUnit || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              if (onSelectPanel) onSelectPanel(p);
                              showToast(`Active CAD Module set to ${p.modelName} (${p.wattage}W)`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                            title="Set this panel as the active array module"
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Selected
                              </>
                            ) : (
                              "Select for CAD"
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            title="Edit specs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.modelName)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Delete panel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. INVERTERS TABLE
      ===================================================================== */}
      {activeCategory === "INVERTERS" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Model Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Rated AC kW</th>
                  <th className="py-3 px-4">Max DC Volts</th>
                  <th className="py-3 px-4">MPPT Range</th>
                  <th className="py-3 px-4">MPPT Trackers</th>
                  <th className="py-3 px-4">Max Input Current</th>
                  <th className="py-3 px-4">Efficiency</th>
                  <th className="py-3 px-4">Unit Price (PKR)</th>
                  <th className="py-3 px-4 text-center">Design Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInverters.map((i) => {
                  const isSelected = activeInverterModel && (
                    activeInverterModel.includes(i.modelName) ||
                    i.modelName.includes(activeInverterModel)
                  );

                  return (
                    <tr key={i.id} className={`hover:bg-slate-50/80 transition ${isSelected ? "bg-emerald-50/50" : ""}`}>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{i.manufacturer}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {i.modelName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          i.type === "hybrid" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {i.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-blue-700 text-sm">
                        {i.ratedAcOutputKw} kW
                      </td>
                      <td className="py-3 px-4 font-mono text-red-600 font-bold">
                        {i.maxDcInputVoltage} V
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {i.mpptRangeMin}V - {i.mpptRangeMax}V
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {i.numberOfMpptInputs} MPPT
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {i.maxInputCurrentPerMppt} A
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                        {i.efficiencyPct}%
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatPKR(i.pricePerUnit || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              if (onSelectInverter) onSelectInverter(i);
                              showToast(`Active Inverter set to ${i.modelName} (${i.ratedAcOutputKw}kW)`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                            title="Set this inverter for string sizing"
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Selected
                              </>
                            ) : (
                              "Select for CAD"
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(i)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(i.id, i.modelName)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. RACKING SYSTEMS TABLE
      ===================================================================== */}
      {activeCategory === "RACKING" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">System Name</th>
                  <th className="py-3 px-4">Structure Type</th>
                  <th className="py-3 px-4">Tilt Range</th>
                  <th className="py-3 px-4">Material Specification</th>
                  <th className="py-3 px-4">Wind Rating</th>
                  <th className="py-3 px-4">Price per kWp</th>
                  <th className="py-3 px-4 text-center">Design Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRacking.map((r) => {
                  const isSelected = activeRackingName && activeRackingName.includes(r.name);

                  return (
                    <tr key={r.id} className={`hover:bg-slate-50/80 transition ${isSelected ? "bg-emerald-50/50" : ""}`}>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {r.tiltRangeMin}° - {r.tiltRangeMax}°
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.material}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {r.windRatingKmh} km/h
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatPKR(r.pricePerKwp || 0)} / kWp
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              if (onSelectRacking) onSelectRacking(r);
                              showToast(`Active Racking structure set to ${r.name}`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Selected
                              </>
                            ) : (
                              "Select for CAD"
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          ADD / EDIT MODAL
      ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                {editingItem ? "Edit Equipment Specs" : `Add New ${activeCategory === "PANELS" ? "Solar Panel" : activeCategory === "INVERTERS" ? "Inverter" : "Racking System"}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {activeCategory === "PANELS" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Manufacturer</label>
                    <input
                      type="text"
                      required
                      value={formData.manufacturer || ""}
                      onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Model Name</label>
                    <input
                      type="text"
                      required
                      value={formData.modelName || ""}
                      onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">STC Wattage (W)</label>
                    <input
                      type="number"
                      required
                      value={formData.wattage || ""}
                      onChange={e => setFormData({ ...formData, wattage: parseInt(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Efficiency (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.efficiency || ""}
                      onChange={e => setFormData({ ...formData, efficiency: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Length (mm)</label>
                    <input
                      type="number"
                      required
                      value={formData.lengthMm || ""}
                      onChange={e => setFormData({ ...formData, lengthMm: parseInt(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Width (mm)</label>
                    <input
                      type="number"
                      required
                      value={formData.widthMm || ""}
                      onChange={e => setFormData({ ...formData, widthMm: parseInt(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Thickness (mm)</label>
                    <input
                      type="number"
                      value={formData.thicknessMm || 30}
                      onChange={e => setFormData({ ...formData, thicknessMm: parseInt(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weightKg || 28.5}
                      onChange={e => setFormData({ ...formData, weightKg: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Voc (V)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.voc || ""}
                      onChange={e => setFormData({ ...formData, voc: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Vmp (V)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.vmp || ""}
                      onChange={e => setFormData({ ...formData, vmp: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Isc (A)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.isc || ""}
                      onChange={e => setFormData({ ...formData, isc: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Imp (A)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.imp || ""}
                      onChange={e => setFormData({ ...formData, imp: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Price per Unit (PKR)</label>
                    <input
                      type="number"
                      value={formData.pricePerUnit || 0}
                      onChange={e => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Warranty (Years)</label>
                    <input
                      type="number"
                      value={formData.warrantyYears || 25}
                      onChange={e => setFormData({ ...formData, warrantyYears: parseInt(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>
              )}

              {activeCategory === "INVERTERS" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Manufacturer</label>
                    <input
                      type="text"
                      required
                      value={formData.manufacturer || ""}
                      onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Model Name</label>
                    <input
                      type="text"
                      required
                      value={formData.modelName || ""}
                      onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Inverter Type</label>
                    <select
                      value={formData.type || "string"}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      <option value="string">String (Grid-Tied)</option>
                      <option value="hybrid">Hybrid (Battery Ready)</option>
                      <option value="micro">Micro-Inverter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Rated AC Output (kW)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.ratedAcOutputKw || ""}
                      onChange={e => setFormData({ ...formData, ratedAcOutputKw: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Max DC Input Voltage (V)</label>
                    <input
                      type="number"
                      value={formData.maxDcInputVoltage || 1100}
                      onChange={e => setFormData({ ...formData, maxDcInputVoltage: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">MPPT Range Min (V)</label>
                    <input
                      type="number"
                      value={formData.mpptRangeMin || 160}
                      onChange={e => setFormData({ ...formData, mpptRangeMin: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">MPPT Range Max (V)</label>
                    <input
                      type="number"
                      value={formData.mpptRangeMax || 1000}
                      onChange={e => setFormData({ ...formData, mpptRangeMax: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Number of MPPTs</label>
                    <input
                      type="number"
                      value={formData.numberOfMpptInputs || 2}
                      onChange={e => setFormData({ ...formData, numberOfMpptInputs: parseInt(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Max Input Current / MPPT (A)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.maxInputCurrentPerMppt || 25}
                      onChange={e => setFormData({ ...formData, maxInputCurrentPerMppt: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Efficiency (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.efficiencyPct || 98.6}
                      onChange={e => setFormData({ ...formData, efficiencyPct: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Price per Unit (PKR)</label>
                    <input
                      type="number"
                      value={formData.pricePerUnit || 0}
                      onChange={e => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>
              )}

              {activeCategory === "RACKING" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">System Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Structure Type</label>
                    <select
                      value={formData.type || "rooftop"}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      <option value="rooftop">Rooftop Standard</option>
                      <option value="elevated">Elevated HDG Structure</option>
                      <option value="ground-mount">Ground-Mount Piling</option>
                      <option value="carport">Carport Canopy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Material Specification</label>
                    <input
                      type="text"
                      value={formData.material || "Hot-Dip Galvanized HDG (80µm)"}
                      onChange={e => setFormData({ ...formData, material: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Tilt Range Min (°)</label>
                    <input
                      type="number"
                      value={formData.tiltRangeMin || 5}
                      onChange={e => setFormData({ ...formData, tiltRangeMin: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Tilt Range Max (°)</label>
                    <input
                      type="number"
                      value={formData.tiltRangeMax || 35}
                      onChange={e => setFormData({ ...formData, tiltRangeMax: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Wind Rating (km/h)</label>
                    <input
                      type="number"
                      value={formData.windRatingKmh || 160}
                      onChange={e => setFormData({ ...formData, windRatingKmh: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Price per kWp (PKR)</label>
                    <input
                      type="number"
                      value={formData.pricePerKwp || 0}
                      onChange={e => setFormData({ ...formData, pricePerKwp: parseFloat(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Save Equipment Specs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
