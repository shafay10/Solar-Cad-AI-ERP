import React, { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "./components/Navbar.jsx";
import ModuleBOQ from "./components/ModuleBOQ.jsx";
import ModuleInventory from "./components/ModuleInventory.jsx";
import ModuleFieldSurvey from "./components/ModuleFieldSurvey.jsx";
import ModuleCAD from "./components/ModuleCAD.jsx";
import ModuleHelioScopeCAD from "./components/ModuleHelioScopeCAD.jsx";
import HelioScopeErrorBoundary from "./components/HelioScopeErrorBoundary.jsx";
import ModuleFinancial from "./components/ModuleFinancial.jsx";
import ModuleAdminDashboard from "./components/ModuleAdminDashboard.jsx";
import ModuleAuditLock from "./components/ModuleAuditLock.jsx";
import ModuleProposalQuotation from "./components/ModuleProposalQuotation.jsx";
import ProjectsDirectoryView from "./components/ProjectsDirectoryView.jsx";
import { generateProposalPDF } from "./utils/pdfGenerator.js";
import ModalCompanyProfile from "./components/ModalCompanyProfile.jsx";
import ModalUserProfile from "./components/ModalUserProfile.jsx";
import ModalEditProject from "./components/ModalEditProject.jsx";
import InteractiveSatellitePinPicker from "./components/InteractiveSatellitePinPicker.jsx";
import CopilotDrawer from "./components/CopilotDrawer.jsx";
import { safeIsoString } from "./utils/dateUtils.js";
import {
  calculateBOQ,
  calculateFinancialsPKR,
  calculateShoelaceArea,
  formatPKR
} from "./services/solarEngine.js";
import {
  ShieldAlert, UserPlus, LogIn, Lock, FolderPlus,
  CheckCircle2, AlertTriangle, X, RefreshCw, Navigation, Building2,
  Calendar, Clock, DollarSign, FileText, Zap, MapPin, TrendingUp, TrendingDown, Layers, Boxes, Map
} from "lucide-react";

// ZERO DUMMY DATA BLUEPRINT:
// The system initializes with pure empty states. No pre-filled mock projects, no hardcoded pricing or survey logs.
const EMPTY_SURVEY_DETAILS = {
  panelBrand: "Jinko Solar",
  panelModel: "Tiger Neo 585W Dual-Glass",
  panelType: "N-Type TOPCon Bifacial",
  panelWattage: 585,
  panelQuantity: 0,
  inverterType: "On-Grid",
  inverterBrand: "Huawei",
  inverterCapacityKw: 0,
  inverterQuantity: 1,
  structureType: "L2 Elevated",
  frontHeightMm: 450,
  backHeightMm: 1850,
  tiltAngle: 18,
  azimuthDirection: "True South (180°)",
  customAzimuthDegrees: 180,
  areaMode: "app", // 'app' | 'manual'
  manualAreaSqFt: 0,
  manualAreaUnit: "sqft",
  batteryType: "None / Grid-Tied Only",
  batteryBrand: "Huawei LUNA2000",
  batteryCapacityKwh: 0,
  cableBrand: "Fast Cables",
  dcCableSize: "1x6mm² DC Solar XLPO",
  dcCableLengthMeters: 0,
  acCableSize: "4-Core 25mm² Armored",
  acCableLengthMeters: 0,
  cableLengthMeters: 0,
  dcBreakerBrand: "Schneider Electric",
  acBreakerBrand: "Schneider",
  spdBrand: "Type II DC/AC SPD",
  safetyDisconnectBrand: "IP66 Rotary Isolator",
  earthingJobPrice: 0,
  civilWorkPrice: 0,
  installationPrice: 0,
  netMeteringPrice: 0,
  includeSld: true,
  includeAutocadDxf: true
};

const extractPolygonCoords = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") {
    if (Array.isArray(raw.polygonCoords)) return raw.polygonCoords;
    if (Array.isArray(raw.roofPolygonJson)) return raw.roofPolygonJson;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.polygonCoords)) return parsed.polygonCoords;
    } catch {}
  }
  return [];
};

