import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes, Package, Warehouse, Truck, CheckCircle2, AlertTriangle,
  XCircle, ArrowRightLeft, Plus, RefreshCw, FileText, Download,
  Search, Filter, ShieldCheck, DollarSign, Layers, ChevronRight,
  Printer, Check, Clock, Phone, User, Calendar, Sliders, RotateCcw,
  Trash2, History, ArrowUpRight, ArrowDownLeft, ShieldAlert,
  Camera, Image as ImageIcon, Receipt, Eye, ZoomIn, Building,
  CheckSquare, UploadCloud, FileCheck, X, AlertCircle, Sparkles
} from "lucide-react";
import { formatPKR } from "../services/solarEngine.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function ModuleInventory({
  currentUser,
  activeProject,
  projectsList = [],
  onSelectProject,
  token
}) {
  const { t, language, isRTL } = useLanguage();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  
  // Roles with permission to add and manage stock on both sides:
  // Admin, Warehouse Keeper, Project Handler, and Engineers
  const canManageStock = !currentUser || [
    "SUPER_ADMIN", "ADMIN",
    "WAREHOUSE_KEEPER", "WAREHOUSE_MANAGER", "WAREHOUSE_INVENTORY_MANAGER",
    "PROJECT_HANDLER", "PROJECT_MANAGER",
    "SOLAR_DESIGN_ENGINEER", "SURVEY_ENGINEER",
    "PURCHASING_OFFICER", "PURCHASING_DEPARTMENT", "PROCUREMENT_MANAGER"
  ].includes(currentUser?.role);

  // Roles permitted to enter purchases and upload bills & physical photos:
  // Purchasing department, procurement officers, warehouse managers, and admins
  const canUploadPurchases = !currentUser || [
    "SUPER_ADMIN", "ADMIN",
    "PURCHASING_OFFICER", "PURCHASING_DEPARTMENT", "PROCUREMENT_MANAGER",
    "WAREHOUSE_KEEPER", "WAREHOUSE_MANAGER", "PROJECT_HANDLER"
  ].includes(currentUser?.role);

  // Sub-tabs: "system" (Stock in Each System) | "warehouse" (Warehouse Master) | "purchasing" (Purchasing & Bills) | "audit" (Stock Movement & Audit Log)
  const [activeSubTab, setActiveSubTab] = useState("system");

  // Selected project for system allocation
  const [selectedProjectId, setSelectedProjectId] = useState(() => activeProject?.id || (projectsList[0]?.id || ""));

  // Inventory data state
  const [inventorySummary, setInventorySummary] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // System stock state for selected project
  const [systemStockData, setSystemStockData] = useState(null);
  const [isSystemLoading, setIsSystemLoading] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");

  // Purchasing & Goods Receipt (GRN) state
  const [purchasesList, setPurchasesList] = useState([]);
  const [purchasesKpis, setPurchasesKpis] = useState(null);
  const [isPurchasingLoading, setIsPurchasingLoading] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseFilterStream, setPurchaseFilterStream] = useState("ALL");
  const [purchaseFilterYear, setPurchaseFilterYear] = useState("ALL");
  const [purchaseFilterStatus, setPurchaseFilterStatus] = useState("ALL");
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [purchaseFormError, setPurchaseFormError] = useState(null);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  const initialPurchaseForm = {
    targetStream: "WAREHOUSE_MASTER",
    targetWarehouse: "Central Hub (Karachi Port)",
    projectId: activeProject?.id || (projectsList[0]?.id || ""),
    projectCode: activeProject?.projectCode || (projectsList[0]?.projectCode || ""),
    clientName: activeProject?.clientName || (projectsList[0]?.clientName || ""),
    vendorName: "",
    vendorLocation: "Lahore / Karachi Port",
    vendorContact: "",
    billInvoiceNo: "",
    poNumber: `PO-${Date.now().toString().slice(-6)}`,
    paymentMode: "Bank Transfer (Verified IBAN)",
    notes: "",
    items: [
      {
        sku: "JK-585-TOPCON",
        name: "Jinko 585W N-Type TOPCon Solar Panels",
        category: "PANELS",
        unit: "Panels",
        quantity: 50,
        unitCostPkr: 19800,
        batchOrSerial: ""
      }
    ],
    materialPictures: [],
    billPictures: []
  };
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm);

  // Filters for Warehouse Master
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(50);
  const [restockNotes, setRestockNotes] = useState("");

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    type: "ADD", // "ADD", "DEDUCT", "SET"
    quantity: 10,
    reason: "Physical Stock Take Reconciliation",
    notes: ""
  });

  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    sku: "",
    quantity: 10,
    notes: ""
  });

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({
    sku: "",
    maxQuantity: 0,
    quantity: 1,
    notes: ""
  });

  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    transporterName: "Falcon Logistics Pakistan",
    driverName: "Muhammad Aslam",
    vehicleNo: "LES-2026-894",
    driverPhone: "+92 300 4567890",
    notes: "Site Delivery: Fragile Solar PV Modules & Inverters"
  });
  const [activeChalan, setActiveChalan] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Form for New SKU
  const [newItemForm, setNewItemForm] = useState({
    sku: "",
    name: "",
    category: "PANELS",
    brand: "Jinko Solar",
    model: "",
    unit: "Panels",
    totalStock: 500,
    minThreshold: 100,
    unitCostPkr: 19500,
    warehouse: "Central Hub (Karachi Port)",
    specs: ""
  });

  // Keep selected project synced with activeProject
  useEffect(() => {
    if (activeProject?.id && activeProject.id !== selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
  }, [activeProject]);

  // Fetch complete warehouse inventory
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (data.success) {
        setInventorySummary(data.summary);
        setInventoryItems(data.items || []);
        setWarehouses(data.warehouses || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch system stock for selected project
  const fetchSystemStock = async (projId) => {
    if (!projId) {
      setSystemStockData(null);
      return;
    }
    setIsSystemLoading(true);
    try {
      const res = await fetch(`/api/inventory/system-stock/${projId}`);
      const data = await res.json();
      if (data.success) {
        setSystemStockData(data);
      } else {
        setSystemStockData(null);
      }
    } catch (err) {
      console.error("Failed to fetch system stock:", err);
      setSystemStockData(null);
    } finally {
      setIsSystemLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setIsAuditLoading(true);
    try {
      const res = await fetch("/api/inventory/audit-logs", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  // Fetch purchasing receipts & audit trail
  const fetchPurchases = async () => {
    setIsPurchasingLoading(true);
    try {
      const res = await fetch("/api/inventory/purchases", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setPurchasesList(data.purchases || []);
        setPurchasesKpis(data.kpis || null);
      }
    } catch (err) {
      console.error("Failed to load purchases:", err);
    } finally {
      setIsPurchasingLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchAuditLogs();
    fetchPurchases();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchSystemStock(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Filtered master items
  const filteredInventoryItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesWarehouse = selectedWarehouseFilter === "ALL" || item.warehouse === selectedWarehouseFilter;
      const matchesCategory = selectedCategoryFilter === "ALL" || item.category === selectedCategoryFilter;
      const matchesSearch = !searchQuery ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesWarehouse && matchesCategory && matchesSearch;
    });
  }, [inventoryItems, selectedWarehouseFilter, selectedCategoryFilter, searchQuery]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesAction = auditActionFilter === "ALL" || log.action === auditActionFilter;
      const q = auditSearchQuery.toLowerCase();
      const matchesSearch = !auditSearchQuery ||
        (log.userName && log.userName.toLowerCase().includes(q)) ||
        (log.role && log.role.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.details?.sku && log.details.sku.toLowerCase().includes(q)) ||
        (log.details?.name && log.details.name.toLowerCase().includes(q)) ||
        (log.details?.notes && log.details.notes.toLowerCase().includes(q));
      return matchesAction && matchesSearch;
    });
  }, [auditLogs, auditActionFilter, auditSearchQuery]);

  // Filtered Purchasing Records for Super Admin & Staff
  const filteredPurchases = useMemo(() => {
    return purchasesList.filter(p => {
      const matchesStream = purchaseFilterStream === "ALL" || p.targetStream === purchaseFilterStream;
      const matchesYear = purchaseFilterYear === "ALL" || String(p.year) === String(purchaseFilterYear);
      const matchesStatus = purchaseFilterStatus === "ALL" || p.verificationStatus === purchaseFilterStatus;
      const q = purchaseSearchQuery.toLowerCase();
      const matchesSearch = !purchaseSearchQuery ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
        (p.billInvoiceNo && p.billInvoiceNo.toLowerCase().includes(q)) ||
        (p.vendorName && p.vendorName.toLowerCase().includes(q)) ||
        (p.targetName && p.targetName.toLowerCase().includes(q)) ||
        (p.projectCode && p.projectCode.toLowerCase().includes(q)) ||
        (p.dayOfWeek && p.dayOfWeek.toLowerCase().includes(q)) ||
        (p.dateString && p.dateString.toLowerCase().includes(q)) ||
        (p.uploadedByUserName && p.uploadedByUserName.toLowerCase().includes(q));
      return matchesStream && matchesYear && matchesStatus && matchesSearch;
    });
  }, [purchasesList, purchaseFilterStream, purchaseFilterYear, purchaseFilterStatus, purchaseSearchQuery]);

  // Modal Openers for specific channels
  const openPurchaseModalForWarehouse = () => {
    setPurchaseForm({
      ...initialPurchaseForm,
      targetStream: "WAREHOUSE_MASTER",
      targetWarehouse: selectedWarehouseFilter !== "ALL" ? selectedWarehouseFilter : "Central Hub (Karachi Port)"
    });
    setPurchaseFormError(null);
    setIsPurchaseModalOpen(true);
  };

  const openPurchaseModalForSystem = () => {
    setPurchaseForm({
      ...initialPurchaseForm,
      targetStream: "SYSTEM_STOCK",
      projectId: selectedProjectId || activeProject?.id || "",
      projectCode: systemStockData?.projectCode || activeProject?.projectCode || "",
      clientName: systemStockData?.clientName || activeProject?.clientName || "Residential System"
    });
    setPurchaseFormError(null);
    setIsPurchaseModalOpen(true);
  };

  const openPurchaseModalForCommercial = () => {
    setPurchaseForm({
      ...initialPurchaseForm,
      targetStream: "COMMERCIAL_PROJECT",
      projectId: selectedProjectId || activeProject?.id || "",
      projectCode: systemStockData?.projectCode || activeProject?.projectCode || "CP-2026-042",
      clientName: systemStockData?.clientName || activeProject?.clientName || "Commercial Project 500kW"
    });
    setPurchaseFormError(null);
    setIsPurchaseModalOpen(true);
  };

  // Image Upload Handler
  const handleFileUpload = (e, targetField) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target.result;
        setPurchaseForm(prev => ({
          ...prev,
          [targetField]: [
            ...prev[targetField],
            {
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              url: base64Url,
              caption: targetField === "billPictures" ? "Official Vendor Bill / Invoice" : "Material / Equipment Photo"
            }
          ]
        }));
        setPurchaseFormError(null);
      };
      reader.readAsDataURL(file);
    });
  };

  // Attach sample images for instant test demo
  const handleAttachSampleImages = () => {
    setPurchaseForm(prev => ({
      ...prev,
      materialPictures: [
        {
          name: "Jinko_TOPCon_Panels_Delivery_Gate.jpg",
          size: "1.4 MB",
          url: "/assets/structures/l2-elevated.jpg",
          caption: "Physical consignment received at warehouse gate"
        }
      ],
      billPictures: [
        {
          name: "Official_Vendor_Tax_Invoice_Stamped.jpg",
          size: "820 KB",
          url: "/assets/structures/custom-carport.jpg",
          caption: "Official signed & stamped vendor invoice / Delivery Challan"
        }
      ]
    }));
    setPurchaseFormError(null);
  };

  const handleRemoveImage = (targetField, index) => {
    setPurchaseForm(prev => ({
      ...prev,
      [targetField]: prev[targetField].filter((_, i) => i !== index)
    }));
  };

  const handleAddItemToPurchase = () => {
    setPurchaseForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sku: "",
          name: "",
          category: "PANELS",
          unit: "Panels",
          quantity: 10,
          unitCostPkr: 19500,
          batchOrSerial: ""
        }
      ]
    }));
  };

  const handleRemoveItemFromPurchase = (index) => {
    if (purchaseForm.items.length <= 1) return;
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handlePurchaseItemChange = (index, field, value) => {
    setPurchaseForm(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  // Submit Purchase with strict picture validations
  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    setPurchaseFormError(null);

    // Mandatory Material Pictures
    if (!purchaseForm.materialPictures || purchaseForm.materialPictures.length === 0) {
      setPurchaseFormError("⚠️ لازمی شرط (Mandatory Policy): سامان کی اصل تصویر (Material Picture) اپلوڈ کرنا لازمی ہے!");
      return;
    }

    // Mandatory Bill Pictures
    if (!purchaseForm.billPictures || purchaseForm.billPictures.length === 0) {
      setPurchaseFormError("⚠️ لازمی شرط (Mandatory Policy): وینڈر بل / انوائس کی تصویر (Vendor Bill Picture) اپلوڈ کرنا لازمی ہے!");
      return;
    }

    if (!purchaseForm.vendorName.trim()) {
      setPurchaseFormError("وینڈر یا سپلائر کا نام لکھنا لازمی ہے (کہاں سے خریدا)!");
      return;
    }

    const validItems = purchaseForm.items.filter(i => Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setPurchaseFormError("کم از کم ایک سامان اور اس کی تعداد درج کریں!");
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      const targetName = purchaseForm.targetStream === "WAREHOUSE_MASTER"
        ? purchaseForm.targetWarehouse
        : `${purchaseForm.projectCode || 'PROJ'} - ${purchaseForm.clientName || 'Project'}`;

      const res = await fetch("/api/inventory/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          ...purchaseForm,
          targetName,
          items: validItems
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: "success", text: data.message });
        setIsPurchaseModalOpen(false);
        setPurchaseForm(initialPurchaseForm);
        fetchPurchases();
        fetchInventory();
        if (selectedProjectId) fetchSystemStock(selectedProjectId);
        fetchAuditLogs();
      } else {
        setPurchaseFormError(data.error || "خریداری محفوظ کرنے میں مسئلہ پیش آیا");
      }
    } catch (err) {
      setPurchaseFormError(err.message);
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  // Super Admin Verification Stamp
  const handleVerifyPurchase = async (receiptId) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/inventory/purchases/${receiptId}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: "success", text: data.message });
        fetchPurchases();
        fetchAuditLogs();
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
  };

  // Handler: Reserve / Allocate Complete Stock for System
  const handleAllocateStock = async () => {
    if (!systemStockData || !selectedProjectId) return;
    try {
      const payload = {
        projectId: selectedProjectId,
        projectCode: systemStockData.projectCode,
        items: systemStockData.systemItems.map(i => ({
          inventoryId: i.inventoryId,
          sku: i.sku,
          name: i.name,
          quantity: i.requiredQuantity,
          unit: i.unit,
          warehouse: i.warehouse
        })),
        notes: `System stock reserved for ${systemStockData.clientName} (${systemStockData.systemCapacityKw} kWp)`
      };

      const res = await fetch("/api/inventory/allocate-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: "success", text: "✅ System stock successfully reserved from warehouses!" });
        fetchSystemStock(selectedProjectId);
        fetchInventory();
        fetchAuditLogs();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to allocate stock" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handler: Dispatch Stock & Issue Gate Pass
  const handleDispatchStock = async () => {
    const activeAlloc = systemStockData?.allocations?.find(a => a.status === "RESERVED") || systemStockData?.allocations?.[0];
    if (!activeAlloc) {
      await handleAllocateStock();
    }

    try {
      const res = await fetch("/api/inventory/dispatch-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          allocationId: activeAlloc?.id || systemStockData?.allocations?.[0]?.id,
          driverName: dispatchForm.driverName,
          vehicleNo: dispatchForm.vehicleNo,
          driverPhone: dispatchForm.driverPhone,
          notes: dispatchForm.notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setActiveChalan({
          chalanNumber: data.chalanNumber,
          allocation: data.allocation,
          systemStockData
        });
        setIsDispatchModalOpen(false);
        setFeedbackMsg({ type: "success", text: `🚚 Gate Pass & MIN generated: ${data.chalanNumber}` });
        fetchSystemStock(selectedProjectId);
        fetchInventory();
        fetchAuditLogs();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to dispatch stock" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Handler: Release Stock
  const handleReleaseStock = async () => {
    if (!window.confirm("Are you sure you want to release the reserved stock back to the warehouse?")) return;
    try {
      const res = await fetch("/api/inventory/release-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ projectId: selectedProjectId })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: "success", text: "🔄 Stock successfully released back to warehouse pool." });
        fetchSystemStock(selectedProjectId);
        fetchInventory();
        fetchAuditLogs();
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handler: Restock an item (Warehouse Master)
  const handleRestock = async () => {
    if (!restockItem || restockQty <= 0) return;
    try {
      const res = await fetch("/api/inventory/adjust-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          itemId: restockItem.id,
          sku: restockItem.sku,
          adjustmentType: "ADD",
          quantity: Number(restockQty),
          reason: "Goods Receipt / Inward Restock",
          notes: restockNotes || `Restocked ${restockQty} ${restockItem.unit || 'units'}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsRestockModalOpen(false);
        setRestockNotes("");
        setFeedbackMsg({ type: "success", text: `📦 Restocked ${restockQty} units of ${restockItem.sku}!` });
        fetchInventory();
        if (selectedProjectId) fetchSystemStock(selectedProjectId);
        fetchAuditLogs();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to restock" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handler: Adjust Stock (Warehouse Master)
  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustItem) return;
    try {
      const res = await fetch("/api/inventory/adjust-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          itemId: adjustItem.id,
          sku: adjustItem.sku,
          adjustmentType: adjustForm.type,
          quantity: Number(adjustForm.quantity),
          reason: adjustForm.reason,
          notes: adjustForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAdjustModalOpen(false);
        setFeedbackMsg({ type: "success", text: `✅ Stock adjusted for ${adjustItem.sku}! New Total: ${data.item.totalStock}` });
        fetchInventory();
        if (selectedProjectId) fetchSystemStock(selectedProjectId);
        fetchAuditLogs();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to adjust stock" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handler: Allocate Specific Item to System (Stock in Each System)
  const handleAllocateItemToSystem = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !allocateForm.sku || !allocateForm.quantity) return;
    try {
      const matched = inventoryItems.find(i => i.sku.toLowerCase() === allocateForm.sku.toLowerCase());
      const res = await fetch("/api/inventory/allocate-item-to-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          projectCode: systemStockData?.projectCode || selectedProjectId,
          clientName: systemStockData?.clientName || "Solar EPC Client",
          item: {
            sku: allocateForm.sku,
            name: matched?.name || allocateForm.sku,
            quantity: Number(allocateForm.quantity),
            unit: matched?.unit || "Units",
            warehouse: matched?.warehouse || "Central Hub (Karachi Port)",
            category: matched?.category || "EQUIPMENT",
            unitCostPkr: matched?.unitCostPkr || 0,
            notes: allocateForm.notes
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAllocateModalOpen(false);
        setAllocateForm({ sku: "", quantity: 10, notes: "" });
        setFeedbackMsg({ type: "success", text: `✅ Allocated ${allocateForm.quantity} units of ${allocateForm.sku} to ${systemStockData?.projectCode || 'System'}!` });
        fetchSystemStock(selectedProjectId);
        fetchInventory();
        fetchAuditLogs();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to allocate stock to system" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handler: Return Item from System to Warehouse (Stock in Each System)
  const handleReturnItemFromSystem = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !returnForm.sku || !returnForm.quantity) return;
    try {
      const res = await fetch("/api/inventory/return-item-from-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          projectCode: systemStockData?.projectCode || selectedProjectId,
          sku: returnForm.sku,
          quantity: Number(returnForm.quantity),
          notes: returnForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsReturnModalOpen(false);
        setReturnForm({ sku: "", maxQuantity: 0, quantity: 1, notes: "" });
        setFeedbackMsg({ type: "success", text: `🔄 Returned ${data.returnedQty} units of ${returnForm.sku} back to warehouse!` });
        fetchSystemStock(selectedProjectId);
        fetchInventory();
        fetchAuditLogs();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to return stock" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handler: Create New SKU (Warehouse Master)
  const handleCreateNewSku = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(newItemForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsNewItemModalOpen(false);
        setFeedbackMsg({ type: "success", text: `✅ New SKU registered: ${data.item.sku}` });
        fetchInventory();
        fetchAuditLogs();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to create SKU" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handler: Purge / Clear All AI Mock Data
  const handleClearMockData = async () => {
    if (!window.confirm("⚠️ Confirm Purge: Are you sure you want to clear all dummy/AI inventory stock data? This will reset all inventory items and allocations to a real zero stock slate.")) return;
    try {
      const res = await fetch("/api/inventory/clear-mock-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: "success", text: "✅ AI mock data cleared! Real stock ledger active." });
        fetchInventory();
        if (selectedProjectId) fetchSystemStock(selectedProjectId);
        fetchAuditLogs();
        fetchPurchases();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to clear mock data" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Helper to open Allocate Modal pre-filled
  const openAllocateForSku = (item) => {
    setAllocateForm({
      sku: item.sku,
      name: item.name,
      quantity: item.remainingNeeded > 0 ? item.remainingNeeded : 1,
      notes: `Allocated for ${systemStockData?.projectCode || 'System'}`
    });
    setIsAllocateModalOpen(true);
  };

  // Helper to open Return Modal pre-filled
  const openReturnForSku = (item) => {
    setReturnForm({
      sku: item.sku,
      maxQuantity: item.allocatedQuantity || 0,
      quantity: item.allocatedQuantity || 1,
      notes: `Return from ${systemStockData?.projectCode || 'System'}`
    });
    setIsReturnModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between transition-all ${
          feedbackMsg.type === "success"
            ? "bg-emerald-600 text-white border border-emerald-500"
            : "bg-red-600 text-white border border-red-500"
        }`}>
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Header & KPI Metrics Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  {t("inventory.title", "Inventory & Stock Management")}
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Live ERP
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("inventory.subtitle", "Real-time warehouse equipment inventory & live stock allocation for each solar power system")}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tab Switcher: 4 Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubTab("system")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === "system"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-4 h-4" /> {t("inventory.tabs.system", "Stock in Each System")}
            </button>
            <button
              onClick={() => setActiveSubTab("warehouse")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === "warehouse"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Warehouse className="w-4 h-4" /> {t("inventory.tabs.warehouse", "Warehouse Master")} ({inventoryItems.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab("purchasing");
                fetchPurchases();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === "purchasing"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>{t("inventory.tabs.purchasing", "Purchasing & Bills")} ({purchasesList.length})</span>
              {isSuperAdmin ? (
                <span className="text-[10px] bg-amber-700/80 text-amber-100 px-1.5 py-0.5 rounded font-mono">Vault 🔒</span>
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">Dept 📝</span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveSubTab("audit");
                fetchAuditLogs();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === "audit"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-4 h-4" /> {t("inventory.tabs.audit", "Stock Movement & Audit Log")} ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* Executive KPI Stats - Clean without duplicate PKR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("inventory.kpis.totalAssetValue", "Total Asset Value")}</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 font-mono">
              {formatPKR(inventorySummary?.totalValuationPkr || 0)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Hardware across regional warehouses</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("inventory.kpis.availableInWarehouse", "Available in Warehouse")}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-1 font-mono">
              {(inventorySummary?.totalAvailableItems || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">Units/m</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Remaining unallocated in warehouses</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("inventory.kpis.allocatedToSystems", "Allocated to Systems")}</span>
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-blue-700 mt-1 font-mono">
              {(inventorySummary?.totalAllocatedItems || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">Units/m</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Reserved in active project systems</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("inventory.kpis.lowStockAlerts", "Low Stock Alerts")}</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 font-mono">
              {inventorySummary?.lowStockCount || 0} <span className="text-xs font-normal text-slate-500">SKUs</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Below minimum safety margin</div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUB-TAB 1: STOCK IN EACH SYSTEM (PROJECT SYSTEM ALLOCATION)        */}
      {/* =================================================================== */}
      {activeSubTab === "system" && (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select System / Project:</span>
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  const p = projectsList.find(item => item.id === e.target.value);
                  if (p && onSelectProject) onSelectProject(p);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-emerald-600 min-w-[240px]"
              >
                {projectsList.length === 0 ? (
                  <option value="">No Active Projects in ERP</option>
                ) : (
                  projectsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} — {p.clientName} ({p.systemCapacityKw || 0} kWp)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* System Readiness & Action */}
            <div className="flex items-center gap-3">
              {systemStockData && (
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                  systemStockData.systemStatus === "READY_FOR_DISPATCH"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : systemStockData.systemStatus === "PARTIAL_STOCK"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}>
                  {systemStockData.systemStatus === "READY_FOR_DISPATCH" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {systemStockData.systemStatus === "PARTIAL_STOCK" && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {systemStockData.systemStatus === "STOCK_DEFICIT" && <XCircle className="w-4 h-4 text-red-600" />}
                  <span>
                    {systemStockData.systemStatus === "READY_FOR_DISPATCH" && "System Stock 100% Ready"}
                    {systemStockData.systemStatus === "PARTIAL_STOCK" && "Partial Stock in Hubs"}
                    {systemStockData.systemStatus === "STOCK_DEFICIT" && "Stock Shortage"}
                  </span>
                </div>
              )}

              {/* Add Stock to this System button */}
              {canManageStock && selectedProjectId && (
                <button
                  onClick={() => {
                    setAllocateForm({
                      sku: inventoryItems[0]?.sku || "",
                      name: inventoryItems[0]?.name || "",
                      quantity: 10,
                      notes: `Allocated to ${systemStockData?.projectCode || 'System'}`
                    });
                    setIsAllocateModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Allocate Stock to System
                </button>
              )}

              {/* Purchase Direct for System with Mandatory Bills & Photos */}
              {canUploadPurchases && selectedProjectId && (
                <button
                  onClick={openPurchaseModalForSystem}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                  title="Purchase stock specifically for this system (Mandatory photo & bill upload)"
                >
                  <Receipt className="w-3.5 h-3.5" /> Purchase for System (Upload Bills & Photos)
                </button>
              )}

              <button
                onClick={() => {
                  if (selectedProjectId) fetchSystemStock(selectedProjectId);
                  fetchInventory();
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200"
                title="Refresh Stock Check"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSystemLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* System Stock Comparison Table */}
          {systemStockData ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Equipment Stock Feasibility for {systemStockData.projectCode}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Client: <strong className="text-slate-800">{systemStockData.clientName}</strong> | System DC Capacity: <strong className="text-emerald-700">{systemStockData.systemCapacityKw} kWp</strong>
                  </p>
                </div>

                {/* System Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {canManageStock && (
                    <>
                      <button
                        onClick={handleAllocateStock}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                        title="Reserve all required system equipment from warehouses"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Reserve All BOQ Stock
                      </button>

                      <button
                        onClick={() => setIsDispatchModalOpen(true)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> Dispatch & Gate Pass
                      </button>

                      <button
                        onClick={handleReleaseStock}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
                        title="Release Reserved Stock back to warehouse"
                      >
                        Release All
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Component Feasibility Table showing Remaining on BOTH sides */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/60">
                      <th className="py-3 px-4 rounded-l-xl">Component / Equipment</th>
                      <th className="py-3 px-3">SKU & Warehouse</th>
                      <th className="py-3 px-3 text-center">Required for System</th>
                      <th className="py-3 px-3 text-center">Allocated to System</th>
                      <th className="py-3 px-3 text-center">Remaining Needed</th>
                      <th className="py-3 px-3 text-center bg-emerald-50/50">Remaining in Warehouse</th>
                      <th className="py-3 px-3 text-right">Unit Cost (PKR)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      {canManageStock && <th className="py-3 px-4 text-center rounded-r-xl">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {systemStockData.systemItems?.map((item, idx) => {
                      const req = item.requiredQuantity || 0;
                      const alloc = item.allocatedQuantity || 0;
                      const remNeeded = Math.max(0, req - alloc);
                      const availWarehouse = item.availableWarehouseStock || 0;
                      const isFulfilled = alloc >= req && req > 0;
                      const hasStockInHub = availWarehouse >= remNeeded;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {item.category}
                            {item.isCustomAllocated && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-bold">Custom</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-emerald-700 font-bold block">{item.sku}</span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">{item.name}</span>
                            <span className="text-[10px] text-slate-500 block">{item.warehouse}</span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-900 font-mono text-sm">
                            {req.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">{item.unit}</span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-blue-700 font-mono text-sm">
                            {alloc.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">
                            {remNeeded === 0 ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                                0 (Fulfilled)
                              </span>
                            ) : (
                              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                                {remNeeded.toLocaleString()} Needed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono bg-emerald-50/30">
                            <span className={`font-bold text-sm ${availWarehouse > 0 ? "text-emerald-700" : "text-red-600"}`}>
                              {availWarehouse.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block">avail in hub</span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                            PKR {(item.unitCostPkr || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {isFulfilled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3" /> 100% Allocated
                              </span>
                            ) : hasStockInHub ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                <CheckCircle2 className="w-3 h-3" /> Ready in Hub
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                                <AlertTriangle className="w-3 h-3" /> Shortage: {(remNeeded - availWarehouse).toLocaleString()}
                              </span>
                            )}
                          </td>
                          {canManageStock && (
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => openAllocateForSku(item)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-[11px] transition"
                                  title="Allocate more of this item to system"
                                >
                                  + Allocate
                                </button>
                                {alloc > 0 && (
                                  <button
                                    onClick={() => openReturnForSku(item)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition"
                                    title="Return item stock back to warehouse"
                                  >
                                    ↩ Return
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Active Allocations & Material Issue Notes (MIN) */}
              {systemStockData.allocations && systemStockData.allocations.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    Project Stock History, Allocations & Gate Passes
                  </h4>
                  <div className="space-y-2">
                    {systemStockData.allocations.map((alloc) => (
                      <div key={alloc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono">{alloc.chalanNumber || "RESERVED-SYSTEM-STOCK"}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              alloc.status === "DISPATCHED"
                                ? "bg-blue-100 text-blue-800"
                                : alloc.status === "RELEASED"
                                ? "bg-slate-200 text-slate-600"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {alloc.status}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({alloc.items?.length || 0} hardware lines allocated)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Operator: <strong>{alloc.allocatedBy}</strong> | Date: {new Date(alloc.allocatedAt).toLocaleDateString()}
                            {alloc.vehicleNo && ` | Vehicle: ${alloc.vehicleNo} (Driver: ${alloc.driverName})`}
                          </p>
                        </div>

                        {alloc.chalanNumber && (
                          <button
                            onClick={() => {
                              setActiveChalan({
                                chalanNumber: alloc.chalanNumber,
                                allocation: alloc,
                                systemStockData
                              });
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
                          >
                            <Printer className="w-3.5 h-3.5" /> View Delivery Chalan
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <Package className="w-12 h-12 mx-auto text-slate-400" />
              <h4 className="text-base font-bold text-slate-800">No Project System Selected</h4>
              <p className="text-xs max-w-md mx-auto">
                Select an active project from the dropdown above to inspect equipment stock feasibility and allocate warehouse components to the project system.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 2: CENTRAL WAREHOUSE MASTER INVENTORY                       */}
      {/* =================================================================== */}
      {activeSubTab === "warehouse" && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Category, Warehouse, Purge Mock, Add SKU */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[200px] sm:min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search SKU, Brand, Model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              {/* Warehouse Filter */}
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">All Warehouses ({warehouses.length})</option>
                {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Action Buttons for Warehouse Master */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              {inventoryItems.length > 0 && canManageStock && (
                <button
                  onClick={handleClearMockData}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition flex items-center gap-1.5"
                  title="Purge dummy AI data to maintain a zero mock ledger"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Purge Mock Data
                </button>
              )}

              {canUploadPurchases && (
                <button
                  onClick={openPurchaseModalForWarehouse}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                  title="Inward new purchase for warehouse with mandatory bill & material photos"
                >
                  <Receipt className="w-3.5 h-3.5" /> Inward Purchase (Upload Bills & Photos)
                </button>
              )}

              {canManageStock && (
                <button
                  onClick={() => setIsNewItemModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Register New SKU
                </button>
              )}
            </div>
          </div>

          {/* Master Inventory Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            {filteredInventoryItems.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Warehouse className="w-12 h-12 mx-auto text-slate-400" />
                <h4 className="text-base font-bold text-slate-800">
                  {inventoryItems.length === 0 ? "Warehouse Master is Clean (0 Dummy Items)" : "No Matching Inventory SKUs"}
                </h4>
                <p className="text-xs max-w-md mx-auto">
                  {inventoryItems.length === 0
                    ? "Zero artificial AI mock data is present. Click below to register real equipment stock received at Karachi Port, Lahore Depot, or Islamabad Logistics Hub."
                    : "No SKUs match the selected filters or search query."}
                </p>
                {canManageStock && inventoryItems.length === 0 && (
                  <button
                    onClick={() => setIsNewItemModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm inline-flex items-center gap-1.5 mt-2"
                  >
                    <Plus className="w-4 h-4" /> Register First Equipment SKU
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/60">
                      <th className="py-3 px-4 rounded-l-xl">SKU Code</th>
                      <th className="py-3 px-3">Equipment Specification</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Warehouse Hub</th>
                      <th className="py-3 px-3 text-center">Total Stock</th>
                      <th className="py-3 px-3 text-center">Allocated</th>
                      <th className="py-3 px-3 text-center bg-emerald-50/40">Remaining Available</th>
                      <th className="py-3 px-3 text-right">Unit Cost (PKR)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredInventoryItems.map((item) => {
                      const avail = (item.totalStock || 0) - (item.allocatedStock || 0);
                      const isLow = avail <= (item.minThreshold || 10);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            {item.sku}
                          </td>
                          <td className="py-3.5 px-3">
                            <strong className="text-slate-900 block">{item.name}</strong>
                            <span className="text-[11px] text-slate-400">{item.brand} • {item.model}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                            {item.warehouse}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800">
                            {item.totalStock.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-blue-700 font-bold">
                            {item.allocatedStock.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold bg-emerald-50/30">
                            <span className={`text-sm ${avail > 0 ? "text-emerald-700" : "text-red-600"}`}>
                              {avail.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-800">
                            PKR {(item.unitCostPkr || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {avail <= 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setRestockItem(item);
                                  setRestockQty(50);
                                  setIsRestockModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-[11px] transition"
                              >
                                + Restock
                              </button>
                              {canManageStock && (
                                <button
                                  onClick={() => {
                                    setAdjustItem(item);
                                    setAdjustForm({
                                      type: "ADD",
                                      quantity: 10,
                                      reason: "Physical Stock Reconciliation",
                                      notes: ""
                                    });
                                    setIsAdjustModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition"
                                  title="Adjust stock count or record physical reconciliation"
                                >
                                  ± Adjust
                                </button>
                              )}
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
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 3: STOCK MOVEMENT & AUDIT LOG (PAKISTAN STANDARD TIME)     */}
      {/* =================================================================== */}
      {activeSubTab === "audit" && (
        <div className="space-y-6">
          {/* Audit Controls & Filters */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Stock Movement & Cryptographic Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological ledger tracking exact Date, Time (PKT), User, Role, and SKU changes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Action Filter */}
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">All Movement Actions</option>
                <option value="STOCK_SKU_CREATED">SKU Created</option>
                <option value="STOCK_RESTOCKED">Restocked (+)</option>
                <option value="STOCK_ADJUSTED">Stock Adjusted (±)</option>
                <option value="STOCK_ALLOCATED_TO_SYSTEM">Allocated to System</option>
                <option value="STOCK_RETURNED_TO_WAREHOUSE">Returned to Warehouse</option>
                <option value="SYSTEM_STOCK_DISPATCHED">Dispatched & Gate Pass</option>
                <option value="MOCK_DATA_CLEARED">Mock Data Cleared</option>
              </select>

              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, SKU, action..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <button
                onClick={fetchAuditLogs}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200"
                title="Refresh Audit Trail"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Clock className="w-12 h-12 mx-auto text-slate-400" />
                <h4 className="text-base font-bold text-slate-800">No Stock Movements Logged Yet</h4>
                <p className="text-xs max-w-md mx-auto">
                  Every addition, restock, system allocation, or adjustment made by Admin, Warehouse Keeper, or Project Handler will be automatically cryptographically recorded here with exact date and time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/60">
                      <th className="py-3 px-4 rounded-l-xl">Date & Exact Time (PKT)</th>
                      <th className="py-3 px-3">Operator / User</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Action</th>
                      <th className="py-3 px-3">Item / SKU</th>
                      <th className="py-3 px-3 text-center">Movement Change</th>
                      <th className="py-3 px-3 text-center bg-emerald-50/40">Warehouse Remaining</th>
                      <th className="py-3 px-3">Reason / Details</th>
                      <th className="py-3 px-4 text-center rounded-r-xl">Security Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAuditLogs.map((log) => {
                      const d = log.details || {};
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {log.pktTimestamp || `${log.date} | ${log.time}`}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-800">
                            {log.userName || "System Operator"}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200">
                              {log.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {log.action === "STOCK_RESTOCKED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Restocked (+)
                              </span>
                            )}
                            {log.action === "STOCK_SKU_CREATED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                SKU Created
                              </span>
                            )}
                            {log.action === "STOCK_ADJUSTED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Stock Adjusted (±)
                              </span>
                            )}
                            {log.action === "STOCK_ALLOCATED_TO_SYSTEM" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Allocated to System
                              </span>
                            )}
                            {log.action === "STOCK_RETURNED_TO_WAREHOUSE" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                Returned to Hub (↩)
                              </span>
                            )}
                            {log.action === "SYSTEM_STOCK_DISPATCHED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                Dispatched (Gate Pass)
                              </span>
                            )}
                            {log.action === "MOCK_DATA_CLEARED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                Mock Purged (Zero Slate)
                              </span>
                            )}
                            {!["STOCK_RESTOCKED", "STOCK_SKU_CREATED", "STOCK_ADJUSTED", "STOCK_ALLOCATED_TO_SYSTEM", "STOCK_RETURNED_TO_WAREHOUSE", "SYSTEM_STOCK_DISPATCHED", "MOCK_DATA_CLEARED"].includes(log.action) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {log.action}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {d.sku ? (
                              <div>
                                <span className="font-mono font-bold text-emerald-700 block">{d.sku}</span>
                                {d.name && <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">{d.name}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold">
                            {d.change ? (
                              <span className={d.change.toString().startsWith("+") ? "text-emerald-700" : "text-amber-700"}>
                                {d.change}
                              </span>
                            ) : d.allocatedQuantity ? (
                              <span className="text-blue-700">+{d.allocatedQuantity} allocated</span>
                            ) : d.returnedQuantity ? (
                              <span className="text-teal-700">+{d.returnedQuantity} returned</span>
                            ) : d.totalStock ? (
                              <span>{d.totalStock} units</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold bg-emerald-50/30">
                            {d.remainingAvailable !== undefined ? (
                              <span className="text-emerald-800">{d.remainingAvailable.toLocaleString()}</span>
                            ) : d.remainingWarehouseAvailable !== undefined ? (
                              <span className="text-emerald-800">{d.remainingWarehouseAvailable.toLocaleString()}</span>
                            ) : d.warehouseAvailableStock !== undefined ? (
                              <span className="text-emerald-800">{d.warehouseAvailableStock.toLocaleString()}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                            <div>
                              {d.reason && <strong className="text-slate-800 block">{d.reason}</strong>}
                              {d.notes && <span className="text-slate-500 block truncate max-w-[220px]">{d.notes}</span>}
                              {d.projectId && <span className="text-[10px] text-blue-600 block">Project: {d.projectCode || d.projectId}</span>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-[10px] text-slate-400" title={log.signatureHash}>
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              {log.signatureHash?.substring(0, 8)}...
                            </span>
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
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 4: PURCHASING & BILLS VAULT (SUPER ADMIN & PURCHASING DEPT) */}
      {/* =================================================================== */}
      {activeSubTab === "purchasing" && (
        <div className="space-y-6">
          {/* Top Purchasing Controls & Role-Based Header */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border ${
                  isSuperAdmin
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}>
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {t("inventory.purchasingVault.title", "Purchasing, Invoices & Materials Vault")}
                    </h3>
                    {isSuperAdmin ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        {t("inventory.purchasingVault.superAdminVault", "Super Admin Vault (Full Financials)")}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-emerald-700" />
                        {t("inventory.purchasingVault.purchasingDeptIntake", "Purchasing Dept Intake Portal")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isSuperAdmin
                      ? t("inventory.purchasingVault.superAdminSubtitle", "Exclusive ledger: Audit supplier invoices, physical delivery photos, Day/Date/Year/Time PKT timestamps, and approve incoming stock.")
                      : t("inventory.purchasingVault.purchasingDeptSubtitle", "Goods intake portal: Record vendor purchases with mandatory material photos & bills to increment warehouse or system inventory.")}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {canUploadPurchases && (
                  <>
                    <button
                      onClick={() => {
                        setPurchaseForm({
                          ...initialPurchaseForm,
                          targetStream: "WAREHOUSE_MASTER",
                          targetWarehouse: "Central Hub (Karachi Port)"
                        });
                        setPurchaseFormError(null);
                        setIsPurchaseModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t("inventory.purchasingVault.recordPurchase", "Record New Purchase")}
                    </button>

                    <button
                      onClick={openPurchaseModalForWarehouse}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 flex items-center gap-1"
                      title="Direct Inward to Central Warehouse"
                    >
                      <Warehouse className="w-3.5 h-3.5 text-emerald-600" /> {t("inventory.purchasingVault.inwardWarehouse", "+ Warehouse Hub")}
                    </button>

                    <button
                      onClick={openPurchaseModalForSystem}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 flex items-center gap-1"
                      title="Direct Inward for Specific Project System"
                    >
                      <Package className="w-3.5 h-3.5 text-blue-600" /> {t("inventory.purchasingVault.inwardSystem", "+ System Stock")}
                    </button>

                    <button
                      onClick={openPurchaseModalForCommercial}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 flex items-center gap-1"
                      title="Direct Inward for Large Commercial 100kW - 1MW project"
                    >
                      <Building className="w-3.5 h-3.5 text-purple-600" /> {t("inventory.purchasingVault.inwardCommercial", "+ Commercial Mega")}
                    </button>
                  </>
                )}

                <button
                  onClick={fetchPurchases}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200"
                  title="Refresh Purchasing Ledger"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPurchasingLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Governance Callout */}
            {!isSuperAdmin ? (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Confidential Procurement Security Policy Active</strong>
                  <span>
                    Vendor invoices, high-resolution bill proofs, and unit financial pricing are securely stored and viewable strictly by <strong>Super Admins</strong>. 
                    Uploaded stock immediately increments live quantities in the respective warehouse or project system.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Super Admin Executive Audit & Verification Active</strong>
                  <span>
                    You have unrestricted access to all vendor invoice scans, delivery photos, negotiated unit rates, and origin timestamps. 
                    Use the <strong>"Verify & Approve Bill"</strong> button to stamp verified consignments into the permanent ERP financial record.
                  </span>
                </div>
              </div>
            )}

            {/* Purchasing Executive KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Inward Value</span>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 font-mono">
                  {isSuperAdmin ? formatPKR(purchasesKpis?.totalSpendPkr || 0) : "🔒 Super Admin Vault"}
                </div>
                <span className="text-[10px] text-slate-400">Total equipment procured</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Inward GRNs</span>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 font-mono">
                  {purchasesList.length} <span className="text-xs font-normal text-slate-500">Inwards</span>
                </div>
                <span className="text-[10px] text-slate-400">Recorded across 3 streams</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Super Admin Verified</span>
                <div className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1 font-mono">
                  {purchasesKpis?.verifiedCount || purchasesList.filter(p => p.verificationStatus === 'VERIFIED').length} <span className="text-xs font-normal text-emerald-600">Bills</span>
                </div>
                <span className="text-[10px] text-slate-400">Audited & sealed</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending Audit Review</span>
                <div className="text-base sm:text-lg font-extrabold text-amber-700 mt-1 font-mono">
                  {purchasesKpis?.pendingReviewCount || purchasesList.filter(p => p.verificationStatus === 'PENDING_REVIEW').length} <span className="text-xs font-normal text-amber-600">Pending</span>
                </div>
                <span className="text-[10px] text-slate-400">Awaiting Super Admin seal</span>
              </div>
            </div>

            {/* Multi-Filters: Stream, Year, Status, Search */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Target Stream Filter */}
              <select
                value={purchaseFilterStream}
                onChange={(e) => setPurchaseFilterStream(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-600"
              >
                <option value="ALL">All Inward Streams (3 Channels)</option>
                <option value="WAREHOUSE_MASTER">🏢 Warehouse Master Hubs</option>
                <option value="SYSTEM_STOCK">⚡ Stock in Each System</option>
                <option value="COMMERCIAL_PROJECT">🏭 Large Commercial Projects</option>
              </select>

              {/* Financial Year Filter */}
              <select
                value={purchaseFilterYear}
                onChange={(e) => setPurchaseFilterYear(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-600"
              >
                <option value="ALL">All Financial Years</option>
                <option value="2026">Year 2026</option>
                <option value="2025">Year 2025</option>
                <option value="2024">Year 2024</option>
              </select>

              {/* Status Filter */}
              <select
                value={purchaseFilterStatus}
                onChange={(e) => setPurchaseFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-600"
              >
                <option value="ALL">All Audit Statuses</option>
                <option value="VERIFIED">✓ Super Admin Verified</option>
                <option value="PENDING_REVIEW">⏳ Pending Audit Review</option>
              </select>

              {/* Search Query */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt #, bill #, vendor ('kahan se'), city, day or date..."
                  value={purchaseSearchQuery}
                  onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Purchasing Ledger List */}
          <div className="space-y-4">
            {filteredPurchases.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
                <Receipt className="w-12 h-12 mx-auto text-slate-400" />
                <h4 className="text-base font-bold text-slate-800">No Purchasing Records Found</h4>
                <p className="text-xs max-w-md mx-auto">
                  {purchasesList.length === 0
                    ? "No equipment purchases have been recorded yet. The purchasing department can record new purchases with mandatory physical equipment photos and official stamped supplier bills."
                    : "No purchases match the selected filter criteria."}
                </p>
                {canUploadPurchases && (
                  <button
                    onClick={() => {
                      setPurchaseForm({
                        ...initialPurchaseForm,
                        targetStream: "WAREHOUSE_MASTER"
                      });
                      setPurchaseFormError(null);
                      setIsPurchaseModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm inline-flex items-center gap-1.5 mt-2"
                  >
                    <Plus className="w-4 h-4" /> Record Inward Purchase (Photos & Bills)
                  </button>
                )}
              </div>
            ) : (
              filteredPurchases.map((purchase) => {
                const isVerified = purchase.verificationStatus === "VERIFIED";
                return (
                  <div
                    key={purchase.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
                  >
                    {/* Top Row: Stream Badge, Receipt #, Verification Status & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                          {purchase.receiptNumber}
                        </span>

                        {/* Stream Indicator */}
                        {purchase.targetStream === "WAREHOUSE_MASTER" && (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                            <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                            Warehouse Master: {purchase.targetWarehouse || purchase.targetName}
                          </span>
                        )}
                        {purchase.targetStream === "SYSTEM_STOCK" && (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                            System Stock: {purchase.projectCode || "Project"} — {purchase.clientName || "Residential"}
                          </span>
                        )}
                        {purchase.targetStream === "COMMERCIAL_PROJECT" && (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-purple-600" />
                            Commercial Mega: {purchase.projectCode || "PROJ"} — {purchase.clientName || "Commercial"}
                          </span>
                        )}
                      </div>

                      {/* Verification Badge & Super Admin Action */}
                      <div className="flex items-center gap-2">
                        {isVerified ? (
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            Super Admin Verified {purchase.verifiedAt ? `(${purchase.verifiedAt.slice(0, 10)})` : ""}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            Pending Super Admin Review
                          </span>
                        )}

                        {isSuperAdmin && !isVerified && (
                          <button
                            onClick={() => handleVerifyPurchase(purchase.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1"
                            title="Stamp and approve this purchasing receipt"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Verify & Approve
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata 4-Column Grid: When, Where From, Bill Ref, Who */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs">
                      {/* Col 1: Exact Date, Day of Week, Year, Time (PKT) */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3 text-emerald-600" /> Exact Time & Day (PKT)
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {purchase.dayOfWeek}, {purchase.dateString}
                        </div>
                        <div className="text-slate-600 font-mono mt-0.5">
                          ⏰ {purchase.timeString} PKT • Year {purchase.year}
                        </div>
                      </div>

                      {/* Col 2: Vendor & Origin ("Kahan se khareeda") */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                          <Building className="w-3 h-3 text-blue-600" /> Vendor Origin ("Kahan Se")
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {purchase.vendorName}
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          📍 {purchase.vendorLocation || "Karachi / Lahore Port"}
                          {purchase.vendorContact && ` • 📞 ${purchase.vendorContact}`}
                        </div>
                      </div>

                      {/* Col 3: Official Bill / Invoice & Financials */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                          <Receipt className="w-3 h-3 text-amber-600" /> Official Bill & Invoice
                        </div>
                        <div className="font-mono font-bold text-slate-900">
                          Invoice: <span className="text-emerald-700">{purchase.billInvoiceNo || "N/A"}</span>
                        </div>
                        <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                          PO: {purchase.poNumber || "N/A"} • {purchase.paymentMode || "Bank"}
                        </div>
                        <div className="mt-1">
                          {isSuperAdmin ? (
                            <span className="font-mono font-extrabold text-emerald-800 text-xs bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                              Total: {formatPKR(purchase.totalAmountPkr)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono bg-slate-200/70 px-2 py-0.5 rounded">
                              🔒 Total: Confidential (Super Admin)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Col 4: Uploaded By & Cryptographic Audit */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                          <User className="w-3 h-3 text-purple-600" /> Uploaded by Dept
                        </div>
                        <div className="font-bold text-slate-900">
                          {purchase.uploadedByUserName}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Role: <strong className="text-slate-700">{purchase.uploadedByRole}</strong>
                        </div>
                        {purchase.cryptoAuditHash && (
                          <div className="text-[10px] font-mono text-slate-400 mt-1 truncate" title={purchase.cryptoAuditHash}>
                            Hash: {purchase.cryptoAuditHash.substring(0, 10)}...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Purchased Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-100 rounded-xl overflow-hidden">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="py-2.5 px-3">Equipment / SKU</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3 text-center">Inward Quantity</th>
                            {isSuperAdmin && (
                              <>
                                <th className="py-2.5 px-3 text-right">Unit Rate (PKR)</th>
                                <th className="py-2.5 px-3 text-right">Line Total (PKR)</th>
                              </>
                            )}
                            <th className="py-2.5 px-3">Batch / Serial</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {purchase.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold text-emerald-700 block">{item.sku}</span>
                                <span className="text-slate-600">{item.name}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-800 text-sm">
                                +{(item.quantity || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{item.unit || "Units"}</span>
                              </td>
                              {isSuperAdmin && (
                                <>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                                    PKR {(item.unitCostPkr || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                    PKR {((item.quantity || 0) * (item.unitCostPkr || 0)).toLocaleString()}
                                  </td>
                                </>
                              )}
                              <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                                {item.batchOrSerial || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mandatory Proofs Gallery: Physical Equipment Photos & Vendor Bills */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      {/* Section 1: Physical Equipment Photos */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-emerald-600" />
                            Physical Equipment Delivery Photos ({purchase.materialPictures?.length || 0})
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                            Verified Physical Stock
                          </span>
                        </div>

                        {purchase.materialPictures && purchase.materialPictures.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                            {purchase.materialPictures.map((pic, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setLightboxImage({
                                  url: pic,
                                  title: `Physical Equipment Photo #${pIdx + 1}`,
                                  type: "Physical Equipment Arrival Proof",
                                  receiptNumber: purchase.receiptNumber,
                                  vendor: purchase.vendorName,
                                  date: `${purchase.dayOfWeek}, ${purchase.dateString} ${purchase.timeString}`
                                })}
                                className="group relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:ring-2 hover:ring-emerald-500 transition"
                              >
                                <img
                                  src={pic}
                                  alt={`Material Photo ${pIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <ZoomIn className="w-4 h-4" /> Inspect
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-red-600 italic">No physical equipment photos attached.</p>
                        )}
                      </div>

                      {/* Section 2: Official Vendor Bill / Invoice Photos (Confidential to Super Admin) */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Receipt className="w-4 h-4 text-amber-600" />
                            Official Vendor Bill / Invoices ({purchase.billPictures?.length || 0})
                          </span>
                          {isSuperAdmin ? (
                            <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                              Super Admin Audit View
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-2 py-0.5 rounded">
                              🔒 Secured in Super Admin Vault
                            </span>
                          )}
                        </div>

                        {isSuperAdmin ? (
                          purchase.billPictures && purchase.billPictures.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                              {purchase.billPictures.map((bill, bIdx) => (
                                <div
                                  key={bIdx}
                                  onClick={() => setLightboxImage({
                                    url: bill,
                                    title: `Official Vendor Bill / Invoice #${bIdx + 1}`,
                                    type: "Official Stamped Vendor Invoice Proof",
                                    receiptNumber: purchase.receiptNumber,
                                    vendor: purchase.vendorName,
                                    invoiceNo: purchase.billInvoiceNo,
                                    date: `${purchase.dayOfWeek}, ${purchase.dateString} ${purchase.timeString}`
                                  })}
                                  className="group relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:ring-2 hover:ring-amber-500 transition"
                                >
                                  <img
                                    src={bill}
                                    alt={`Bill Photo ${bIdx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                    <ZoomIn className="w-4 h-4" /> View Bill
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-red-600 italic">No bill pictures attached.</p>
                          )
                        ) : (
                          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-1">
                            <ShieldAlert className="w-5 h-5 text-slate-400 mx-auto" />
                            <div className="text-xs font-bold text-slate-700">Vendor Bill Invoices Confidential</div>
                            <div className="text-[11px] text-slate-500">
                              {purchase.billPictures?.length || 1} official invoice(s) uploaded by Purchasing Department are archived for Super Admin audit.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes if present */}
                    {purchase.notes && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong className="text-slate-800">Purchasing Department Notes:</strong> {purchase.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: RESTOCK / GOODS RECEIPT (GRN)                              */}
      {/* =================================================================== */}
      {isRestockModalOpen && restockItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Goods Receipt / Restock SKU
              </h3>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono font-bold text-emerald-700">{restockItem.sku}</span>
                <div className="font-bold text-slate-900">{restockItem.name}</div>
                <div className="text-slate-500 text-[11px]">Warehouse: {restockItem.warehouse}</div>
                <div className="text-slate-500 text-[11px]">Current Total: {restockItem.totalStock} {restockItem.unit}</div>
                <div className="text-emerald-700 font-bold text-[11px]">
                  Remaining Available: {Math.max(0, (restockItem.totalStock || 0) - (restockItem.allocatedStock || 0))} {restockItem.unit}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Received Quantity to Add ({restockItem.unit}):</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / PO / Container Ref:</label>
                <input
                  type="text"
                  placeholder="e.g. Container #KHI-2026-88, Port clearance"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: ADJUST WAREHOUSE STOCK (STOCK COUNT / CORRECTION)          */}
      {/* =================================================================== */}
      {isAdjustModalOpen && adjustItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdjustStock} className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                Physical Stock Reconciliation & Adjustment
              </h3>
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono font-bold text-emerald-700">{adjustItem.sku}</span>
                <div className="font-bold text-slate-900">{adjustItem.name}</div>
                <div className="text-slate-500 text-[11px]">Warehouse: {adjustItem.warehouse}</div>
                <div className="text-slate-700 font-bold text-[11px]">Current Total: {adjustItem.totalStock} {adjustItem.unit}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Action:</label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs"
                >
                  <option value="ADD">+ Add Stock (Received / Found Stock)</option>
                  <option value="DEDUCT">- Deduct Stock (Damaged / Missing / Audit Correction)</option>
                  <option value="SET">= Set Physical Count (Absolute Physical Inventory)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {adjustForm.type === "SET" ? `Exact Physical Count (${adjustItem.unit}):` : `Quantity to Adjust (${adjustItem.unit}):`}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment:</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs"
                >
                  <option value="Physical Stock Take Reconciliation">Physical Stock Take Reconciliation</option>
                  <option value="Damaged in Warehouse / Return">Damaged in Warehouse / Return</option>
                  <option value="Inward Shipment Discrepancy">Inward Shipment Discrepancy</option>
                  <option value="Executive Management Adjustment">Executive Management Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Audit Note:</label>
                <textarea
                  rows="2"
                  placeholder="Mandatory audit trail notes explaining this stock change"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                Apply Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: ALLOCATE ITEM TO SYSTEM (STOCK IN EACH SYSTEM)             */}
      {/* =================================================================== */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAllocateItemToSystem} className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Allocate Hardware to Project System
              </h3>
              <button type="button" onClick={() => setIsAllocateModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 space-y-0.5">
                <div className="font-bold">Destination: {systemStockData?.projectCode}</div>
                <div className="text-[11px] text-blue-700">{systemStockData?.clientName} ({systemStockData?.systemCapacityKw} kWp System)</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Hardware SKU from Warehouse:</label>
                <select
                  value={allocateForm.sku}
                  onChange={(e) => setAllocateForm({ ...allocateForm, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-xs font-bold"
                  required
                >
                  <option value="">-- Choose Warehouse Item --</option>
                  {inventoryItems.map((inv) => {
                    const avail = (inv.totalStock || 0) - (inv.allocatedStock || 0);
                    return (
                      <option key={inv.id} value={inv.sku}>
                        {inv.sku} — {inv.name} (Avail: {avail} {inv.unit})
                      </option>
                    );
                  })}
                </select>
              </div>

              {allocateForm.sku && (() => {
                const sel = inventoryItems.find(i => i.sku.toLowerCase() === allocateForm.sku.toLowerCase());
                const avail = sel ? (sel.totalStock || 0) - (sel.allocatedStock || 0) : 0;
                return (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1">
                    <div className="text-slate-600">Hub: <strong>{sel?.warehouse}</strong></div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Available in Warehouse:</span>
                      <span className={`font-bold font-mono ${avail > 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {avail} {sel?.unit}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity to Allocate:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={allocateForm.quantity}
                  onChange={(e) => setAllocateForm({ ...allocateForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Allocation Notes / Engineering Remarks:</label>
                <input
                  type="text"
                  placeholder="e.g. Additional string cables allocated for Rooftop Array 2"
                  value={allocateForm.notes}
                  onChange={(e) => setAllocateForm({ ...allocateForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                Confirm Allocation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: RETURN ITEM FROM SYSTEM BACK TO WAREHOUSE                  */}
      {/* =================================================================== */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReturnItemFromSystem} className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                Return Stock from System to Warehouse
              </h3>
              <button type="button" onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-0.5">
                <div className="font-bold">Returning from: {systemStockData?.projectCode}</div>
                <div className="text-[11px] text-amber-800">Item SKU: <strong className="font-mono">{returnForm.sku}</strong></div>
                <div className="text-[11px] text-amber-800">Currently Allocated: <strong>{returnForm.maxQuantity}</strong> units</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity to Return to Warehouse:</label>
                <input
                  type="number"
                  min="1"
                  max={returnForm.maxQuantity}
                  required
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm({ ...returnForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Return:</label>
                <input
                  type="text"
                  placeholder="e.g. Surplus panels returned after installation completion"
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                Confirm Return to Hub
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: DISPATCH EQUIPMENT & GENERATE GATE PASS                    */}
      {/* =================================================================== */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Issue Material Issue Note & Delivery Gate Pass
              </h3>
              <button onClick={() => setIsDispatchModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 space-y-1">
                <div className="font-bold">Dispatching for Project: {systemStockData?.projectCode}</div>
                <div>Client: {systemStockData?.clientName} ({systemStockData?.systemCapacityKw} kWp System)</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transporter / Carrier:</label>
                  <input
                    type="text"
                    value={dispatchForm.transporterName}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, transporterName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Registration #:</label>
                  <input
                    type="text"
                    value={dispatchForm.vehicleNo}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Full Name:</label>
                  <input
                    type="text"
                    value={dispatchForm.driverName}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Phone #:</label>
                  <input
                    type="text"
                    value={dispatchForm.driverPhone}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dispatch Notes / Gate Instructions:</label>
                <textarea
                  rows="2"
                  value={dispatchForm.notes}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchStock}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Issue Gate Pass & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: VIEW & PRINT DELIVERY CHALAN / GATE PASS                   */}
      {/* =================================================================== */}
      {activeChalan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-in fade-in my-8">
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div>
                <div className="text-xl font-extrabold text-slate-900">GreenTech Solar ERP</div>
                <div className="text-xs text-slate-500">Material Issue Note & Site Delivery Chalan</div>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold font-mono text-emerald-700">{activeChalan.chalanNumber}</div>
                <div className="text-[11px] text-slate-500">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Chalan Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <div className="text-slate-400 font-bold uppercase text-[10px]">Destination Project</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{activeChalan.systemStockData?.projectCode}</div>
                <div className="text-slate-600">{activeChalan.systemStockData?.clientName}</div>
                <div className="text-slate-500 text-[11px]">{activeChalan.systemStockData?.systemCapacityKw} kWp Solar PV System</div>
              </div>
              <div>
                <div className="text-slate-400 font-bold uppercase text-[10px]">Carrier / Logistics</div>
                <div className="font-bold text-slate-900 mt-0.5">Vehicle: {activeChalan.allocation?.vehicleNo || "LES-2026-894"}</div>
                <div className="text-slate-600">Driver: {activeChalan.allocation?.driverName || "Authorized Transporter"}</div>
                <div className="text-slate-500 text-[11px]">Phone: {activeChalan.allocation?.driverPhone || "N/A"}</div>
              </div>
            </div>

            {/* Issued Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Dispatched Equipment List:</div>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-center">Dispatched Qty</th>
                      <th className="py-2 px-3">Warehouse Hub</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeChalan.systemStockData?.systemItems?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-900">{it.name}</td>
                        <td className="py-2 px-3 font-mono text-emerald-700 font-bold">{it.sku}</td>
                        <td className="py-2 px-3 text-center font-bold font-mono text-slate-900">
                          {(it.allocatedQuantity || it.requiredQuantity || 0).toLocaleString()} {it.unit}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">{it.warehouse}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-500">
              <div>
                <div className="h-10 border-b border-dashed border-slate-300" />
                <div className="mt-1 font-bold text-slate-700">Warehouse Supervisor</div>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-300" />
                <div className="mt-1 font-bold text-slate-700">Logistics Driver</div>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-300" />
                <div className="mt-1 font-bold text-slate-700">Site Receiving Engineer</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Delivery Gate Pass
              </button>
              <button
                onClick={() => setActiveChalan(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 7: REGISTER NEW SKU (ADMIN / KEEPER / PROJECT HANDLER)        */}
      {/* =================================================================== */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateNewSku} className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Register New Inventory SKU
              </h3>
              <button type="button" onClick={() => setIsNewItemModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SKU Code:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JK-600-TOPCON"
                  value={newItemForm.sku}
                  onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category:</label>
                <select
                  value={newItemForm.category}
                  onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="PANELS">Solar PV Modules (PANELS)</option>
                  <option value="INVERTERS">Solar Inverters (INVERTERS)</option>
                  <option value="STRUCTURES">Mounting Structures</option>
                  <option value="CABLES">Solar Cables & DC/AC</option>
                  <option value="BATTERIES">Energy Storage / Batteries</option>
                  <option value="PROTECTION">Protection Switchgear & BOS</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Equipment Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jinko Tiger Neo 600W Dual-Glass Bifacial"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand:</label>
                <input
                  type="text"
                  value={newItemForm.brand}
                  onChange={(e) => setNewItemForm({ ...newItemForm, brand: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Model / Series:</label>
                <input
                  type="text"
                  value={newItemForm.model}
                  onChange={(e) => setNewItemForm({ ...newItemForm, model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Warehouse Hub:</label>
                <select
                  value={newItemForm.warehouse}
                  onChange={(e) => setNewItemForm({ ...newItemForm, warehouse: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="Central Hub (Karachi Port)">Central Hub (Karachi Port)</option>
                  <option value="Lahore Regional Logistics Depot">Lahore Regional Logistics Depot</option>
                  <option value="Islamabad Regional Logistics Yard">Islamabad Regional Logistics Yard</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit of Measure:</label>
                <input
                  type="text"
                  value={newItemForm.unit}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Stock Qty:</label>
                <input
                  type="number"
                  min="0"
                  value={newItemForm.totalStock}
                  onChange={(e) => setNewItemForm({ ...newItemForm, totalStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Cost (PKR):</label>
                <input
                  type="number"
                  min="0"
                  value={newItemForm.unitCostPkr}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unitCostPkr: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewItemModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                Register SKU
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 8: RECORD PURCHASE & INWARD STOCK (MANDATORY PHOTOS & BILLS)  */}
      {/* =================================================================== */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitPurchase}
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Goods Inward & Purchasing Record
                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200">
                      Mandatory Photos & Bills
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter supplier purchase details. Stock is added only when physical material photos AND official vendor bills are attached.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {purchaseFormError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-800 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{purchaseFormError}</span>
              </div>
            )}

            {/* Stream Selector: 3 Channels ("tarteeb mai") */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Stock Inward Channel (3 Streams):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition ${
                  purchaseForm.targetStream === "WAREHOUSE_MASTER"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}>
                  <input
                    type="radio"
                    name="targetStream"
                    value="WAREHOUSE_MASTER"
                    checked={purchaseForm.targetStream === "WAREHOUSE_MASTER"}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, targetStream: e.target.value })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="block text-xs font-bold">Central Warehouse Hub</strong>
                    <span className="text-[10px] text-slate-500">Master general storage</span>
                  </div>
                </label>

                <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition ${
                  purchaseForm.targetStream === "SYSTEM_STOCK"
                    ? "bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}>
                  <input
                    type="radio"
                    name="targetStream"
                    value="SYSTEM_STOCK"
                    checked={purchaseForm.targetStream === "SYSTEM_STOCK"}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, targetStream: e.target.value })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <strong className="block text-xs font-bold">Stock in Each System</strong>
                    <span className="text-[10px] text-slate-500">Dedicated to project</span>
                  </div>
                </label>

                <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition ${
                  purchaseForm.targetStream === "COMMERCIAL_PROJECT"
                    ? "bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}>
                  <input
                    type="radio"
                    name="targetStream"
                    value="COMMERCIAL_PROJECT"
                    checked={purchaseForm.targetStream === "COMMERCIAL_PROJECT"}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, targetStream: e.target.value })}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <strong className="block text-xs font-bold">Large Commercial Mega</strong>
                    <span className="text-[10px] text-slate-500">100kW - 1MW project site</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Target Destination Dropdown based on Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {purchaseForm.targetStream === "WAREHOUSE_MASTER" ? (
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Target Warehouse Hub:</label>
                  <select
                    value={purchaseForm.targetWarehouse}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, targetWarehouse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-600"
                  >
                    <option value="Central Hub (Karachi Port)">Central Hub (Karachi Port)</option>
                    <option value="Lahore Regional Logistics Depot">Lahore Regional Logistics Depot</option>
                    <option value="Islamabad Regional Logistics Yard">Islamabad Regional Logistics Yard</option>
                  </select>
                </div>
              ) : (
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Target Project System:
                  </label>
                  <select
                    value={purchaseForm.projectId}
                    onChange={(e) => {
                      const p = projectsList.find(item => item.id === e.target.value);
                      setPurchaseForm({
                        ...purchaseForm,
                        projectId: e.target.value,
                        projectCode: p?.projectCode || "",
                        clientName: p?.clientName || ""
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-600"
                  >
                    {projectsList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.projectCode} — {p.clientName} ({p.systemCapacityKw || 0} kWp)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Vendor Details ("Kahan se khareeda") & Live PKT Timestamp */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  Vendor Details & Location ("Kahan Se Khareeda")
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" /> Live PKT Timestamp Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vendor / Supplier Name <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jinko Solar Official Importer / SunPower Supplies"
                    value={purchaseForm.vendorName}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vendor Location / City ("Kahan Se"):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Karachi Port Qasim Wholesale / Hall Road Lahore"
                    value={purchaseForm.vendorLocation}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor Contact / Phone:</label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-9876543 / 021-34567890"
                    value={purchaseForm.vendorContact}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorContact: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method:</label>
                  <select
                    value={purchaseForm.paymentMode}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-600"
                  >
                    <option value="Bank Transfer (Verified IBAN)">Bank Transfer (Verified IBAN)</option>
                    <option value="Letter of Credit (LC Import)">Letter of Credit (LC Import)</option>
                    <option value="Pay Order / Crossed Cheque">Pay Order / Crossed Cheque</option>
                    <option value="Cash on Delivery (Signed Receipt)">Cash on Delivery (Signed Receipt)</option>
                  </select>
                </div>
              </div>

              {/* Bill & PO Reference Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Bill / Invoice Number <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-9908"
                    value={purchaseForm.billInvoiceNo}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, billInvoiceNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PO Reference Number:</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-77821"
                    value={purchaseForm.poNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, poNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-medium focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  Purchased Equipment Items & Inward Quantities:
                </label>
                <button
                  type="button"
                  onClick={handleAddItemToPurchase}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item Line
                </button>
              </div>

              <div className="space-y-2">
                {purchaseForm.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-0.5">SKU Code</label>
                      <input
                        type="text"
                        required
                        placeholder="SKU"
                        value={item.sku}
                        onChange={(e) => handlePurchaseItemChange(idx, "sku", e.target.value.toUpperCase())}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Equipment Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Description"
                        value={item.name}
                        onChange={(e) => handlePurchaseItemChange(idx, "name", e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => handlePurchaseItemChange(idx, "category", e.target.value)}
                        className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-[11px]"
                      >
                        <option value="PANELS">PANELS</option>
                        <option value="INVERTERS">INVERTERS</option>
                        <option value="STRUCTURES">STRUCTURES</option>
                        <option value="CABLES">CABLES</option>
                        <option value="BATTERIES">BATTERIES</option>
                        <option value="PROTECTION">PROTECTION</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handlePurchaseItemChange(idx, "quantity", e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs text-center"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between gap-1">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Unit Rate PKR</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitCostPkr}
                          onChange={(e) => handlePurchaseItemChange(idx, "unitCostPkr", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 text-xs text-right"
                        />
                      </div>
                      {purchaseForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromPurchase(idx)}
                          className="text-red-500 hover:text-red-700 p-1.5 mt-3"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary Bar */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between font-mono text-xs text-emerald-900">
                <span className="font-bold">Total Inward Quantity:</span>
                <span className="font-extrabold text-sm">
                  {purchaseForm.items.reduce((acc, i) => acc + Number(i.quantity || 0), 0).toLocaleString()} Units
                  {" • "} Total PKR: {formatPKR(purchaseForm.items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitCostPkr || 0)), 0))}
                </span>
              </div>
            </div>

            {/* MANDATORY PROOFS SECTION (MATERIAL PHOTOS + BILL PHOTOS) */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Mandatory Inward Proofs (Physical Photos & Bills)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Stock cannot be added without both physical equipment arrival photos and official vendor invoices.
                  </p>
                </div>

                {/* Quick Sample Attach Button for Easy Testing */}
                <button
                  type="button"
                  onClick={handleAttachSampleImages}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Attach Sample Stamped Invoice & Photos
                </button>
              </div>

              {/* Grid: Dropzone 1 (Material Photos) & Dropzone 2 (Bill Photos) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload 1: Physical Material Photos */}
                <div className={`p-4 rounded-2xl border transition ${
                  purchaseForm.materialPictures.length === 0
                    ? "bg-red-50/50 border-red-200"
                    : "bg-emerald-50/40 border-emerald-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      1. Physical Equipment Photos <span className="text-red-500">*</span>
                    </span>
                    {purchaseForm.materialPictures.length > 0 ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        ✓ {purchaseForm.materialPictures.length} Photo(s) Attached
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">
                        ⚠️ لازمی شرط (Mandatory)
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 mb-3">
                    Upload photos of unloaded solar panels, inverters, cables, and physical packaging at the depot or site.
                  </p>

                  <label className="block border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-white transition group">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mx-auto transition" />
                    <span className="text-xs font-bold text-slate-700 block mt-1">Upload Equipment Photos</span>
                    <span className="text-[10px] text-slate-400">Click or browse image files (PNG, JPG)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "materialPictures")}
                      className="hidden"
                    />
                  </label>

                  {/* Thumbnail Strip */}
                  {purchaseForm.materialPictures.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {purchaseForm.materialPictures.map((imgUrl, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={imgUrl} alt={`Material ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage("materialPictures", i)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                            title="Remove Photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload 2: Official Vendor Bill / Invoice Photos */}
                <div className={`p-4 rounded-2xl border transition ${
                  purchaseForm.billPictures.length === 0
                    ? "bg-red-50/50 border-red-200"
                    : "bg-amber-50/40 border-amber-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                      2. Official Vendor Bills / Invoices <span className="text-red-500">*</span>
                    </span>
                    {purchaseForm.billPictures.length > 0 ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                        ✓ {purchaseForm.billPictures.length} Bill(s) Attached
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">
                        ⚠️ لازمی شرط (Mandatory)
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 mb-3">
                    Upload stamped supplier invoices, GST bills, goods delivery challans, or custom clearance documents.
                  </p>

                  <label className="block border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer bg-white transition group">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-amber-600 mx-auto transition" />
                    <span className="text-xs font-bold text-slate-700 block mt-1">Upload Bill / Invoice Photos</span>
                    <span className="text-[10px] text-slate-400">Click or browse image files (PNG, JPG)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "billPictures")}
                      className="hidden"
                    />
                  </label>

                  {/* Thumbnail Strip */}
                  {purchaseForm.billPictures.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {purchaseForm.billPictures.map((imgUrl, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={imgUrl} alt={`Bill ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage("billPictures", i)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                            title="Remove Photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes / Remarks */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">Purchasing Notes / Inspection Remarks:</label>
              <textarea
                rows="2"
                placeholder="e.g. Received in good order at Port Qasim. Pallets intact with verified serial seals."
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPurchase}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                {isSubmittingPurchase ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Inwarding Stock...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Save Purchase & Add Stock
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 9: HIGH-RESOLUTION PROOF LIGHTBOX VIEWER                      */}
      {/* =================================================================== */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-4xl w-full flex items-center justify-between text-white pb-3 px-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-2 py-0.5 rounded text-white font-mono">
                  {lightboxImage.type}
                </span>
                <span className="font-mono text-emerald-400 font-bold text-xs">
                  {lightboxImage.receiptNumber}
                </span>
              </div>
              <h3 className="text-base font-bold mt-1 text-white">{lightboxImage.title}</h3>
              <p className="text-xs text-white/70">
                Vendor: <strong className="text-white">{lightboxImage.vendor}</strong>
                {lightboxImage.invoiceNo && ` • Invoice: ${lightboxImage.invoiceNo}`}
                {lightboxImage.date && ` • ${lightboxImage.date}`}
              </p>
            </div>
            <button
              onClick={() => setLightboxImage(null)}
              className="text-white/80 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              title="Close viewer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image Display */}
          <div className="max-w-4xl max-h-[75vh] w-full flex items-center justify-center p-2">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          <div className="text-center text-xs text-white/50 pt-2 font-mono">
            Encrypted Audit Vault • Click anywhere outside or close button to exit
          </div>
        </div>
      )}
    </div>
  );
}
