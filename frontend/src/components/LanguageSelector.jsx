import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function LanguageSelector({ variant = "navbar" }) {
  const { language, setLanguage, languages, currentLangMeta } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        title="Change Platform Language / زبان تبدیل کریں"
        aria-label="Language Selector"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-base leading-none select-none">{currentLangMeta.flag}</span>
        <span className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-slate-800 hidden sm:inline">
          {currentLangMeta.id}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs font-bold divide-y divide-slate-100">
          <div className="px-3 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Select Language</span>
            <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
              Multi-Lingual
            </span>
          </div>

          <div className="py-1">
            {languages.map((lang) => {
              const isActive = language === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer ${
                    isActive
                      ? "bg-emerald-50 text-emerald-900 font-extrabold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none select-none">{lang.flag}</span>
                    <div>
                      <div className="text-xs">{lang.nativeName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {lang.name} {lang.dir === "rtl" ? "• RTL" : ""}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 text-[10px] text-slate-400 text-center font-normal bg-slate-50/50 rounded-b-2xl">
            Live ERP Internationalization
          </div>
        </div>
      )}
    </div>
  );
}