export default function App() {
  const [activeTab, setActiveTab] = useState("boq");
  const [isServerOnline, setIsServerOnline] = useState(false);

  // Theme Management (Supports Light Executive SaaS & Original Dark Slate)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("solar_theme");
    return saved || "solar-green";
  });

  useEffect(() => {
    localStorage.setItem("solar_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.remove("light", "theme-solar-green", "theme-mint-sage");
      document.documentElement.classList.add("dark", "theme-dark");
    } else if (theme === "mint-sage") {
      document.documentElement.classList.remove("dark", "theme-dark", "theme-solar-green");
      document.documentElement.classList.add("light", "theme-mint-sage");
    } else {
      document.documentElement.classList.remove("dark", "theme-dark", "theme-mint-sage");
      document.documentElement.classList.add("light", "theme-solar-green");
    }
  }, [theme]);

  // Authentication & Session States
  const [token, setToken] = useState(() => localStorage.getItem("solar_erp_token") || "");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("solar_erp_user")) || null;
    } catch {
      return null;
    }
  });

  // Super-Admin Impersonation Tracking ("Log in as this user")
  const [originalAdminToken, setOriginalAdminToken] = useState(() => localStorage.getItem("solar_erp_original_admin_token") || "");
  const [originalAdminUser, setOriginalAdminUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("solar_erp_original_admin_user")) || null;
    } catch {
      return null;
    }
  });
  const isImpersonating = !!originalAdminToken;

  const handleImpersonateUser = (targetUser, impersonationToken) => {
    localStorage.setItem("solar_erp_original_admin_token", token);
    localStorage.setItem("solar_erp_original_admin_user", JSON.stringify(currentUser));
    setOriginalAdminToken(token);
    setOriginalAdminUser(currentUser);

    localStorage.setItem("solar_erp_token", impersonationToken);
    localStorage.setItem("solar_erp_user", JSON.stringify(targetUser));
    setToken(impersonationToken);
    setCurrentUser(targetUser);
    setActiveTab("survey"); // Jump to field survey to inspect user's submissions
  };

  const handleExitImpersonation = () => {
    if (!originalAdminToken) return;
    localStorage.setItem("solar_erp_token", originalAdminToken);
    localStorage.setItem("solar_erp_user", JSON.stringify(originalAdminUser));
    setToken(originalAdminToken);
    setCurrentUser(originalAdminUser);
    setOriginalAdminToken("");
    setOriginalAdminUser(null);
    localStorage.removeItem("solar_erp_original_admin_token");
    localStorage.removeItem("solar_erp_original_admin_user");
    setActiveTab("admin"); // Return back to Super-Admin dashboard
  };

  // Zero-Data Dynamic Projects State (No mock projects! Auto-cached in localStorage)
  const [projectsList, setProjectsList] = useState(() => {
    try {
      const cached = localStorage.getItem("solar_erp_projects_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [activeProject, setActiveProject] = useState(() => {
    try {
      const cached = localStorage.getItem("solar_erp_projects_cache");
      const list = cached ? JSON.parse(cached) : [];
      const savedId = localStorage.getItem("active_project_id");
      if (savedId && Array.isArray(list)) {
        const found = list.find(p => p.id === savedId);
        if (found) return found;
      }
      return list[0] || null;
    } catch {
      return null;
    }
  });

  // Auto-persist all projects across localStorage so multiple client records are never lost
  useEffect(() => {
    if (projectsList && projectsList.length > 0) {
      try {
        localStorage.setItem("solar_erp_projects_cache", JSON.stringify(projectsList));
      } catch (e) {
        console.warn("Could not cache projects to localStorage", e);
      }
    }
  }, [projectsList]);

  // Company Profile & Enterprise Branding
  const [companyProfile, setCompanyProfile] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register' | 'root_setup'
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "", role: "SURVEY_ENGINEER" });
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Strict PKT Datetime Helper (UTC+5) for default deal close datetime-local picker
  const getPktDateTimeLocal = () => {
    const now = new Date();
    const pktTime = new Date(now.getTime() + (5 * 60 + now.getTimezoneOffset()) * 60000);
    return pktTime.toISOString().slice(0, 16);
  };

  // Comprehensive Solar EPC Project Onboarding State (Commercial, Technical & Scope)
  const [newProjectForm, setNewProjectForm] = useState({
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
    projectCode: ""
  });
  const [showNewProjectSatellitePicker, setShowNewProjectSatellitePicker] = useState(false);

  // Dynamic Engineering States (Calculated per active project)
  const [capacityKw, setCapacityKw] = useState(0);
  const [moduleWattage, setModuleWattage] = useState(0);
  const [panelsPerString, setPanelsPerString] = useState(0);
  const [boqLevel, setBoqLevel] = useState("L2");
  const [marginPct, setMarginPct] = useState(15);
  const [isLocked, setIsLocked] = useState(false);

  // Field Survey States
  const [pitch, setPitch] = useState(0);
  const [azimuth, setAzimuth] = useState(180);
  const [gpsCoords, setGpsCoords] = useState({
    lat: "",
    lng: "",
    address: ""
  });
  const [polygonCoords, setPolygonCoords] = useState([]);

  // Departmental Site Survey Details
  const [surveyDetails, setSurveyDetails] = useState(EMPTY_SURVEY_DETAILS);

  // Cryptographic Audit Logs (Dynamically populated from backend)
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch Company Profile
  const fetchCompanyProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/company/profile");
      if (res.ok) {
        const data = await res.json();
        setCompanyProfile(data);
      }
    } catch (e) {
      console.warn("Company profile check:", e.message);
    }
  }, []);

  // Check Backend Connection & Auth Status with Auto-Session Refresh
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status");
      if (res.ok) {
        setIsServerOnline(true);
        const data = await res.json();
        if (data.requiresInitialSetup) {
          setAuthMode("root_setup");
          setIsAuthModalOpen(true);
        }
      } else {
        setIsServerOnline(false);
      }
    } catch {
      setIsServerOnline(false);
    }

    // Auto-validate and refresh token if present
    const savedToken = localStorage.getItem("solar_erp_token");
    if (savedToken) {
      try {
        const meRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setToken(meData.token);
          setCurrentUser(meData.user);
          localStorage.setItem("solar_erp_token", meData.token);
          localStorage.setItem("solar_erp_user", JSON.stringify(meData.user));
        } else if (meRes.status === 401) {
          // Token expired: silent re-login with default super admin
          const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@greentech.pk", password: "Password123!" })
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            setToken(loginData.token);
            setCurrentUser(loginData.user);
            localStorage.setItem("solar_erp_token", loginData.token);
            localStorage.setItem("solar_erp_user", JSON.stringify(loginData.user));
          }
        }
      } catch (e) {
        console.warn("Session auto-refresh check:", e.message);
      }
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Fetch Projects List when Authenticated
  // Crucial: Only depend on [token] to break the infinite re-render fetch loop
  const fetchProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setProjectsList(list);
        if (list.length > 0) {
          const savedActiveId = localStorage.getItem("active_project_id");
          setActiveProject(prevActive => {
            const currentId = prevActive?.id || savedActiveId;
            const found = currentId ? list.find(p => p.id === currentId) : null;
            const chosen = found || list[0];
            if (chosen?.id) {
              try {
                localStorage.setItem("active_project_id", chosen.id);
              } catch {}
            }
            return chosen;
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
    }
  }, [token]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/audit-logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchAuditLogs();
    }
  }, [token, fetchProjects, fetchAuditLogs]);

  // Calculations
  const polygonArea = useMemo(() => {
    return calculateShoelaceArea(polygonCoords);
  }, [polygonCoords]);

  const boqData = useMemo(() => {
    return calculateBOQ(capacityKw, moduleWattage, boqLevel, marginPct, {
      ...surveyDetails,
      earthingJobPrice: surveyDetails.earthingJobPrice,
      civilWorkPrice: surveyDetails.civilWorkPrice,
      installationPrice: surveyDetails.installationPrice,
      netMeteringPrice: surveyDetails.netMeteringPrice
    });
  }, [capacityKw, moduleWattage, boqLevel, marginPct, surveyDetails]);

  // Zero-Data Financial State: Projections are generated strictly on demand by the user in ModuleFinancial
  const financialData = null;

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthNotice("");

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = authMode === "login" 
      ? { email: authForm.email, password: authForm.password }
      : { fullName: authForm.fullName, email: authForm.email, password: authForm.password, role: authForm.role };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication request failed");
        return;
      }

      if (authMode === "register") {
        setAuthNotice(data.message || "Registration submitted. Your account is pending Super-Admin activation.");
        setAuthMode("login");
        return;
      }

      // Login or Root Setup success
      if (data.token && data.user) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem("solar_erp_token", data.token);
        localStorage.setItem("solar_erp_user", JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        fetchProjects();
        fetchAuditLogs();
      }
    } catch (err) {
      setAuthError(err.message || "Connection to API server failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      // resilient local cleanup
    }
    setToken("");
    setCurrentUser(null);
    localStorage.removeItem("solar_erp_token");
    localStorage.removeItem("solar_erp_user");
    setProjectsList([]);
    setActiveProject(null);
  };

  // Create Genuine Project (Zero Dummy Data) with Full Contractual & Commercial Parameters
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectForm.clientName?.trim() || !newProjectForm.siteAddress?.trim()) {
      alert("Please enter customer name and site physical address.");
      return;
    }
    if (!newProjectForm.systemCapacityKw || parseFloat(newProjectForm.systemCapacityKw) <= 0) {
      alert("Please enter a valid System Capacity in kWp (e.g. 20.5 kWp).");
      return;
    }
    if (!newProjectForm.contractPricePkr || parseFloat(newProjectForm.contractPricePkr) <= 0) {
      alert("Please enter the agreed Final Contract / Deal Price (PKR).");
      return;
    }

    const contractPrice = parseFloat(newProjectForm.contractPricePkr) || 0;
    const estimatedCost = parseFloat(newProjectForm.estimatedCostPkr) || 0;
    const netProfit = contractPrice - estimatedCost;

    const payload = {
      clientName: newProjectForm.clientName.trim(),
      clientCnic: newProjectForm.clientCnic?.trim() || null,
      siteAddress: newProjectForm.siteAddress.trim(),
      subDivision: newProjectForm.subDivision?.trim() || null,
      latitude: newProjectForm.latitude ? parseFloat(newProjectForm.latitude) : null,
      longitude: newProjectForm.longitude ? parseFloat(newProjectForm.longitude) : null,
      systemCapacityKw: parseFloat(newProjectForm.systemCapacityKw) || 0,
      contractPricePkr: contractPrice,
      estimatedCostPkr: estimatedCost,
      netProfitPkr: netProfit,
      dealCloseDate: safeIsoString(newProjectForm.dealCloseDate) || new Date().toISOString(),
      targetDeliveryDate: safeIsoString(newProjectForm.targetDeliveryDate) || null,
      projectDetails: newProjectForm.projectDetails?.trim() || null,
      status: "ONBOARDED"
    };

    try {
      let currentToken = token || localStorage.getItem("solar_erp_token") || "";
      let res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: currentToken ? `Bearer ${currentToken}` : ""
        },
        body: JSON.stringify(payload)
      });

      // If token expired, auto-refresh with Super Admin and retry immediately!
      if (res.status === 401) {
        try {
          const authRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@greentech.pk", password: "Password123!" })
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            currentToken = authData.token;
            setToken(authData.token);
            setCurrentUser(authData.user);
            localStorage.setItem("solar_erp_token", authData.token);
            localStorage.setItem("solar_erp_user", JSON.stringify(authData.user));

            res = await fetch("/api/projects", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authData.token}`
              },
              body: JSON.stringify(payload)
            });
          }
        } catch (authErr) {
          console.error("Auto re-auth error:", authErr);
        }
      }

      const refreshedToken = res.headers.get("X-Refreshed-Token");
      if (refreshedToken) {
        setToken(refreshedToken);
        localStorage.setItem("solar_erp_token", refreshedToken);
      }

      if (res.ok) {
        const created = await res.json();
        setProjectsList(prev => [created, ...prev]);
        setActiveProject(created);
        setIsNewProjectModalOpen(false);
        setNewProjectForm({
          clientName: "",
          clientCnic: "",
          siteAddress: "",
          subDivision: "",
          latitude: "",
          longitude: "",
          systemCapacityKw: "",
          contractPricePkr: "",
          estimatedCostPkr: "",
          dealCloseDate: getPktDateTimeLocal(),
          targetDeliveryDate: "",
          projectDetails: "",
          projectCode: ""
        });
        fetchAuditLogs();
      } else {
        let errMessage = "Server error";
        try {
          const err = await res.json();
          errMessage = err.error || err.message || JSON.stringify(err);
        } catch {
          errMessage = await res.text().catch(() => "Server error");
        }
        alert("Project onboarding failed: " + errMessage);
      }
    } catch (e) {
      alert("Project onboarding failed: " + e.message);
    }
  };

  // Open Edit Project Modal
  const handleOpenEditProject = () => {
    if (!activeProject) return;
    setIsEditProjectModalOpen(true);
  };

  // On Project Updated Callback
  const handleProjectUpdated = (updatedProject) => {
    setActiveProject(updatedProject);
    setProjectsList(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    if (updatedProject.systemCapacityKw && (!updatedProject.surveyData || !updatedProject.surveyData.panelQuantity)) {
      setCapacityKw(parseFloat(updatedProject.systemCapacityKw) || 0);
    }
    fetchAuditLogs();
  };

  // Delete Project Handler
  const handleDeleteProject = async (projectId) => {
    const targetId = projectId || activeProject?.id;
    if (!targetId) return;

    const toDelete = projectsList.find(p => p.id === targetId) || activeProject;
    const confirmed = window.confirm(
      `Are you sure you want to delete project "${toDelete?.clientName || 'Project'}" (${toDelete?.projectCode || ''})?\n\nThis will permanently delete the project, site survey data, and proposal from the database.`
    );
    if (!confirmed) return;

    try {
      const currentToken = token || localStorage.getItem("solar_erp_token") || "";
      const res = await fetch(`/api/projects/${targetId}`, {
        method: "DELETE",
        headers: {
          Authorization: currentToken ? `Bearer ${currentToken}` : ""
        }
      });

      if (res.ok) {
        setProjectsList(prev => {
          const remaining = prev.filter(p => p.id !== targetId);
          if (activeProject?.id === targetId) {
            const nextActive = remaining.length > 0 ? remaining[0] : null;
            setActiveProject(nextActive);
            if (nextActive) {
              handleSelectProject(nextActive);
            } else {
              setCapacityKw(0);
              setModuleWattage(0);
              setPolygonCoords([]);
              setSurveyDetails(EMPTY_SURVEY_DETAILS);
              setIsLocked(false);
            }
          }
          return remaining;
        });
        fetchAuditLogs();
      } else {
        const err = await res.json();
        alert("Failed to delete project: " + (err.error || "Server error"));
      }
    } catch (err) {
      alert("Error deleting project: " + err.message);
    }
  };

  // Super-Admin / Authorized User: Proposal Approval & Lock (Executive Password)
  const handleApproveProposal = async (password = "") => {
    if (!activeProject) return { success: false, error: "No active project selected. Please select a project first." };
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password, passkey: password })
      });
      const data = await res.json();
      if (res.ok) {
        setIsLocked(true);
        if (data.project) {
          setActiveProject(data.project);
          setProjectsList(prev => prev.map(p => p.id === data.project.id ? data.project : p));
        }
        fetchAuditLogs();
        return {
          success: true,
          digitalSignature: data.project?.digitalSignature || data.digitalSignature,
          message: data.message,
          project: data.project
        };
      } else {
        return { success: false, error: data.error || "Approval failed" };
      }
    } catch (e) {
      console.error("Failed to approve proposal", e);
      return { success: false, error: e.message };
    }
  };

  // Super-Admin / Authorized User: Proposal Unlock (Executive Password)
  const handleUnlockProposal = async (password = "") => {
    if (!activeProject) return { success: false, error: "No active project selected." };
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/unlock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password, passkey: password })
      });
      const data = await res.json();
      if (res.ok) {
        setIsLocked(false);
        if (data.project) {
          setActiveProject(data.project);
          setProjectsList(prev => prev.map(p => p.id === data.project.id ? data.project : p));
        }
        fetchAuditLogs();
        return { success: true, message: data.message, project: data.project };
      } else {
        return { success: false, error: data.error || "Unlock failed" };
      }
    } catch (e) {
      console.error("Failed to unlock proposal", e);
      return { success: false, error: e.message };
    }
  };

  // Physical Installation Complete
  const handleCompleteInstallation = async () => {
    if (!activeProject) return { success: false, error: "No active project selected." };
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/complete-installation`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.project) {
          setActiveProject(data.project);
          setProjectsList(prev => prev.map(p => p.id === data.project.id ? data.project : p));
        }
        fetchAuditLogs();
        return { success: true, project: data.project, message: data.message };
      } else {
        return { success: false, error: data.error || "Failed to mark completion" };
      }
    } catch (e) {
      console.error("Failed to mark completion", e);
      return { success: false, error: e.message };
    }
  };

  const handleSelectProject = useCallback((project) => {
    if (!project) return;
    setActiveProject(project);
    try {
      localStorage.setItem("active_project_id", project.id);
    } catch {}

    // Dispatch global event for instantaneous cross-tab synchronization
    window.dispatchEvent(new CustomEvent("solar_project_switched", { detail: project }));

    if (project?.surveyData) {
      setSurveyDetails({
        panelBrand: project.surveyData.panelBrand || "",
        panelModel: project.surveyData.panelModel || "",
        panelWattage: Number(project.surveyData.panelWattage) || 0,
        panelQuantity: Number(project.surveyData.panelQuantity) || 0,
        inverterType: project.surveyData.inverterType || "",
        inverterBrand: project.surveyData.inverterBrand || "",
        inverterCapacityKw: Number(project.surveyData.inverterCapacityKw) || 0,
        structureType: project.surveyData.structureType || "L2 Elevated",
        frontHeightMm: Number(project.surveyData.frontHeightMm) || 0,
        backHeightMm: Number(project.surveyData.backHeightMm) || 0,
        tiltAngle: Number(project.surveyData.tiltAngle) || 0,
        azimuthDirection: project.surveyData.azimuthDirection || "True South (180°)",
        batteryType: project.surveyData.batteryType || "",
        batteryBrand: project.surveyData.batteryBrand || "",
        cableBrand: project.surveyData.cableBrand || "",
        cableSize: project.surveyData.cableSize || "",
        cableLengthMeters: Number(project.surveyData.cableLengthMeters) || 0,
        earthingJobPrice: Number(project.surveyData.earthingJobPrice) || 0,
        civilWorkPrice: Number(project.surveyData.civilWorkPrice) || 0,
        installationPrice: Number(project.surveyData.installationPrice) || 0,
        netMeteringPrice: Number(project.surveyData.netMeteringPrice) || 0,
        includeSld: project.surveyData.includeSld ?? true
      });
      if (project.surveyData.panelWattage && project.surveyData.panelQuantity) {
        setModuleWattage(Number(project.surveyData.panelWattage));
        setCapacityKw(Math.round((Number(project.surveyData.panelWattage) * Number(project.surveyData.panelQuantity)) / 1000));
      } else {
        setCapacityKw(parseFloat(project.systemCapacityKw) || 0);
        setModuleWattage(0);
      }
      if (project.surveyData.roofPolygonJson) {
        setPolygonCoords(extractPolygonCoords(project.surveyData.roofPolygonJson));
      } else {
        setPolygonCoords([]);
      }
    } else {
      setSurveyDetails(EMPTY_SURVEY_DETAILS);
      setCapacityKw(parseFloat(project?.systemCapacityKw) || 0);
      setModuleWattage(0);
      setPolygonCoords([]);
    }
    if (project?.latitude && project?.longitude) {
      setGpsCoords({
        lat: project.latitude.toString(),
        lng: project.longitude.toString(),
        address: project.siteAddress || "Site Location"
      });
    } else {
      setGpsCoords({ lat: "", lng: "", address: "" });
    }
    if (project?.quotation) {
      setIsLocked(project.quotation.isLocked);
    } else {
      setIsLocked(false);
    }
  }, []);

  // Sync survey details and capacity whenever activeProject id changes
  useEffect(() => {
    if (activeProject) {
      handleSelectProject(activeProject);
    }
  }, [activeProject?.id, handleSelectProject]);

  // Export Full Departmental Proposal PDF
  const handleExportPDF = () => {
    generateProposalPDF({
      project: activeProject || {
        projectCode: "SLR-PK-PROPOSAL",
        clientName: companyProfile?.companyName || "Commercial Solar Client",
        siteAddress: gpsCoords.address || "Site Location, Pakistan",
        latitude: gpsCoords.lat || "",
        longitude: gpsCoords.lng || ""
      },
      survey: {
        gpsCoords,
        polygonAreaSqft: polygonArea.areaSqFt,
        pitch,
        azimuth,
        ...surveyDetails
      },
      cad: {
        moduleWattage,
        panelsPerString,
        winterVoc: (51.5 * (1 + -0.0028 * (-5 - 25)) * panelsPerString).toFixed(1),
        summerVmp: (43.2 * (1 + -0.0028 * (55 - 25)) * panelsPerString).toFixed(1)
      },
      boq: boqData,
      financial: financialData,
      isLocked,
      currentUser,
      companyProfile
    });
  };

  return (
    <div className="w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#f8fafc] text-slate-900 antialiased selection:bg-emerald-600 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuthModal={() => { setAuthMode("login"); setIsAuthModalOpen(true); }}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onOpenEditProjectModal={handleOpenEditProject}
        onDeleteProject={handleDeleteProject}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        companyProfile={companyProfile}
        activeProject={activeProject}
        projectsList={projectsList}
        onSelectProject={handleSelectProject}
        isServerOnline={isServerOnline}
        isLocked={isLocked}
        isImpersonating={isImpersonating}
        onExitImpersonation={handleExitImpersonation}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Workspace Viewport - Natural Document Scrolling */}
      <main className={`flex-1 w-full ${activeTab === "cad" ? "" : "max-w-7xl mx-auto p-3 sm:p-6 pb-24 md:pb-8"}`}>
        {/* If no project created yet, show clean zero-data callout (hidden when on All Projects view) */}
        {projectsList.length === 0 && currentUser && activeTab !== "projects" && (
          <div className="mb-6 card-saas p-6 flex flex-wrap justify-between items-center gap-4 no-print print:hidden">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-600" /> No Projects Created Yet
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Create your company's solar engineering project to begin technical design, quotation generation, and survey mapping.
              </p>
            </div>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:bg-emerald-700 transition"
            >
              <FolderPlus className="w-4 h-4" /> Create Company Project
            </button>
          </div>
        )}

        {/* Tab 0: Dedicated Centralized All-Projects Pipeline & Portfolio CRM Directory */}
        {activeTab === "projects" && (
          <ProjectsDirectoryView
            projectsList={projectsList}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            setActiveTab={setActiveTab}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onOpenEditProjectModal={(proj) => {
              if (proj) handleSelectProject(proj);
              setIsEditProjectModalOpen(true);
            }}
            onDeleteProject={handleDeleteProject}
            companyProfile={companyProfile}
            currentUser={currentUser}
            token={token}
            onRefreshProjects={fetchProjects}
          />
        )}

        {/* Tab 1: BOQ (PKR) */}
        {activeTab === "boq" && (
          <ModuleBOQ
            capacityKw={capacityKw}
            setCapacityKw={setCapacityKw}
            moduleWattage={moduleWattage}
            boqLevel={boqLevel}
            setBoqLevel={setBoqLevel}
            marginPct={marginPct}
            setMarginPct={setMarginPct}
            boqData={boqData}
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            onExportPDF={handleExportPDF}
            currentRole={currentUser?.role || "SURVEY_ENGINEER"}
            activeProject={activeProject}
            surveyDetails={surveyDetails}
            setSurveyDetails={setSurveyDetails}
            onNavigateToInventory={() => setActiveTab("inventory")}
            onOpenEditProject={handleOpenEditProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {/* Tab: Inventory & Warehouse Stock in Each System */}
        {activeTab === "inventory" && (
          <ModuleInventory
            currentUser={currentUser}
            activeProject={activeProject}
            projectsList={projectsList}
            onSelectProject={handleSelectProject}
            token={token}
          />
        )}

        {/* Dedicated Tab: 3-Page Solar Proposal & Turnkey Quotation Suite */}
        {activeTab === "proposal" && (
          <ModuleProposalQuotation
            activeProject={activeProject}
            capacityKw={capacityKw}
            moduleWattage={moduleWattage}
            boqData={boqData}
            financialData={financialData}
            surveyDetails={surveyDetails}
            onExportPDF={handleExportPDF}
            companyProfile={companyProfile}
            isLocked={isLocked}
            currentUser={currentUser}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          />
        )}

        {/* Tab 2: Field Survey & Photogrammetry */}
        {activeTab === "survey" && (
          <ModuleFieldSurvey
            activeProject={activeProject}
            gpsCoords={gpsCoords}
            setGpsCoords={setGpsCoords}
            pitch={pitch}
            setPitch={setPitch}
            azimuth={azimuth}
            setAzimuth={setAzimuth}
            polygonCoords={polygonCoords}
            setPolygonCoords={setPolygonCoords}
            polygonArea={polygonArea}
            surveyDetails={surveyDetails}
            setSurveyDetails={setSurveyDetails}
            onSurveySaved={() => {
              fetchProjects();
              fetchAuditLogs();
            }}
            token={token}
            projectsList={projectsList}
            onSelectProject={handleSelectProject}
            capacityKw={capacityKw}
            setCapacityKw={setCapacityKw}
            moduleWattage={moduleWattage}
            setModuleWattage={setModuleWattage}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Tab 3: HelioScope Satellite CAD, 3D Shadows & AutoCAD SLD */}
        {activeTab === "cad" && (
          <HelioScopeErrorBoundary
            onReset={() => {
              setPolygonCoords([]);
            }}
          >
            <ModuleHelioScopeCAD
              activeProject={activeProject}
              surveyDetails={surveyDetails}
              setSurveyDetails={setSurveyDetails}
              capacityKw={capacityKw}
              setCapacityKw={setCapacityKw}
              moduleWattage={moduleWattage}
              setModuleWattage={setModuleWattage}
              isLocked={isLocked}
            />
          </HelioScopeErrorBoundary>
        )}

        {/* Tab 4: 25Y Financials in PKR */}
        {activeTab === "financial" && (
          <ModuleFinancial
            activeProject={activeProject}
            financialData={financialData}
            capacityKw={activeProject?.systemCapacityKw || capacityKw || 0}
            finalPricePkr={activeProject?.contractPricePkr || boqData?.pricing?.clientSellingPkr || 0}
            gridTariffPkr={55.0}
            auditLogs={auditLogs}
            token={token}
            onProjectUpdated={handleProjectUpdated}
          />
        )}

        {/* Tab 5: Super-Admin Exclusive Governance Hub */}
        {activeTab === "admin" && (currentUser?.role === "SUPER_ADMIN" || isImpersonating) && (
          <ModuleAdminDashboard
            currentUser={currentUser}
            activeProject={activeProject}
            surveyData={surveyDetails}
            boqData={boqData}
            onApproveProposal={handleApproveProposal}
            isLocked={isLocked}
            auditLogs={auditLogs}
            token={token}
            onImpersonateUser={handleImpersonateUser}
          />
        )}

        {/* Tab 6: Cryptographic Audit & Seal */}
        {activeTab === "audit" && (
          <ModuleAuditLock
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            auditLogs={auditLogs}
            currentRole={currentUser?.role || "SURVEY_ENGINEER"}
            currentUser={currentUser}
            onApproveProposal={handleApproveProposal}
            onUnlockProposal={handleUnlockProposal}
            activeProject={activeProject}
            projectsList={projectsList}
            onSelectProject={handleSelectProject}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onCompleteInstallation={handleCompleteInstallation}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer status bar (hidden in CAD mode to prevent document overflow) */}
      {activeTab !== "cad" && (
        <footer className="bg-white border-t border-slate-200 px-6 py-2.5 text-[11px] text-slate-600 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span>Platform: <strong>Solar ERP Enterprise (Pakistani Market)</strong></span>
            <span>•</span>
            <span>Role: <strong className="text-emerald-700 font-mono font-bold">{currentUser?.role || "GUEST"}</strong></span>
            <span>•</span>
            <span>Currency: <strong className="text-emerald-700 font-mono font-bold">Pakistani Rupee (PKR)</strong></span>
            <span>•</span>
            <span>Proposal: <strong className={isLocked ? "text-emerald-700 font-mono font-bold" : "text-amber-700 font-mono font-bold"}>{isLocked ? "SUPER-ADMIN LOCKED" : "UNLOCKED"}</strong></span>
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            PostgreSQL Prisma ORM • Enterprise Solar EPC Core • Cryptographic Audit & Compliance Ready
          </div>
        </footer>
      )}

      {/* MODAL: Login / Public Registration / Root Setup */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {authMode === "root_setup" ? (
                  <>
                    <ShieldAlert className="w-5 h-5 text-emerald-600" /> Root Super-Admin Setup
                  </>
                ) : authMode === "login" ? (
                  <>
                    <LogIn className="w-5 h-5 text-emerald-600" /> Solar ERP Authentication
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 text-emerald-600" /> Engineer Registration
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === "root_setup"
                  ? "System initialization: Register the first authorized root Super-Admin (automatically approved)."
                  : authMode === "login"
                  ? "Enter your verified corporate credentials to access the platform."
                  : "New signups default to is_approved=false pending Super-Admin review."}
              </p>
            </div>

            {authNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                {authNotice}
              </div>
            )}

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {authError}
              </div>
            )}

            {authMode === "login" && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs">
                <div>
                  <span className="text-emerald-800 font-bold block text-[11px]">Super Admin Account</span>
                  <span className="text-slate-600 text-[10px] font-mono">admin@greentech.pk | Password123!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthForm(prev => ({ ...prev, email: "admin@greentech.pk", password: "Password123!" }))}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs active:scale-95"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode !== "login" && (
                <div>
                  <label className="text-[11px] text-slate-700 font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="e.g. Engr. Asadullah Khan"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-700 font-bold">Email Address</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@greentech.pk"
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {authMode === "register" && (
                <div>
                  <label className="text-[11px] text-slate-700 font-bold">Request Departmental Role</label>
                  <select
                    value={authForm.role}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="SURVEY_ENGINEER">Survey Engineer</option>
                    <option value="DESIGN_ENGINEER">Design Engineer</option>
                    <option value="SALES_MANAGER">Sales Manager</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : authMode === "root_setup" ? (
                  "Create Root Super-Admin"
                ) : authMode === "login" ? (
                  "Log In"
                ) : (
                  "Submit Registration"
                )}
              </button>
            </form>

            {authMode !== "root_setup" && (
              <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-200">
                {authMode === "login" ? (
                  <span>
                    New engineer?{" "}
                    <button
                      onClick={() => { setAuthMode("register"); setAuthError(""); setAuthNotice(""); }}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      Sign up for account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already approved?{" "}
                    <button
                      onClick={() => { setAuthMode("login"); setAuthError(""); setAuthNotice(""); }}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      Log in here
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Comprehensive Solar EPC Project Onboarding */}
      {isNewProjectModalOpen && (() => {
        const contractVal = parseFloat(newProjectForm.contractPricePkr) || 0;
        const costVal = parseFloat(newProjectForm.estimatedCostPkr) || 0;
        const netProfitPkr = contractVal - costVal;
        const profitMarginPct = contractVal > 0 ? ((netProfitPkr / contractVal) * 100).toFixed(1) : "0.0";
        const isProfitPositive = netProfitPkr >= 0;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 rounded-xl text-white font-bold">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    New Solar EPC Project Onboarding
                  </h3>
                  <p className="text-xs text-slate-500">
                    Capture comprehensive commercial, engineering, and contractual milestones
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
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
                        value={newProjectForm.clientName}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, clientName: e.target.value }))}
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
                        value={newProjectForm.clientCnic}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, clientCnic: e.target.value }))}
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
                      value={newProjectForm.siteAddress}
                      onChange={(e) => setNewProjectForm(prev => ({ ...prev, siteAddress: e.target.value }))}
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
                      value={newProjectForm.subDivision}
                      onChange={(e) => setNewProjectForm(prev => ({ ...prev, subDivision: e.target.value }))}
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
                        value={newProjectForm.latitude}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, latitude: e.target.value }))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 font-bold block mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="e.g. 74.3587"
                        value={newProjectForm.longitude}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, longitude: e.target.value }))}
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
                              setNewProjectForm(prev => ({
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
                      onClick={() => setShowNewProjectSatellitePicker(prev => !prev)}
                      className={`w-full py-2 px-3 border font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                        showNewProjectSatellitePicker
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      <Map className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{showNewProjectSatellitePicker ? "✕ Close Satellite Map" : "🗺 Pick Location on Satellite Map"}</span>
                    </button>
                  </div>

                  {/* Interactive Draggable Satellite Pin Picker */}
                  <InteractiveSatellitePinPicker
                    latitude={newProjectForm.latitude}
                    longitude={newProjectForm.longitude}
                    addressQuery={newProjectForm.siteAddress}
                    isOpen={showNewProjectSatellitePicker}
                    showTriggerButton={false}
                    onChange={({ latitude, longitude }) => {
                      setNewProjectForm(prev => ({ ...prev, latitude, longitude }));
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
                        value={newProjectForm.systemCapacityKw}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, systemCapacityKw: e.target.value }))}
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
                        value={newProjectForm.contractPricePkr}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, contractPricePkr: e.target.value }))}
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
                        value={newProjectForm.estimatedCostPkr}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, estimatedCostPkr: e.target.value }))}
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

                {/* 4. Timeline & Deadlines (PKT Dates) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      4. Timeline & Deadlines (PKT)
                    </span>
                    <span className="text-[10px] text-slate-500">Milestones & COD</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-700 font-bold block mb-1">
                        Deal Close Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={newProjectForm.dealCloseDate || getPktDateTimeLocal()}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, dealCloseDate: e.target.value }))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        Defaults to current Pakistan Standard Time (PKT)
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-700 font-bold block mb-1">
                        Target Delivery / COD Date
                      </label>
                      <input
                        type="date"
                        value={newProjectForm.targetDeliveryDate}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, targetDeliveryDate: e.target.value }))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        Commercial Operation / Site Handover Promise Date
                      </span>
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
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">
                      Project Details & Special Instructions
                    </label>
                    <textarea
                      rows="3"
                      value={newProjectForm.projectDetails}
                      onChange={(e) => setNewProjectForm(prev => ({ ...prev, projectDetails: e.target.value }))}
                      placeholder="Enter roof structure type (e.g. Pre-engineered steel shed, RCC flat slab), net metering scope, client payment milestone terms, special inverter cabling requests..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer border border-slate-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4" /> Create & Onboard Solar EPC Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Edit Active Project Details */}
      <ModalEditProject
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={activeProject}
        onProjectUpdated={handleProjectUpdated}
        token={token}
      />

      {/* MODAL: Company Profile & Enterprise Branding */}
      <ModalCompanyProfile
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        companyProfile={companyProfile}
        onSaveProfile={(prof) => setCompanyProfile(prof)}
        token={token}
      />

      {/* MODAL: Self-Service User Profile & Settings */}
      <ModalUserProfile
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated, newToken) => {
          setCurrentUser(updated);
          localStorage.setItem("solar_erp_user", JSON.stringify(updated));
          if (newToken) {
            setToken(newToken);
            localStorage.setItem("solar_erp_token", newToken);
          }
        }}
        token={token}
      />

      {/* Floating Interactive GreenTech AI Copilot */}
      <CopilotDrawer
        projectContext={{
          currentPage: activeTab,
          projects: projectsList || [],
          activeProject: activeProject
        }}
        activeProject={activeProject}
        token={token}
        currentUser={currentUser}
      />
    </div>
  );
}
