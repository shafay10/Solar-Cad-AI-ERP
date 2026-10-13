import React, { useState, useRef, useEffect, useCallback } from "react";

const QUICK_CHIPS = [
  "Kitne projects working mein hain?",
  "Pending BOQs batao",
  "Is mahine ka expected revenue?",
  "Optimum tilt Pakistan ke liye?",
  "25 saal ka yield estimate samjhao"
];

// ★ BACKUP MODELS: sirf tab try honge agar dynamic discovery fail ho jaye
const MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

// ★ GROQ BACKUP MODELS: sirf tab jab models list fetch na ho paye
// (console ne confirm kiya: 'llama-3.3-70b-versatile' ab exist nahi karta —
//  isliye current Groq lineup ke naam yahan hain)
const GROQ_BACKUP_MODELS = [
  "openai/gpt-oss-120b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant",
  "gemma2-9b-it"
];

function buildSystemPrompt(projectContext) {
  const ctx = projectContext || {};
  const projects = Array.isArray(ctx.projects) ? ctx.projects : (ctx.activeProject ? [ctx.activeProject] : []);
  const statusCounts = {};
  let totalKwp = 0, totalValue = 0;
  projects.forEach(p => {
    const st = String(p.status || p.projectStatus || "Unknown").toUpperCase();
    statusCounts[st] = (statusCounts[st] || 0) + 1;
    totalKwp += Number(p.kwp || p.systemSizeKwp || p.systemKw || 0) || 0;
    totalValue += Number(p.value || p.totalValue || p.contractValue || 0) || 0;
  });

  return `Tum "GreenTech Copilot" ho — ek solar ERP platform ka expert AI assistant (Pakistan-based solar company ke liye).

TUMHARI PERSONALITY:
- Friendly, professional, Roman Urdu + English mix mein jawab do (user ki language follow karo)
- Short aur precise jawab do — tables/lists use karo jab data compare ho
- Solar industry expert ho: system design, stringing, tilt/azimuth, inverters, BOQ, margins, net-metering (NEPRA rules)

LIVE PLATFORM DATA (is waqt ka real snapshot):
- Current Page: ${ctx.currentPage || "Dashboard / Solar ERP"}
- Total Projects: ${projects.length}
- Status Breakdown: ${JSON.stringify(statusCounts)}
- Total System Size: ${totalKwp.toFixed(1)} kWp
- Total Pipeline Value: PKR ${totalValue.toLocaleString()}${ctx.cadStats ? `\n- Active CAD Design: ${JSON.stringify(ctx.cadStats)}` : ""}${ctx.activeProject ? `\n- Active Project Name: ${ctx.activeProject.name || ctx.activeProject.clientName || "N/A"}` : ""}

RULES:
- Data ke sawal ka jawab UPAR WALE live numbers se do — apni marzi ke numbers kabhi mat ghumao
- Agar poocha gaya data available nahi hai, politely batao ke wo section kholein
- Technical advice dena ho to IEC/NEPRA standards follow karo
- Pakistan context: net-metering, AEDB, DISCOs (LESCO/GEPCO/IESCO), peak sun hours 5-5.5
- Kabhi confident ho kar galat number na do — uncertainty ho to clearly bolo`;
}

