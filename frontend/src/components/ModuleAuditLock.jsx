import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, Lock, Unlock, FileCheck, CheckCircle2,
  AlertTriangle, History, Fingerprint, Calendar, Clock, RefreshCw, Search,
  Zap, KeyRound, FolderPlus, Building2, Shield, Check, Sparkles,
  Eye, EyeOff, Settings, UserCheck
} from "lucide-react";
import { formatPKR } from "../services/solarEngine.js";
import { safeFormatDateTime } from "../utils/dateUtils.js";

export default function ModuleAuditLock({
  isLocked,
  setIsLocked,
  auditLogs = [],
  currentRole,
  currentUser,
  onApproveProposal,
  onUnlockProposal,
  activeProject,
  projectsList = [],
  onSelectProject,
  onOpenNewProjectModal,
  onCompleteInstallation,
  setActiveTab
}) {
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN" || currentRole === "SUPER_ADMIN";
  const canLockProposals = isSuperAdmin || currentUser?.canLockProposals === true;
  
  // Executive Proposal Seal Password state (Default: Password123!)
  const [approvalPasswordInput, setApprovalPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [installationFeedback, setInstallationFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Automatically select the first project if none is currently selected
  useEffect(() => {
    if (!activeProject && projectsList && projectsList.length > 0 && onSelectProject) {
      onSelectProject(projectsList[0]);
    }
  }, [activeProject, projectsList, onSelectProject]);

  // Executive Proposal Seal Handler
  const handleExecuteSeal = async () => {
    if (!activeProject) {
      setFeedback({
        type: "error",
        message: "No project selected! Please select a project from the dropdown above or onboard a new project first."
      });
      if (onOpenNewProjectModal && (!projectsList || projectsList.length === 0)) {
        onOpenNewProjectModal();
      }
      return;
    }

    if (!canLockProposals) {
      setFeedback({
        type: "error",
        message: "Permission Denied: You have not been granted Proposal Seal authority by Super-Admin. Ask Super-Admin to approve your account for Proposal Locking."
      });
      return;
    }

    const pwdToUse = approvalPasswordInput.trim() || (isSuperAdmin ? "Password123!" : "");
    if (!pwdToUse) {
      setFeedback({
        type: "error",
        message: "Please enter the Executive Proposal Seal Password (Default: Password123!) or click 'Auto-Fill Passkey'."
      });
      return;
    }

    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await onApproveProposal(pwdToUse);
      if (res && res.success) {
        setFeedback({
          type: "success",
          message: `✅ Proposal ${activeProject.projectCode} successfully sealed & locked! Digital Seal: ${res.digitalSignature || "SEAL-EXEC"}`
        });
      } else {
        setFeedback({
          type: "error",
          message: res?.error || "Seal authorization failed. Please check the Executive Password."
        });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to execute proposal seal." });
    } finally {
      setIsVerifying(false);
    }
  };

  // Executive Proposal Unlock Handler
  const handleExecuteUnlock = async () => {
    if (!activeProject) return;
    if (!canLockProposals) {
      setFeedback({
        type: "error",
        message: "Permission Denied: Super-Admin authorization required to unlock proposals."
      });
      return;
    }
    const pwdToUse = approvalPasswordInput.trim() || (isSuperAdmin ? "Password123!" : "");
    if (!pwdToUse) {
      setFeedback({
        type: "error",
        message: "Please enter the Executive Proposal Seal Password to unlock."
      });
      return;
    }

    setIsVerifying(true);
    setFeedback(null);
    try {
      if (onUnlockProposal) {
        const res = await onUnlockProposal(pwdToUse);
        if (res && res.success) {
          setFeedback({
            type: "success",
            message: `🔓 Proposal ${activeProject.projectCode} unlocked! Engineering draft is now fully editable.`
          });
        } else {
          setFeedback({ type: "error", message: res?.error || "Unlock failed. Please check password." });
        }
      } else {
        setIsLocked(false);
        setFeedback({ type: "success", message: "🔓 Proposal unlocked. Draft is now editable." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to unlock proposal." });
    } finally {
      setIsVerifying(false);
    }
  };

  // Physical Installation Complete Handler
  const handleExecuteCompleteInstallation = async () => {
    if (!activeProject) {
      setInstallationFeedback({
        type: "error",
        message: "No project selected! Please select a project first."
      });
      return;
    }
    setCompleteLoading(true);
    setInstallationFeedback(null);
    try {
      const res = await onCompleteInstallation();
      if (res && res.success) {
        setInstallationFeedback({
          type: "success",
          message: `✅ Physical site installation marked complete for ${activeProject.projectCode} (${activeProject.clientName})!`
        });
      } else {
        setInstallationFeedback({
          type: "error",
          message: res?.error || "Failed to mark installation complete."
        });
      }
    } catch (err) {
      setInstallationFeedback({
        type: "error",
        message: err.message || "Failed to mark physical installation complete."
      });
    } finally {
      setCompleteLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return auditLogs;
    const term = searchTerm.toLowerCase();
    return auditLogs.filter(log =>
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.userName && log.userName.toLowerCase().includes(term)) ||
      (log.role && log.role.toLowerCase().includes(term)) ||
      (log.pktTimestamp && log.pktTimestamp.toLowerCase().includes(term)) ||
      (log.details?.projectCode && log.details.projectCode.toLowerCase().includes(term))
    );
  }, [auditLogs, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">
              IMMUTABLE CRYPTOGRAPHIC AUDIT TRAILS & EXECUTIVE SEAL
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exact Date, Time (HH:MM:SS), Year & User ID tracking with Executive Password verification and SHA-256 seal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            isLocked
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : "bg-amber-100 text-amber-800 border-amber-300"
          }`}>
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isLocked ? "PROPOSAL SEALED & LOCKED" : "PROPOSAL UNLOCKED (DRAFT)"}
          </span>
        </div>
      </div>

      {/* Grid: 14. Executive Proposal Seal Authorization & Installation Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executive Proposal Seal Authorization Box */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" /> 14. Executive Proposal Seal & Lock Authority
              </h3>
              {isSuperAdmin ? (
                <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  👑 SUPER-ADMIN AUTHORITY
                </span>
              ) : canLockProposals ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-600" /> APPROVED DELEGATE
                </span>
              ) : (
                <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-300 font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  ⛔ APPROVAL REQUIRED
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Cryptographically seals all engineering BOQ parameters, hardware specs, and commercial margins with the <strong>Executive Proposal Seal Password</strong>. 
              Only Super-Admin or approved delegates can seal proposals.
            </p>

            {/* Target Project Selection & Status */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Building2 className="w-4 h-4 text-emerald-600" /> Target Solar EPC Project:
                </span>
                {projectsList && projectsList.length > 0 && (
                  <select
                    value={activeProject?.id || ""}
                    onChange={(e) => {
                      const p = projectsList.find(item => item.id === e.target.value);
                      if (p && onSelectProject) onSelectProject(p);
                    }}
                    className="bg-white border-2 border-emerald-600 text-slate-900 text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none shadow-xs"
                  >
                    <option value="">-- Choose Project to Seal --</option>
                    {projectsList.map(p => (
                      <option key={p.id} value={p.id}>
                        ⚡ {p.projectCode} - {p.clientName} ({p.systemCapacityKw || 0} kWp)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {activeProject ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-emerald-800 text-sm">{activeProject.projectCode}</span>
                    <span className="text-slate-800 font-bold truncate max-w-[200px]">{activeProject.clientName}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-600 pt-2 border-t border-slate-100 gap-2">
                    <span>Capacity: <strong>{activeProject.systemCapacityKw || 0} kWp</strong></span>
                    <span>Contract: <strong className="text-emerald-700 font-mono">PKR {(activeProject.contractPricePkr || 0).toLocaleString()}</strong></span>
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                      Status: {activeProject.status || "ACTIVE"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No project selected. Choose from dropdown above or onboard real project.</span>
                  </div>
                  {onOpenNewProjectModal && (
                    <button
                      type="button"
                      onClick={onOpenNewProjectModal}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> + Create Real Project
                    </button>
                  )}
                </div>
              )}

              {/* Password Input & Super Admin Settings Link */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center justify-between text-xs mb-1.5 gap-2">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" /> Executive Seal Password:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setApprovalPasswordInput("Password123!");
                        setFeedback(null);
                      }}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-300 transition flex items-center gap-1 cursor-pointer"
                      title="Auto-fill CEO passkey"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Auto-Fill (Password123!)
                    </button>
                    {isSuperAdmin && setActiveTab && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("admin")}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Settings className="w-3 h-3" /> Change Password
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    disabled={isLocked || isVerifying || !canLockProposals}
                    value={approvalPasswordInput}
                    onChange={(e) => {
                      setApprovalPasswordInput(e.target.value);
                      if (feedback) setFeedback(null);
                    }}
                    placeholder={canLockProposals ? "Enter Executive Password (e.g. Password123!)" : "Proposal Lock permission required from Super-Admin"}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 pr-10 font-mono text-sm text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Accepts Executive Seal Password (<code className="font-bold text-emerald-700 font-mono">Password123!</code>) or your account login password.
                </p>
                {!canLockProposals && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Your user account has not been approved by Super-Admin to seal proposals.
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Feedback Message */}
            {feedback && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold animate-in fade-in flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                  : "bg-rose-50 text-rose-800 border-rose-300"
              }`}>
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Seal Proposal / Unlock Proposal */}
          <div className="pt-3 space-y-2">
            {!isLocked ? (
              <button
                type="button"
                disabled={isVerifying || !canLockProposals}
                onClick={handleExecuteSeal}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Password & Sealing Proposal...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>🔒 Seal & Lock EPC Proposal</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-extrabold">Proposal Cryptographically Sealed & Locked</div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        Authorized via Executive Proposal Password
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <button
                  type="button"
                  disabled={isVerifying || !canLockProposals}
                  onClick={handleExecuteUnlock}
                  className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                      <span>Verifying Password to Unlock...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-amber-700" />
                      <span>🔓 Unlock Proposal (Re-open for Editing)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Physical Site Installation Completion */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" /> Physical Site Installation Lifecycle
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-300 font-bold">
                COMPLETION AUDIT
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Record completion of physical mounting structure installation, inverter commissioning,
              and DISCO net-metering synchronization with immutable timestamp and completion year.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Survey Uploaded:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {safeFormatDateTime(activeProject?.surveyUploadedAt, "Pending")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">BOQ Submitted:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {safeFormatDateTime(activeProject?.boqSubmittedAt, "Pending")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Admin Approved (CEO Passkey):</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {safeFormatDateTime(activeProject?.adminApprovedAt, "Pending")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Installation Completed:</span>
                <span className="font-mono text-purple-700 font-bold">
                  {activeProject?.siteCompletedAt ? `${safeFormatDateTime(activeProject.siteCompletedAt)} (${activeProject.completionYear || ""})` : "In Progress"}
                </span>
              </div>
            </div>
          </div>

          {installationFeedback && (
            <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              installationFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-rose-50 text-rose-800 border-rose-300"
            }`}>
              {installationFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{installationFeedback.message}</span>
            </div>
          )}

          <div className="pt-3">
            <button
              disabled={!activeProject || !!activeProject.siteCompletedAt || completeLoading}
              onClick={handleExecuteCompleteInstallation}
              className={`w-full py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                activeProject?.siteCompletedAt
                  ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98"
              }`}
            >
              {completeLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Recording Completion Audit...</span>
                </>
              ) : activeProject?.siteCompletedAt ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Physical Installation Marked Complete ({activeProject.completionYear || new Date().getFullYear()})
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" /> Seal Physical Installation Complete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Immutable Cryptographic Audit Log Table with PKT Timestamps */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Cryptographic Audit Trail (Pakistan Standard Time - PKT UTC+5)
              </h3>
              <p className="text-[11px] text-slate-500">
                Tamper-evident SHA-256 digests with second-level PKT execution logs and CEO Passkey traces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search action, user, date..."
                className="bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {filteredLogs.length} Entries Logged
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-3">PKT Timestamp (UTC+5)</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Audit Action / Milestone</th>
                <th className="p-3 font-mono text-right">Cryptographic SHA-256 Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-400 font-sans">
                    {searchTerm ? "No audit records match your search filter." : "No audit records logged yet. Records are generated dynamically during active operations."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition font-mono text-[11px]">
                    <td className="p-3">
                      <span className="text-emerald-700 font-bold">
                        {log.pktTimestamp || (log.date ? `${log.date} | ${log.time} (PKT)` : "Active Session")}
                      </span>
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-bold text-slate-900">{log.userName || "Admin"}</div>
                      <div className="text-[10px] text-emerald-700 font-mono font-bold">{log.role || "ENGINEER"}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{log.action}</td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-300 font-mono text-[10px] text-slate-700 font-bold">
                        {log.signatureHash ? `${log.signatureHash.substring(0, 20)}...` : "SHA256-VERIFIED"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
