import React, { useState } from "react";
import {
  Sun, Moon, Shield, CheckCircle2, Lock, Unlock, FileText,
  Compass, Cpu, Layers, TrendingUp, LogOut, User, FolderPlus,
  ShieldAlert, Activity, Menu, X, Building2, Boxes, Palette, Globe,
  Pencil, Trash2, FolderKanban
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import LanguageSelector from "./LanguageSelector.jsx";

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenAuthModal,
  onOpenNewProjectModal,
  onOpenEditProjectModal,
  onDeleteProject,
  onOpenCompanyModal,
  onOpenProfileModal,
  companyProfile,
  activeProject,
  projectsList = [],
  onSelectProject,
  isServerOnline,
  isLocked,
  isImpersonating,
  onExitImpersonation,
  theme = "solar-green",
  setTheme
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const { t, isRTL } = useLanguage();

  const navItems = [
    { id: "projects", label: t("nav.projects", "All Projects"), icon: FolderKanban, highlight: true },
    { id: "boq", label: t("nav.boq", "BOQ (PKR)"), icon: Layers },
    { id: "inventory", label: t("nav.inventory", "Inventory & Stock"), icon: Boxes },
    { id: "proposal", label: t("nav.proposal", "Quotation / Proposal (PDF)"), icon: FileText },
    { id: "cad", label: t("nav.cad", "HelioScope CAD"), icon: Sun },
    { id: "survey", label: t("nav.survey", "Field Survey"), icon: Compass },
    { id: "financial", label: t("nav.financial", "25Y Yield"), icon: TrendingUp },
    ...(isSuperAdmin ? [{ id: "admin", label: t("nav.admin", "Super-Admin"), icon: ShieldAlert, highlight: true }] : []),
    { id: "audit", label: t("nav.audit", "Audit & Seal"), icon: Shield }
  ];

  const handleProjectSelect = (projectId) => {
    const p = projectsList.find(item => item.id === projectId);
    if (p) {
      try {
        localStorage.setItem("active_project_id", p.id);
      } catch {}
      onSelectProject(p);
      window.dispatchEvent(new CustomEvent("solar_project_switched", { detail: p }));
    }
  };

  return (
    <>
      {/* Super-Admin Impersonation Notice Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
            <span>⚠️ Super-Admin Impersonation: You are inspecting the system as <u>{currentUser?.fullName}</u> ({currentUser?.role})</span>
          </div>
          <button
            onClick={onExitImpersonation}
            className="bg-slate-950 text-amber-400 hover:bg-slate-900 px-3 py-1 rounded-lg text-xs font-bold transition shadow"
          >
            Exit Impersonation & Return to Super-Admin
          </button>
        </div>
      )}

      <header className="shrink-0 sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        {/* ROW 1: Brand, Project Selector & Global Utilities (Profile, Theme, Language, Logout) */}
        <div className="w-full px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
          {/* Brand & Project Selector */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Official Circular Logo & Company Brand */}
            <div className="flex items-center gap-2 shrink-0 select-none">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xs bg-white flex items-center justify-center shrink-0">
                <img 
                  src="/assets/greentech-logo.svg" 
                  alt="Green Tech Power" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/greentech-logo.svg";
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xs sm:text-sm tracking-tight text-slate-900 leading-none whitespace-nowrap">
                  Green Tech <span className="text-emerald-700">Power</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5 hidden xs:block">
                  Solar ERP Platform
                </span>
              </div>
            </div>

            {/* Project Selector (Desktop & Tablet) */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-1.5 pl-2.5 border-l border-slate-200">
                <select
                  value={activeProject?.id || ""}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 max-w-[150px] md:max-w-[210px] truncate font-semibold cursor-pointer"
                >
                  {projectsList.length === 0 ? (
                    <option value="">No Active Projects</option>
                  ) : (
                    projectsList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.projectCode} - {p.clientName}
                      </option>
                    ))
                  )}
                </select>

                <button
                  onClick={onOpenNewProjectModal}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-emerald-700 border border-slate-200 rounded-xl transition shadow-xs cursor-pointer"
                  title="Create New Project"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>

                {activeProject && (
                  <>
                    <button
                      onClick={onOpenEditProjectModal}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl transition shadow-xs cursor-pointer"
                      title="Edit Active Project Details"
                    >
                      <Pencil className="w-4 h-4 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => onDeleteProject && onDeleteProject(activeProject.id)}
                      className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 rounded-xl transition shadow-xs cursor-pointer"
                      title="Delete Active Project"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Account, Company Profile & Status & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto pr-1 sm:pr-2">
            {/* Global Multi-Language Switcher (Top Bar) */}
            <LanguageSelector />

            {/* Company Profile Settings Button (Super-Admin) */}
            {isSuperAdmin && (
              <button
                onClick={onOpenCompanyModal}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl transition cursor-pointer"
                title="Company Profile & Branding"
              >
                <Building2 className="w-4 h-4" />
              </button>
            )}

            {/* iPhone-Style Dark / Light Mode Switch */}
            <button
              type="button"
              onClick={() => {
                const nextTheme = theme === "dark" ? "solar-green" : "dark";
                if (setTheme) setTheme(nextTheme);
              }}
              className={`relative inline-flex items-center h-7 w-14 rounded-full p-0.5 transition-all duration-300 focus:outline-none cursor-pointer shadow-inner border ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-700"
                  : "bg-slate-200 border-slate-300 hover:bg-slate-300"
              }`}
              title={theme === "dark" ? "Switch to Light Mode (☀️)" : "Switch to Cyber Dark Mode (🌙)"}
              aria-label="Toggle Dark Mode"
            >
              <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none select-none">
                <Sun className={`w-3 h-3 text-amber-500 transition-opacity duration-200 ${theme === "dark" ? "opacity-40" : "opacity-0"}`} />
                <Moon className={`w-3 h-3 text-cyan-400 transition-opacity duration-200 ${theme === "dark" ? "opacity-0" : "opacity-40"}`} />
              </div>

              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-out z-10 ${
                  theme === "dark"
                    ? "translate-x-7 bg-slate-800 text-cyan-300 border border-cyan-500/40"
                    : "translate-x-0 bg-white text-amber-500 border border-slate-200"
                }`}
              >
                {theme === "dark" ? (
                  <Moon className="w-3 h-3" />
                ) : (
                  <Sun className="w-3 h-3" />
                )}
              </span>
            </button>

            {/* Theme Selector Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                title="Change Color Theme"
              >
                <Palette className="w-4 h-4 text-emerald-600" />
                <span className="hidden 2xl:inline text-[11px]">
                  {theme === "solar-green" ? "☀️ Light SaaS" : theme === "dark" ? "🌙 Cyber Dark" : "🍃 Soft Mint"}
                </span>
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs font-bold">
                  <div className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Display Color Theme
                  </div>
                  <button
                    onClick={() => {
                      if (setTheme) setTheme("solar-green");
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 transition cursor-pointer ${
                      theme === "solar-green" ? "text-emerald-700 font-extrabold bg-emerald-50" : "text-slate-700"
                    }`}
                  >
                    <span>☀️</span>
                    <div>
                      <div>Executive Light (SaaS Green & White)</div>
                      <span className="text-[10px] font-normal text-slate-400">Eye-comfort clean cards (Recommended)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (setTheme) setTheme("dark");
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 transition cursor-pointer ${
                      theme === "dark" ? "text-cyan-700 font-extrabold bg-cyan-50" : "text-slate-700"
                    }`}
                  >
                    <span>🌙</span>
                    <div>
                      <div>Cyber Dark Slate (Original Theme)</div>
                      <span className="text-[10px] font-normal text-slate-400">High-tech night mode with cyan glow</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (setTheme) setTheme("mint-sage");
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 transition cursor-pointer ${
                      theme === "mint-sage" ? "text-emerald-700 font-extrabold bg-emerald-50" : "text-slate-700"
                    }`}
                  >
                    <span>🍃</span>
                    <div>
                      <div>Soft Mint & Sage</div>
                      <span className="text-[10px] font-normal text-slate-400">Ultra-soft soothing light</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Server status pill */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isServerOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span className="text-slate-600 font-mono text-[10px]">
                {isServerOnline ? "API ONLINE" : "OFFLINE"}
              </span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* User Profile Pill */}
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-left cursor-pointer shadow-xs"
                  title="My Profile & Settings"
                >
                  <div className="flex flex-col text-right hidden sm:flex">
                    <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px] md:max-w-[160px]">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] text-emerald-700 leading-tight truncate max-w-[130px] md:max-w-[160px] font-semibold">
                      {currentUser.designation || (currentUser.role === "SUPER_ADMIN" ? "Chief Executive Officer (CEO)" : currentUser.role)}
                    </span>
                  </div>
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-8 h-8 rounded-lg object-cover border border-emerald-300 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "S"}
                    </div>
                  )}
                </button>

                {/* Explicit Logout Action Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out / Logout"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Login / Sign Up</span><span className="xs:hidden">Login</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: ERP Workflow Module Tabs (Desktop & Tablet) */}
        <div className="hidden md:flex w-full px-3 sm:px-6 py-1.5 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1 shrink-0">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                      : item.highlight
                      ? "text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {item.label}
                </button>
              );
            })}
          </nav>

          {/* Active Project Quick Information & Status Badges */}
          {activeProject && (
            <div className="hidden xl:flex items-center gap-2 text-xs shrink-0 pl-3 border-l border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Project:</span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px] shadow-xs"
                title={`Contracted System Capacity: ${activeProject.systemCapacityKw || 0} kWp`}
              >
                ⚡ {activeProject.systemCapacityKw || 0} kWp
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[11px] shadow-xs"
                title={`Current Workflow State: ${activeProject.status || "ONBOARDED"}`}
              >
                Status: {activeProject.status || "ONBOARDED"}
              </span>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[11px] shadow-xs">
                  <Lock className="w-3 h-3 text-amber-600" /> Audit Sealed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-600 font-medium border border-slate-200 text-[11px] shadow-xs">
                  <Unlock className="w-3 h-3 text-slate-500" /> Active Draft
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-2">
            {/* Mobile Project Selector */}
            {currentUser && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <select
                  value={activeProject?.id || ""}
                  onChange={(e) => {
                    handleProjectSelect(e.target.value);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-white text-slate-800 border border-slate-300 text-xs rounded-lg px-2.5 py-2 w-full focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  {projectsList.length === 0 ? (
                    <option value="">No Active Projects</option>
                  ) : (
                    projectsList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.projectCode} - {p.clientName}
                      </option>
                    ))
                  )}
                </select>
                <button
                  onClick={() => {
                    onOpenNewProjectModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs cursor-pointer"
                  title="New Project"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Nav Links */}
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 text-white font-bold shadow-xs"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Language & Theme Row */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>{t("nav.selectLanguage", "Language")}:</span>
              </div>
              <LanguageSelector />
            </div>

            {currentUser && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenProfileModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-100 cursor-pointer"
                >
                  <User className="w-4 h-4 text-emerald-600" /> My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2 px-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-1.5 hover:bg-red-100 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Navigation Bar for Field Engineers */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-1 py-1 flex justify-around items-center overflow-x-auto pb-[calc(env(safe-area-inset-bottom,0px)+4px)] shadow-lg">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition min-w-[50px] min-h-[46px] relative cursor-pointer ${
                isActive
                  ? "text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5 flex-shrink-0" />
              <span className="text-[9px] tracking-tight truncate max-w-[54px] font-bold">{item.label.split(" ")[0]}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-600 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}