// ═══════════════════════════════════════════════════════════
// ★ OFFLINE SMART MODE — API fail ho to bhi rule-based intelligent jawab
// ═══════════════════════════════════════════════════════════
function getOfflineReply(question, projectContext) {
  const q = String(question || "").toLowerCase();
  const ctx = projectContext || {};
  const projects = Array.isArray(ctx.projects) ? ctx.projects : (ctx.activeProject ? [ctx.activeProject] : []);

  const statusCounts = {};
  let totalKwp = 0;
  projects.forEach(p => {
    const st = String(p.status || p.projectStatus || "Unknown").toUpperCase();
    statusCounts[st] = (statusCounts[st] || 0) + 1;
    totalKwp += Number(p.kwp || p.systemSizeKwp || p.systemKw || 0) || 0;
  });

  const statusLine = Object.entries(statusCounts)
    .map(([st, n]) => `- **${st}**: ${n}`)
    .join("\n") || "- (abhi koi project data available nahi)";

  if (q.match(/salam|assalam|hello|hi\b|hey|aoa/)) {
    return `Walaikum Assalam! 👋\n\nMain aapke projects aur solar design mein madad kar sakta hoon:\n- "Kitne projects working mein hain?"\n- "Optimum tilt Pakistan ke liye?"\n- "Panels per string kitne hon?"\n\n💡 Full AI jawab ke liye Gemini API key add karein (aistudio.google.com se free).`;
  }

  if (q.match(/project|working|chalu|running|kitne/)) {
    return `📊 **Live Project Data:**\n\n- Total Projects: **${projects.length}**\n${statusLine}\n- Total System Size: **${totalKwp.toFixed(1)} kWp**\n\n(All Projects tab mein full detail dekh sakte hain)`;
  }

  if (q.match(/tilt|jhukav|slope/)) {
    return `📐 **Tilt Guide (Pakistan):**\n\n- Optimum fixed tilt: **25°–30°** (latitude ke qareeb)\n- CAD mein ☀ Pitch AUTO on rakho — winter shadow-safe pitch khud calculate hoti hai\n- 0° = Flush Mount (jab structure allowed na ho)\n- 45° max — zyada tilt = zyada row spacing = kam panels fit\n\n**Tip:** 25°-28° pe balanced yield + best packing milti hai.`;
  }

  if (q.match(/string|voltage|voc|mppt|per.*string/)) {
    return `⚡ **Stringing Guide:**\n\n- Max panels/string = Inverter maxDcVoltage ÷ (Panel Voc × 1.25 cold factor)\n- Example: 600V inverter + 49.7V Voc panel → **max ~9-11 panels/string**\n- Winter mein Voc barhta hai (-5°C pe ~30% zyada) — cold factor zaroori\n\nCAD sidebar mein 🛡️ "Safe max" ye limit already clamp kar deta hai.`;
  }

  if (q.match(/boq|margin|revenue|paisa|price|quotation|profit/)) {
    return `💰 **BOQ & Margins:**\n\nDetail ke liye **BOQ (PKR)** tab kholein — har project ki costing, margins aur quotations wahan hain.\n\nCurrently CAD context se ${projects.length} projects, ${totalKwp.toFixed(1)} kWp pipeline dikh rahi hai.`;
  }

  if (q.match(/net.?meter|nepra|disco|grid|unit|export/)) {
    return `🔌 **Net Metering (Pakistan):**\n\n- NEPRA licensed DISCOs (LESCO, GEPCO, IESCO, K-Electric) net metering deti hain\n- 3-phase metering ~10kW+ systems ke liye\n- Bidirectional green meter + AEDB certified installer zaroori\n- Export units monthly bill mein adjust hote hain\n- Peak sun hours Pakistan: **5-5.5 hrs/day**\n\n(Exact tariff ke liye apni DISCO ka current SRO check karein)`;
  }

  if (q.match(/inverter|kw|size.*system|system.*size/)) {
    return `🔋 **Inverter Selection:**\n\n- DC/AC ratio: **1.15x–1.30x** (1.25 optimal)\n- Example: 25 kWp panels → 20 kW inverter (25 ÷ 1.25)\n- CAD mein auto-match hai — system size ke sath inverter khud adjust hota hai\n- Hybrid (Deye/Inverex) = battery-ready, On-Grid (Huawei/Sungrow) = sasta\n\nCatalog tab (1. Equipment) mein 60+ models hain.`;
  }

  if (q.match(/azimuth|direction|south|facing/)) {
    return `🧭 **Azimuth Guide (Pakistan):**\n\n- Best: **180° (True South)**\n- East-West split (135°/225°): subah+shaam zyada units\n- CAD mein right-click roof edge → "Keep parallel to this edge"\n- Angle chips (0°-270°) quick rotate ke liye`;
  }

  if (q.match(/yield|25|saal|year|degradation/)) {
    return `📈 **25Y Yield Estimate:**\n\n- Year 1 yield: ~1,550 kWh/kWp (Pakistan average)\n- Degradation: ~0.5%/year (Tier-1 TOPCon panels)\n- 25 saal baad bhi ~87-88% capacity\n- **25Y Yield tab** mein poora breakdown hai\n\nExample: 25 kWp system → Year 1: ~38,750 kWh → 25 saal total: ~925,000 kWh`;
  }

  return `🤖 **Offline Smart Mode**\n\nYe sawal poori tarah samajh nahi aaya (full AI ke liye Gemini service chahiye), lekin ye pooch sakte hain:\n\n- "Kitne projects working mein hain?"\n- "Optimum tilt Pakistan ke liye?"\n- "Panels per string kitne hon?"\n- "Net metering kaise kaam karta hai?"\n- "Inverter kaise select karun?"\n- "25 saal ka yield samjhao"`;
}

