import React, { useState, useEffect } from "react";
import { User, Lock, Mail, Shield, CheckCircle2, AlertTriangle, X, RefreshCw, Camera, Briefcase, ChevronDown } from "lucide-react";

export const COMPANY_POSITIONS = [
  "Chief Executive Officer (CEO)",
  "Managing Director (MD)",
  "Director Operations",
  "Director Engineering",
  "Head of Department (HoD)",
  "HR Director / Manager",
  "Chief / Lead Solar Engineer",
  "Senior Project Engineer",
  "Design & CAD Engineer",
  "Field Survey Engineer",
  "Sales & Commercial Manager",
  "Procurement & Supply Chain Lead",
  "Finance & Accounts Head",
  "Quality Assurance & HSE Lead"
];

export default function ModalUserProfile({ isOpen, onClose, currentUser, onUpdateUser, token }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    newEmail: "",
    designation: "Solar Engineer",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync state whenever modal opens or currentUser changes
  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        newEmail: "",
        designation: currentUser.designation || (currentUser.role === "SUPER_ADMIN" ? "Chief Executive Officer (CEO)" : "Chief / Lead Solar Engineer"),
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setAvatarPreview(currentUser.avatarUrl || "");
      setError("");
      setSuccess("");
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.currentPassword) {
      setError("Please enter your current password to authorize changes.");
      return;
    }

    if (formData.newEmail && formData.newEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.newEmail.trim())) {
        setError("Please enter a valid email address format for new email.");
        return;
      }
      if (formData.newEmail.trim().toLowerCase() === formData.email.toLowerCase()) {
        setError("New email address must be different from your current email.");
        return;
      }
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setError("New password must be at least 8 characters long.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New password confirmation does not match.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          newEmail: formData.newEmail ? formData.newEmail.trim() : undefined,
          designation: formData.designation,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword || undefined,
          avatarUrl: avatarPreview
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
        return;
      }

      setSuccess("Profile settings & credentials updated successfully!");
      
      // Update local storage and app state immediately
      if (data.token) {
        localStorage.setItem("solar_erp_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("solar_erp_user", JSON.stringify(data.user));
      }
      if (onUpdateUser && data.user) {
        onUpdateUser(data.user, data.token);
      }

      setFormData(prev => ({
        ...prev,
        email: data.user?.email || prev.email,
        newEmail: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (err) {
      setError(err.message || "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">My Profile & Account Settings</h3>
            <p className="text-xs text-slate-500">Update email, name, company designation & credentials</p>
          </div>
        </div>

        {/* Current Role & Clearance Badge */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-600 font-medium">Assigned Departmental Role:</span>
          <span className="font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
            {currentUser?.role || "SURVEY_ENGINEER"}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Avatar Upload Section */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center text-emerald-700 font-bold text-lg">
                {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-[11px] font-bold text-slate-800 block">Profile Picture / Avatar</span>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-2.5 py-1 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm">
                <Camera className="w-3 h-3" /> Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => setAvatarPreview("")}
                  className="text-[10px] text-rose-600 hover:underline font-semibold"
                >
                  Remove
                </button>
              )}
            </div>
            <span className="text-[9px] text-slate-500 block">JPEG, PNG, WebP (Max 2MB)</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Username / Display Name */}
          <div>
            <label className="text-[11px] text-slate-700 font-bold block mb-1">Username / Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g. Engr. Asim Qureshi"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Current Official Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-700 font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                Current Official Email Address
              </label>
              <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-slate-500" /> Locked / Read-Only
              </span>
            </div>
            <div className="relative">
              <input
                type="email"
                disabled
                readOnly
                value={formData.email || "admin@greentech.pk"}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 pl-9 text-slate-600 cursor-not-allowed select-none font-mono"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Active primary email address registered for authentication and audit logging.
            </span>
          </div>

          {/* Change Email (Optional) Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                Change Official Email (Optional)
              </label>
              <span className="text-[10px] text-emerald-700 font-medium">Optional</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-2">
              Enter new email address. Leave blank to keep unchanged.
            </p>
            <div className="relative">
              <input
                type="email"
                value={formData.newEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, newEmail: e.target.value }))}
                placeholder="Enter new email address"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 pl-9 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Enter new email address. Leave blank to keep unchanged. Requires current password below.
            </span>
          </div>

          {/* Company Position / Designation Select */}
          <div>
            <label className="text-[11px] text-slate-700 font-bold block mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              Company Position / Designation
            </label>
            <div className="relative">
              <select
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 pr-8 text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer appearance-none"
              >
                {COMPANY_POSITIONS.map(pos => (
                  <option key={pos} value={pos} className="bg-white text-slate-900">
                    {pos}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Appears on your project proposals, engineering audits, and portal header.
            </span>
          </div>

          {/* Change Password Section */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-2">Change Password (Optional)</span>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-slate-600 font-medium">New Password (Min 8 Characters)</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {formData.newPassword && (
                <div>
                  <label className="text-[10px] text-slate-600 font-medium">Confirm New Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Identity Verification Current Password */}
          <div className="pt-2 border-t border-slate-200">
            <label className="text-[11px] text-amber-800 font-bold block mb-1">
              Current Password (Identity Verification)
            </label>
            <input
              type="password"
              required
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter current password to save changes"
              className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition mt-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Profile Updates
          </button>
        </form>
      </div>
    </div>
  );
}
