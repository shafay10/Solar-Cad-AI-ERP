import React, { useState, useEffect } from "react";
import {
  ShieldAlert, UserCheck, UserX, Clock, Cpu, FileCheck, CheckCircle2,
  Lock, TrendingUp, AlertTriangle, Key, Users, Activity, Eye, FileText,
  UserPlus, UserCog, Trash2, ArrowRightLeft, Shield, X, RefreshCw, LogIn,
  EyeOff, KeyRound, Check
} from "lucide-react";
import { formatPKR } from "../services/solarEngine.js";

export default function ModuleAdminDashboard({
  currentUser,
  activeProject,
  surveyData,
  boqData,
  onApproveProposal,
  isLocked,
  auditLogs,
  token,
  onImpersonateUser
}) {
  const [usersList, setUsersList] = useState([]);
  const [sessionsList, setSessionsList] = useState([]);
  const [activeTab, setActiveTab] = useState("approvals");
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Executive Proposal Seal Password & Delegation State
  const [approvalPasswordData, setApprovalPasswordData] = useState({
    approvalPassword: "Password123!",
    updatedAt: null,
    updatedBy: ""
  });
  const [newApprovalPasswordInput, setNewApprovalPasswordInput] = useState("");
  const [showApprovalPassword, setShowApprovalPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // 3 Super-Admin Quota State
  const [adminQuota, setAdminQuota] = useState({ count: 1, max: 3, quotaAvailable: true });

  // Modals for User CRUD & Admin Replacement
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isReplaceAdminModalOpen, setIsReplaceAdminModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "SURVEY_ENGINEER"
  });

  const [editUserForm, setEditUserForm] = useState({
    id: "",
    fullName: "",
    email: "",
    password: "",
    role: "SURVEY_ENGINEER",
    isApproved: true
  });

  const [replaceForm, setReplaceForm] = useState({
    outgoingAdminId: "",
    incomingUserId: "",
    incomingAdminDetails: { fullName: "", email: "", password: "" },
    mode: "TRANSFER_TO_USER",
    transferReason: "Administrative Handover"
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsersList(data);
          const count = data.filter(u => u.role === "SUPER_ADMIN").length;
          setAdminQuota({ count, max: 3, quotaAvailable: count < 3 });
        } else if (data.users) {
          setUsersList(data.users);
          setAdminQuota({
            count: data.superAdminCount,
            max: data.maxSuperAdmins || 3,
            quotaAvailable: data.quotaAvailable
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/auth/sessions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessionsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchApprovalPassword = async () => {
    try {
      const res = await fetch("/api/admin/approval-password", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApprovalPasswordData(data);
      }
    } catch (err) {
      console.error("Failed to fetch approval password", err);
    }
  };

  const handleUpdateApprovalPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newApprovalPasswordInput || newApprovalPasswordInput.trim().length < 4) {
      setErrorMessage("New Proposal Seal Password must be at least 4 characters.");
      return;
    }
    setPasswordLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/approval-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newApprovalPasswordInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update seal password.");
      } else {
        setActionSuccess("Proposal Seal Password updated successfully! Authorized users can now seal proposals with this password.");
        setApprovalPasswordData(prev => ({
          ...prev,
          approvalPassword: newApprovalPasswordInput.trim(),
          updatedAt: data.updatedAt
        }));
        setNewApprovalPasswordInput("");
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to update seal password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleLockPermission = async (userId, currentStatus, userName) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/auth/users/${userId}/toggle-lock-permission`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ canLockProposals: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update seal authority.");
      } else {
        setActionSuccess(data.message || `Seal authority updated for ${userName}`);
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, canLockProposals: !currentStatus } : u));
        setTimeout(() => setActionSuccess(null), 3500);
        fetchUsers();
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to toggle seal permission");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (approvalPasswordData.approvalPassword) {
      navigator.clipboard.writeText(approvalPasswordData.approvalPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  useEffect(() => {
    if (token && currentUser?.role === "SUPER_ADMIN") {
      fetchUsers();
      fetchSessions();
      fetchApprovalPassword();
    }
  }, [token, currentUser]);

  // Generate AI Executive Summary Bot text
  useEffect(() => {
    if (activeProject) {
      const generateSummary = async () => {
        try {
          const res = await fetch("/api/ai/executive-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientName: activeProject.clientName,
              projectCode: activeProject.projectCode,
              capacityKw: boqData?.capacityKw || 150,
              panelBrand: surveyData?.panelBrand || "Jinko Solar",
              panelModel: surveyData?.panelModel || "585W N-Type TOPCon",
              inverterBrand: surveyData?.inverterBrand || "Huawei",
              inverterType: surveyData?.inverterType || "On-Grid",
              structureType: surveyData?.structureType || "L2 Elevated",
              tiltAngle: surveyData?.tiltAngle || 18,
              clientSellingPkr: boqData?.pricing?.clientSellingPkr,
              marginPkr: boqData?.pricing?.marginPkr,
              cableBrand: surveyData?.cableBrand || "Fast Cables"
            })
          });
          if (res.ok) {
            const data = await res.json();
            setAiSummary(data.summary);
          }
        } catch (e) {
          console.error("AI Summary generation failed", e);
        }
      };
      generateSummary();
    }
  }, [activeProject, surveyData, boqData]);

  const handleApproveUser = async (userId, approveState) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/auth/users/${userId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved: approveState })
      });
      if (res.ok) {
        setActionSuccess(approveState ? "User activated successfully" : "User deactivated");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchUsers();
      }
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update role");
      } else {
        setActionSuccess("Role updated successfully");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchUsers();
      }
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user ${userName}?`)) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to delete user");
      } else {
        setActionSuccess(data.message || "User deleted");
        setTimeout(() => setActionSuccess(null), 3000);
        fetchUsers();
      }
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUserForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to create user");
      } else {
        setActionSuccess("User created and activated!");
        setTimeout(() => setActionSuccess(null), 3000);
        setIsAddUserModalOpen(false);
        setNewUserForm({ fullName: "", email: "", password: "", role: "SURVEY_ENGINEER" });
        fetchUsers();
      }
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerImpersonate = async (targetUser) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch(`/api/auth/impersonate/${targetUser.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to establish impersonation session.");
        return;
      }
      if (onImpersonateUser) {
        onImpersonateUser(data.impersonatedUser, data.token, data.originalAdmin);
      }
    } catch (err) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/users/replace-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(replaceForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to replace admin");
      } else {
        setActionSuccess(data.message || "Admin seat transferred successfully!");
        setTimeout(() => setActionSuccess(null), 4000);
        setIsReplaceAdminModalOpen(false);
        fetchUsers();
      }
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditUserModal = (u) => {
    setEditUserForm({
      id: u.id,
      fullName: u.fullName || "",
      email: u.email || "",
      password: "",
      role: u.role || "SURVEY_ENGINEER",
      isApproved: u.isApproved
    });
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        fullName: editUserForm.fullName,
        email: editUserForm.email,
        role: editUserForm.role,
        isApproved: editUserForm.isApproved
      };
      if (editUserForm.password && editUserForm.password.trim()) {
        payload.password = editUserForm.password.trim();
      }

      const res = await fetch(`/api/auth/users/${editUserForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update user credentials.");
      } else {
        setActionSuccess("User credentials and role updated successfully!");
        setTimeout(() => setActionSuccess(null), 3000);
        setIsEditUserModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const pendingUsers = usersList.filter(u => !u.isApproved);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-wide">
              SUPER-ADMIN GOVERNANCE & CONTROL HUB
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-300 font-bold">
              EXCLUSIVE ACCESS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Triple access tier: User approvals, cross-account session audits, and full PKR internal margin visibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingUsers.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl text-amber-800 text-xs font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {pendingUsers.length} User Signup{pendingUsers.length > 1 ? "s" : ""} Pending Approval
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "approvals"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Users className="w-4 h-4" /> User Approvals & Access ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "sessions"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" /> Cross-Account Session Audits ({sessionsList.length})
        </button>

        <button
          onClick={() => setActiveTab("ai-bot")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "ai-bot"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Cpu className="w-4 h-4" /> AI Executive Summary Bot & Seal
        </button>

        <button
          onClick={() => setActiveTab("margins")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "margins"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Internal Cost vs Selling Margins (PKR)
        </button>

        <button
          onClick={() => setActiveTab("security-settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "security-settings"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <KeyRound className="w-4 h-4" /> Seal Password & Delegation
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {actionSuccess}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> {errorMessage}
        </div>
      )}

      {/* TAB 1: USER APPROVALS & MULTI-TIER RBAC */}
      {activeTab === "approvals" && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Multi-Tier RBAC & User Directory
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border font-bold ${
                  adminQuota.count >= 3
                    ? "bg-rose-50 text-rose-700 border-rose-300"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300"
                }`}>
                  Strict Super-Admin Quota: {adminQuota.count} / 3 Active
                </span>
                <span className="text-[10px] text-slate-500">
                  (Unapproved users gated from login)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <UserPlus className="w-3.5 h-3.5" /> + Add / Invite User
              </button>

              <button
                onClick={() => {
                  const superAdmins = usersList.filter(u => u.role === "SUPER_ADMIN");
                  if (superAdmins.length > 0) {
                    setReplaceForm(prev => ({ ...prev, outgoingAdminId: superAdmins[0].id }));
                  }
                  setIsReplaceAdminModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" /> Replace Admin / Transfer Seat
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Departmental Role</th>
                  <th className="p-3">Approval Status</th>
                  <th className="p-3">Seal Authority</th>
                  <th className="p-3">Registration Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400">
                      No registered users in the database yet.
                    </td>
                  </tr>
                ) : (
                  usersList.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            className="w-7 h-7 rounded-full object-cover border border-emerald-500 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                            {u.fullName ? u.fullName.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{u.fullName}</span>
                            {u.role === "SUPER_ADMIN" && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded border border-emerald-300 font-bold">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {u.designation || (u.role === "SUPER_ADMIN" ? "Chief Executive Officer (CEO)" : "Solar Engineer")}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">{u.email}</td>
                      <td className="p-3">
                        <select
                          disabled={loading || u.id === currentUser?.id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-white border border-slate-300 text-slate-800 rounded-lg p-1 text-[11px] font-mono focus:outline-none focus:border-emerald-600 font-medium"
                        >
                          <option value="SURVEY_ENGINEER">Survey Engineer</option>
                          <option value="DESIGN_ENGINEER">Design Engineer</option>
                          <option value="SALES_MANAGER">Sales Manager</option>
                          <option value="SUPER_ADMIN">Super-Admin (Quota: 3)</option>
                        </select>
                      </td>
                      <td className="p-3">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE & APPROVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" /> PENDING REVIEW
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {u.role === "SUPER_ADMIN" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            <Shield className="w-3 h-3 text-emerald-600" /> Super-Admin
                          </span>
                        ) : u.canLockProposals ? (
                          <button
                            disabled={loading}
                            onClick={() => handleToggleLockPermission(u.id, true, u.fullName)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 px-2.5 py-1 rounded-lg border border-emerald-300 transition group"
                            title="Approved to seal proposals with executive password. Click to revoke."
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 group-hover:hidden" />
                            <X className="w-3 h-3 text-rose-600 hidden group-hover:inline" />
                            <span className="group-hover:hidden">Authorized</span>
                            <span className="hidden group-hover:inline">Revoke</span>
                          </button>
                        ) : (
                          <button
                            disabled={loading}
                            onClick={() => handleToggleLockPermission(u.id, false, u.fullName)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 px-2.5 py-1 rounded-lg border border-slate-300 transition"
                            title="Grant proposal sealing permission to this user"
                          >
                            <Key className="w-3 h-3 text-slate-400" />
                            <span>Grant Seal</span>
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Super-Admin Impersonation: Log in as this user */}
                          {u.id !== currentUser?.id && u.isApproved && (
                            <button
                              onClick={() => handleTriggerImpersonate(u)}
                              className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition flex items-center gap-1 font-bold"
                              title={`Log in as ${u.fullName} to inspect field surveys`}
                            >
                              <LogIn className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden sm:inline">Impersonate</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditUserModal(u)}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition flex items-center gap-1 font-bold"
                            title="Super-Admin: Edit User Credentials, Password, Email & Role"
                          >
                            <UserCog className="w-3.5 h-3.5 text-slate-600" />
                            <span>Edit</span>
                          </button>

                          {u.isApproved ? (
                            <button
                              disabled={loading || u.id === currentUser?.id}
                              onClick={() => handleApproveUser(u.id, false)}
                              className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition disabled:opacity-40 font-medium"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              disabled={loading}
                              onClick={() => handleApproveUser(u.id, true)}
                              className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition shadow-xs"
                            >
                              Approve
                            </button>
                          )}

                          {u.id !== currentUser?.id && (
                            <button
                              disabled={loading}
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete user record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-ACCOUNT SESSION AUDITS */}
      {activeTab === "sessions" && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Immutable Cross-Account Session Audits
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Exact Login & Logout Tracking with Duration in Minutes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Login Timestamp</th>
                  <th className="p-3">Logout Timestamp</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {sessionsList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400">
                      No active or recorded sessions found.
                    </td>
                  </tr>
                ) : (
                  sessionsList.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition font-mono text-[11px]">
                      <td className="p-3 font-sans">
                        <div className="font-bold text-slate-900">{s.user?.fullName || "User Session"}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">{s.user?.role || "ENGINEER"}</div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {new Date(s.loginTimestamp).toLocaleString("en-PK")}
                      </td>
                      <td className="p-3 text-slate-500">
                        {s.logoutTimestamp ? new Date(s.logoutTimestamp).toLocaleString("en-PK") : "Active Session"}
                      </td>
                      <td className="p-3 text-emerald-700 font-bold">
                        {s.sessionDurationMinutes ? `${s.sessionDurationMinutes} mins` : "In Progress"}
                      </td>
                      <td className="p-3 text-slate-500">{s.ipAddress || "127.0.0.1"}</td>
                      <td className="p-3">
                        {s.logoutTimestamp ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300 font-bold">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                            ONLINE NOW
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AI EXECUTIVE SUMMARY BOT & 1-CLICK APPROVAL */}
      {activeTab === "ai-bot" && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" /> AI Executive Summary Bot
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-300 font-bold">
              AUTOMATED SITE CONDENSER
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-emerald-800 uppercase tracking-wider">
                Target Project: {activeProject?.clientName || "Current Project"} ({activeProject?.projectCode || "SLR-PK-2026"})
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                1-Paragraph Executive Synthesis
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-sans italic bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              "{aiSummary || "Generating instant AI executive summary from engineering site survey, electrical sizing, and cost metrics..."}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">System DC Capacity</span>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                {boqData?.capacityKw || 150} kWp
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Turnkey Client Value</span>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                {formatPKR(boqData?.pricing?.clientSellingPkr)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Internal Gross Margin</span>
              <div className="text-lg font-bold font-mono text-amber-700 mt-1">
                {formatPKR(boqData?.pricing?.marginPkr)} ({boqData?.pricing?.marginPct || 15}%)
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Super-Admin digital signature locks all capacity, BOQ, and pricing schedules.</span>
            </div>

            <button
              disabled={isLocked || !activeProject}
              onClick={onApproveProposal}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-sm ${
                isLocked
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isLocked ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Proposal Digitally Sealed & Locked
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  1-Click Instant Executive Approval & Seal
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: INTERNAL COST VS CLIENT SELLING PRICE (PKR) */}
      {activeTab === "margins" && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Internal Cost vs Client Selling Price (PKR)
            </h3>
            <span className="text-[11px] bg-rose-50 text-rose-700 font-mono px-2.5 py-1 rounded border border-rose-300 font-bold">
              SUPER-ADMIN CONFIDENTIAL
            </span>
          </div>

          {/* Metrics Trio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Internal EPC Base Cost</span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {formatPKR(boqData?.pricing?.internalCostPkr)}
              </div>
              <div className="text-[11px] text-slate-500">
                Equipment + BOS + Civil + Earthing + DISCO Net-Metering
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Client Turnkey Selling Price</span>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {formatPKR(boqData?.pricing?.clientSellingPkr)}
              </div>
              <div className="text-[11px] text-slate-500">
                Commercial proposal quoted to customer (PKR {boqData?.pricing?.ratePerWattPkr || "105.00"} / Wp)
              </div>
            </div>

            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-2">
              <span className="text-xs text-emerald-800 uppercase tracking-wider font-bold">Gross Profit Margin (PKR)</span>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {formatPKR(boqData?.pricing?.marginPkr)}
              </div>
              <div className="text-[11px] text-emerald-800 font-mono font-bold">
                {boqData?.pricing?.marginPct || 15}% Net Engineering Margin
              </div>
            </div>
          </div>

          {/* Granular Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Department Cost Head</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3 text-right">Internal Cost (PKR)</th>
                  <th className="p-3 text-right">Client Price (PKR)</th>
                  <th className="p-3 text-right">Margin Spread (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {(boqData?.items || []).map((item, idx) => {
                  const internal = item.internalTotalPkr || 0;
                  const client = item.clientTotalPkr || 0;
                  const spread = client - internal;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.head}</div>
                        <div className="text-[11px] text-slate-500">{item.specs}</div>
                      </td>
                      <td className="p-3 font-mono">{item.qty}</td>
                      <td className="p-3 font-mono">{item.unit}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{formatPKR(internal)}</td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">{formatPKR(client)}</td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">+{formatPKR(spread)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: EXECUTIVE PROPOSAL SEAL PASSWORD & DELEGATION */}
      {activeTab === "security-settings" && (
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-wide text-white">
                      Executive Proposal Seal Password & Delegation Control
                    </h3>
                    <p className="text-xs text-slate-300">
                      Super-Admin Exclusive Governance & Authorization Security
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Only Super-Admin can configure the Proposal Seal Password. When an authorized engineer or executive locks and seals a commercial proposal on Tab 6 (Cryptographic Audit & Seal), this password is required to verify authority before generating the SHA-256 digital certificate.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10 text-right">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-bold">Authorized Sealers</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {usersList.filter(u => u.role === "SUPER_ADMIN" || u.canLockProposals).length}
                </span>
                <span className="text-[10px] text-slate-300 block">
                  of {usersList.length} registered accounts
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Password Management */}
            <div className="lg:col-span-5 space-y-6">
              {/* Current Password Card */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" /> Current Seal Password
                  </h4>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    CONFIGURED & ACTIVE
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-slate-500 block">Current Password Value:</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showApprovalPassword ? "text" : "password"}
                        readOnly
                        value={approvalPasswordData.approvalPassword || "Password123!"}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none cursor-default"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApprovalPassword(!showApprovalPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        title={showApprovalPassword ? "Hide password" : "Show password"}
                      >
                        {showApprovalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      title="Copy password to clipboard"
                    >
                      {copiedPassword ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        "Copy"
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Last updated: {approvalPasswordData.updatedAt ? new Date(approvalPasswordData.updatedAt).toLocaleString() : "System Default"}
                  </p>
                </div>
              </div>

              {/* Change Password Form */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Change Proposal Seal Password
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enter a new password below. Once updated, any authorized user must enter this new password when locking and sealing proposals.
                </p>

                <form onSubmit={handleUpdateApprovalPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      New Seal Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newApprovalPasswordInput}
                        onChange={(e) => setNewApprovalPasswordInput(e.target.value)}
                        placeholder="Enter new password (min 4 chars)"
                        minLength={4}
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading || !newApprovalPasswordInput.trim()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    {passwordLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" /> Save & Update Seal Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: User Delegation List */}
            <div className="lg:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Delegate Proposal Seal Authority
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Grant or revoke permission for engineers to seal proposals with the executive password
                  </p>
                </div>

                <div className="text-[11px] text-slate-600 font-mono">
                  {usersList.filter(u => u.role !== "SUPER_ADMIN" && u.canLockProposals).length} Delegated User(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">User & Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Seal Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-slate-400">
                          No registered users found.
                        </td>
                      </tr>
                    ) : (
                      usersList.map(u => {
                        const isSA = u.role === "SUPER_ADMIN";
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{u.fullName}</div>
                              <div className="text-[10px] font-mono text-slate-500">{u.email}</div>
                            </td>
                            <td className="p-3">
                              <span className="text-[11px] font-mono text-slate-700 font-medium">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              {isSA ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                                  <Shield className="w-3 h-3 text-emerald-600" /> Super-Admin
                                </span>
                              ) : u.canLockProposals ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED TO SEAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  No Seal Rights
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {isSA ? (
                                <span className="text-[11px] text-slate-400 italic">Always Authorized</span>
                              ) : u.canLockProposals ? (
                                <button
                                  disabled={loading}
                                  onClick={() => handleToggleLockPermission(u.id, true, u.fullName)}
                                  className="px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg transition font-bold"
                                  title="Revoke seal permission from this user"
                                >
                                  Revoke Rights
                                </button>
                              ) : (
                                <button
                                  disabled={loading}
                                  onClick={() => handleToggleLockPermission(u.id, false, u.fullName)}
                                  className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-bold shadow-xs flex items-center gap-1 ml-auto"
                                  title="Grant proposal sealing permission to this user"
                                >
                                  <Key className="w-3 h-3" /> Approve for Sealing
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Invite User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative text-slate-900">
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add / Invite New Engineer</h3>
                <p className="text-xs text-slate-500">Direct Super-Admin user provisioning</p>
              </div>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="e.g. Engr. Hamza Malik"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.pk"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Initial Password (Min 8 Chars)</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Departmental Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="SURVEY_ENGINEER">Survey Engineer (Field Mobile Access)</option>
                  <option value="DESIGN_ENGINEER">Design Engineer (CAD & SLD Access)</option>
                  <option value="SALES_MANAGER">Sales Manager (BOQ Proposals & Client Quotes)</option>
                  <option value="SUPER_ADMIN" disabled={adminQuota.count >= 3}>
                    Super-Admin {adminQuota.count >= 3 ? "(Quota Full: 3/3)" : "(Full Platform Governance)"}
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition mt-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Provision & Activate User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Replace Admin / Transfer Seat */}
      {isReplaceAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setIsReplaceAdminModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-600 rounded-xl text-white font-bold">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Replace Admin / Transfer Seat</h3>
                <p className="text-xs text-slate-500">Strict 3 Super-Admin quota handover protocol</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <strong className="text-emerald-700 block">Historic Audit Trail Continuity:</strong>
              When replacing an administrator, all historic quotation approvals, digital seals, and audit logs remain permanently preserved with zero orphaned records.
            </div>

            <form onSubmit={handleReplaceAdminSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Outgoing Super-Admin</label>
                <select
                  required
                  value={replaceForm.outgoingAdminId}
                  onChange={(e) => setReplaceForm(prev => ({ ...prev, outgoingAdminId: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">Select Admin seat to reassign...</option>
                  {usersList.filter(u => u.role === "SUPER_ADMIN").map(adm => (
                    <option key={adm.id} value={adm.id}>
                      {adm.fullName} ({adm.email}) {adm.id === currentUser?.id ? "(You)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Mode Toggle */}
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Handover Protocol</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReplaceForm(prev => ({ ...prev, mode: "TRANSFER_TO_USER" }))}
                    className={`py-2 px-2.5 rounded-xl border font-bold transition text-center ${
                      replaceForm.mode === "TRANSFER_TO_USER"
                        ? "bg-amber-600 text-white border-amber-600 font-bold shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Transfer to Existing User
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplaceForm(prev => ({ ...prev, mode: "REPLACE_CREDENTIALS" }))}
                    className={`py-2 px-2.5 rounded-xl border font-bold transition text-center ${
                      replaceForm.mode === "REPLACE_CREDENTIALS"
                        ? "bg-amber-600 text-white border-amber-600 font-bold shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Replace with New Person
                  </button>
                </div>
              </div>

              {replaceForm.mode === "TRANSFER_TO_USER" ? (
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">Select User to Promote</label>
                  <select
                    required
                    value={replaceForm.incomingUserId}
                    onChange={(e) => setReplaceForm(prev => ({ ...prev, incomingUserId: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Select active employee to promote...</option>
                    {usersList.filter(u => u.role !== "SUPER_ADMIN").map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email}) - {u.role}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-900 block">New Admin Personal Credentials</span>
                  <div>
                    <label className="text-[10px] text-slate-700 font-bold">New Admin Full Name</label>
                    <input
                      type="text"
                      required
                      value={replaceForm.incomingAdminDetails.fullName}
                      onChange={(e) => setReplaceForm(prev => ({
                        ...prev,
                        incomingAdminDetails: { ...prev.incomingAdminDetails, fullName: e.target.value }
                      }))}
                      placeholder="e.g. Engr. Salman Raza"
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-700 font-bold">New Official Email</label>
                    <input
                      type="email"
                      required
                      value={replaceForm.incomingAdminDetails.email}
                      onChange={(e) => setReplaceForm(prev => ({
                        ...prev,
                        incomingAdminDetails: { ...prev.incomingAdminDetails, email: e.target.value }
                      }))}
                      placeholder="salman@company.pk"
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-700 font-bold">Temporary Password</label>
                    <input
                      type="password"
                      required
                      value={replaceForm.incomingAdminDetails.password}
                      onChange={(e) => setReplaceForm(prev => ({
                        ...prev,
                        incomingAdminDetails: { ...prev.incomingAdminDetails, password: e.target.value }
                      }))}
                      placeholder="••••••••"
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Handover Justification</label>
                <input
                  type="text"
                  required
                  value={replaceForm.transferReason}
                  onChange={(e) => setReplaceForm(prev => ({ ...prev, transferReason: e.target.value }))}
                  placeholder="e.g. Employee departure / Departmental restructuring"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !replaceForm.outgoingAdminId}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition mt-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                Confirm Admin Seat Transfer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit User Credentials (Super-Admin Direct Editing) */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setIsEditUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white font-bold">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit User Credentials & Access</h3>
                <p className="text-xs text-slate-500">Direct Super-Admin credential override & role assignment</p>
              </div>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Username / Display Name</label>
                <input
                  type="text"
                  required
                  value={editUserForm.fullName}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter new password (min 8 chars) or leave blank"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">Departmental Role</label>
                <select
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="SURVEY_ENGINEER">Survey Engineer (Field Mobile Access)</option>
                  <option value="DESIGN_ENGINEER">Design Engineer (CAD & SLD Access)</option>
                  <option value="SALES_MANAGER">Sales Manager (BOQ Proposals & Client Quotes)</option>
                  <option value="SUPER_ADMIN" disabled={adminQuota.count >= 3 && editUserForm.role !== "SUPER_ADMIN"}>
                    Super-Admin {adminQuota.count >= 3 && editUserForm.role !== "SUPER_ADMIN" ? "(Quota Full: 3/3)" : "(Full Platform Governance)"}
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-700 font-bold">Account Approval Status</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUserForm.isApproved}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, isApproved: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300"
                  />
                  <span className="text-xs text-emerald-700 font-bold">
                    {editUserForm.isApproved ? "Approved & Active" : "Blocked / Pending"}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition mt-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Changes to User Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