export default function CopilotDrawer({ projectContext = {}, geminiModel = "gemini-2.0-flash", activeProject, token, currentUser }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Assalam-o-Alaikum! 👋 Main GreenTech Copilot hoon.\n\nMain aapke projects, BOQ, margins aur solar design ke baare mein live data se baat kar sakta hoon. Kuch poochein!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const apiKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) || "";
  const groqKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GROQ_API_KEY) || "";
  const isKeyValid = (apiKey && apiKey !== "YOUR_KEY_HERE") || (groqKey && groqKey !== "YOUR_KEY_HERE");
  const aiEngineLabel = groqKey
    ? "Full AI connected (Groq ⚡)"
    : (apiKey && apiKey !== "YOUR_KEY_HERE") ? "Full AI connected (Gemini)" : "Smart mode — API key add karein";

  // Combine projectContext with activeProject if passed
  const resolvedContext = {
    ...projectContext,
    ...(activeProject && !projectContext?.activeProject ? { activeProject } : {})
  };

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages, loading]);

  // ═════════════════════════════════════════════════════════
  // ★ GROQ CALL v3 — DYNAMIC MODEL DISCOVERY
  // Console test se PROOF hua: key VALID hai lekin 'llama-3.3-70b-versatile'
  // ka naam Groq ne hata diya (404 model_not_found). Isliye ab pehle key se
  // models ki LIST fetch hoti hai — jo models ACTUALLY exist karte hain wahi
  // try honge. 404 "model does not exist" ab impossible hai.
  // ═════════════════════════════════════════════════════════
  const callGroq = useCallback(async (userText, history, systemPrompt) => {
    if (!groqKey || groqKey === "YOUR_KEY_HERE") return null;

    // ─── STEP 1: Key se available models ki list fetch karo ───
    let groqModels = [];
    try {
      const listRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${groqKey}` }
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        // Sirf chat-capable models — whisper/tts/embed/guard ko filter karo
        groqModels = (listData?.data || [])
          .map(m => m.id)
          .filter(id =>
            id &&
            !id.includes("whisper") && !id.includes("tts") &&
            !id.includes("embed") && !id.includes("guard") &&
            !id.includes("distil") && !id.includes("playai") &&
            !id.includes("prompt-guard") && !id.includes("compound")
          )
          .sort((a, b) => {
            // Smart/saare models pehle: 120b > 70b > 40b > 9b > 8b
            const score = (id) =>
              (id.includes("120b") ? 5 : 0) +
              (id.includes("70b") ? 4 : 0) +
              (id.includes("40b") ? 3 : 0) +
              (id.includes("236b") ? 4 : 0) +
              (id.includes("9b") ? 2 : 0) +
              (id.includes("8b") ? 1 : 0);
            return score(b) - score(a);
          });
        console.log("[Copilot] Groq available models:", groqModels.length);
      } else {
        const listErr = await listRes.text().catch(() => "");
        console.error("[Copilot] Groq list error:", listRes.status, listErr);

        if (listRes.status === 401 || listRes.status === 403) {
          return `❌ **GROQ KEY INVALID (${listRes.status})**\n\nGroq ka jawab: _${listErr.slice(0, 250)}_\n\nKey regenerate karein: console.groq.com → API Keys`;
        }
        // List fail — backup hardcoded models try karenge neeche
      }
    } catch (listFetchErr) {
      console.warn("[Copilot] Groq list network error:", listFetchErr);
      // Network issue — backup models se try karenge
    }

    if (groqModels.length === 0) {
      groqModels = [...GROQ_BACKUP_MODELS];
      console.warn("[Copilot] Groq list nahi mili — backup models use ho rahe:", GROQ_BACKUP_MODELS.join(", "));
    }

    // ─── STEP 2: Available models se jawab lo ───
    for (const modelName of groqModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              ...history.slice(-10).map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.text
              })),
              { role: "user", content: userText }
            ],
            temperature: 0.4,
            max_tokens: 1024
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text;
        }

        const errText = await res.text().catch(() => "");
        console.error("[Copilot] Groq error:", res.status, errText);

        if (res.status === 401 || res.status === 403) {
          return `❌ **GROQ KEY INVALID (${res.status})**\n\nGroq ka jawab: _${errText.slice(0, 250)}_\n\nKey regenerate karein: console.groq.com → API Keys`;
        }
        if (res.status === 429) {
          // Rate limit — thora ruk kar agla model
          await new Promise(r => setTimeout(r, 800));
        }
        // 400/404 = ye specific model nahi chala — agla model try hoga (list se aaya to rare)
      } catch (groqErr) {
        console.warn("[Copilot] Groq network error:", groqErr);
        return null; // Network down — Gemini pe fallback
      }
    }
    return null;
  }, [groqKey]);

  const callGemini = useCallback(async (userText, history) => {
    // ★ KEY bilkul nahi hai — sirf tab Offline Smart Mode
    if (!isKeyValid) {
      return getOfflineReply(userText, resolvedContext);
    }

    const systemPrompt = buildSystemPrompt(resolvedContext);

    // ═══ GROQ FIRST (Pakistan-friendly, free, fast) ═══
    const groqReply = await callGroq(userText, history, systemPrompt);
    if (groqReply) return groqReply;

    // ═══ GEMINI FALLBACK (agar Groq key nahi thi ya fail hua) ═══
    if (!apiKey || apiKey === "YOUR_KEY_HERE") {
      // Groq fail + Gemini key nahi — offline smart mode
      const offline = getOfflineReply(userText, resolvedContext);
      return `${offline}\n\n---\n⚠️ _Groq unreachable aur Gemini key nahi — offline smart jawab._`;
    }

    const contents = [
      ...history.slice(-10).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }]
      })),
      { role: "user", parts: [{ text: userText }] }
    ];

    let lastStatus = 0;
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
      );

      if (listRes.ok) {
        const listData = await listRes.json();
        const available = (listData?.models || [])
          .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
          .map(m => (m.name || "").replace("models/", ""));

        const preferred = [
          ...available.filter(m => m.includes("flash") && !m.includes("8b") && !m.includes("exp")),
          ...available.filter(m => !m.includes("flash") && !m.includes("embedding") && !m.includes("vision") && !m.includes("aqa"))
        ];

        const modelsToTry = [...new Set([geminiModel, ...preferred])].filter(Boolean);

        for (const modelName of modelsToTry) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  contents,
                  generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 1024
                  }
                })
              }
            );

            if (res.ok) {
              const data = await res.json();
              return data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Maaf kijiye, jawab generate nahi ho saka. Dobara try karein.";
            }

            lastStatus = res.status;

            if (res.status === 400 || res.status === 403) {
              const errText = await res.text().catch(() => "");
              console.error("[Copilot] Gemini error:", res.status, errText);
              if (errText.includes("API key not valid") || errText.includes("API_KEY_INVALID")) {
                break; // Gemini key invalid — loop se bahar, offline fallback
              }
              if (errText.includes("location") || errText.includes("region") || errText.includes("not supported")) {
                break; // Region blocked — offline fallback
              }
              break;
            }

            if (res.status === 429) {
              await new Promise(r => setTimeout(r, 800));
            }
          } catch (modelFetchErr) {
            console.warn("[Copilot] Network error on model:", modelName, modelFetchErr);
            lastStatus = 0;
          }
        }
      } else {
        lastStatus = listRes.status;
        console.error("[Copilot] Gemini list error:", listRes.status);
      }
    } catch (fetchErr) {
      console.warn("[Copilot] Network error:", fetchErr);
      lastStatus = 0;
    }

    // ★ Sab fail — Offline Smart Mode fallback
    const offline = getOfflineReply(userText, resolvedContext);
    return `${offline}\n\n---\n⚠️ _AI service temporarily unavailable (${lastStatus || "network"}) — ye offline smart jawab hai._`;
  }, [apiKey, isKeyValid, resolvedContext, geminiModel, callGroq]);

  const sendMessage = useCallback(async (text) => {
    const msg = String(text || input).trim();
    if (!msg || loading) return;
    const history = messages.filter(m => m.role !== "system");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGemini(msg, history);
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      const offline = getOfflineReply(msg, resolvedContext);
      setMessages(prev => [...prev, {
        role: "assistant",
        text: `${offline}\n\n---\n⚠️ _Connection issue — ye offline smart jawab hai._`
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, callGemini, resolvedContext]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="GreenTech Copilot — AI Assistant"
          style={{
            position: "fixed",
            right: 16,
            bottom: 72,
            zIndex: 9400,
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "2px solid rgba(16,185,129,0.5)",
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            color: "#fff",
            fontSize: 22,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(16,185,129,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          🤖
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 72,
            zIndex: 9400,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            height: 480,
            maxHeight: "calc(100vh - 120px)",
            display: "flex",
            flexDirection: "column",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(56,189,248,0.25)",
            background: "rgba(8,15,30,0.97)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 14px",
              background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(56,189,248,0.12))",
              borderBottom: "1px solid rgba(56,189,248,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <div>
                <div style={{ color: "#a7f3d0", fontWeight: 800, fontSize: 13 }}>
                  GreenTech Copilot
                </div>
                <div style={{ color: "#64748b", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isKeyValid ? "#10b981" : "#f59e0b",
                      display: "inline-block"
                    }}
                  />
                  {aiEngineLabel}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontSize: 18,
                cursor: "pointer",
                lineHeight: 1,
                padding: 4
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: 10
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  padding: "8px 12px",
                  borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                  background: m.role === "user" ? "linear-gradient(135deg, #0284c7, #0ea5e9)" : "rgba(30,41,59,0.8)",
                  color: m.role === "user" ? "#fff" : "#e2e8f0",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  border: m.role === "assistant" ? "1px solid rgba(56,189,248,0.15)" : "none"
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "8px 12px",
                  borderRadius: "12px 12px 12px 3px",
                  background: "rgba(30,41,59,0.8)",
                  color: "#94a3b8",
                  fontSize: 12
                }}
              >
                🤖 Soch raha hoon...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips if first message */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: 5 }}>
              {QUICK_CHIPS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: "5px 9px",
                    borderRadius: 14,
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid rgba(16,185,129,0.35)",
                    background: "rgba(16,185,129,0.1)",
                    color: "#6ee7b7"
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input field */}
          <div
            style={{
              padding: 10,
              borderTop: "1px solid rgba(56,189,248,0.15)",
              display: "flex",
              gap: 8,
              alignItems: "center"
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Projects, margins, tilt, BOQ... kuch bhi poochein"
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 10,
                border: "1px solid rgba(56,189,248,0.2)",
                background: "rgba(15,23,42,0.9)",
                color: "#e2e8f0",
                fontSize: 12.5,
                outline: "none"
              }}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                background: input.trim() && !loading ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(51,65,85,0.6)",
                color: "#fff",
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}