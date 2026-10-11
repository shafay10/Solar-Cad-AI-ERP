import React, { useState, useEffect } from "react";
import { Building2, X, ShieldCheck, RefreshCw, CheckCircle2, Phone, Mail, MapPin, Hash, Image } from "lucide-react";

export default function ModalCompanyProfile({
  isOpen,
  onClose,
  companyProfile,
  onSaveProfile,
  token
}) {
  const [formData, setFormData] = useState({
    companyName: "",
    registrationNtn: "",
    licenseCategory: "PEC C3 / Specialized Solar EPC",
    officialEmail: "",
    phone: "",
    headOfficeAddress: "",
    logoUrl: ""
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (companyProfile) {
      setFormData({
        companyName: companyProfile.companyName || "",
        registrationNtn: companyProfile.registrationNtn || "",
        licenseCategory: companyProfile.licenseCategory || "PEC C3 / Specialized Solar EPC",
        officialEmail: companyProfile.officialEmail || "",
        phone: companyProfile.phone || "",
        headOfficeAddress: companyProfile.headOfficeAddress || "",
        logoUrl: companyProfile.logoUrl || ""
      });
    }
  }, [companyProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setErrorMsg("Please enter your company / enterprise name.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/company/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg("Company profile & branding updated successfully!");
        if (onSaveProfile) onSaveProfile(data.profile);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to update company profile.");
      }
    } catch (err) {
      setErrorMsg("Network error saving profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Company Profile & Enterprise Branding</h2>
              <p className="text-xs text-slate-500">Configure your company identity for proposals and quotes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Company / Enterprise Legal Name *</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Apex Solar Energy Technologies Pvt Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* NTN & License */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Registration NTN / STRN</label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 7483921-4"
                  value={formData.registrationNtn}
                  onChange={(e) => setFormData({ ...formData, registrationNtn: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">EPC License Category</label>
              <input
                type="text"
                placeholder="e.g. PEC C3 / Specialized Solar"
                value={formData.licenseCategory}
                onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Official Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. +92 42 3578 9000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Official Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  placeholder="e.g. info@company.com.pk"
                  value={formData.officialEmail}
                  onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Head Office Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Plot 14, Main Boulevard, Gulberg III, Lahore, Pakistan"
                value={formData.headOfficeAddress}
                onChange={(e) => setFormData({ ...formData, headOfficeAddress: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Save Company Branding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
