import React, { useState, useRef, useEffect, useCallback } from "react";

const QUICK_CHIPS = [
  "Kitne projects working mein hain?",
  "Pending BOQs batao",
  "Is mahine ka expected revenue?",
  "Optimum tilt Pakistan ke liye?",
  "25 saal ka yield estimate samjhao"
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

  const callGemini = useCallback(async (userText, history) => {
    if (!apiKey || apiKey === "YOUR_KEY_HERE") {
      return "⚠️ Gemini API key set nahi hai.\n\nfrontend/.env mein add karein:\nVITE_GEMINI_API_KEY=your_key\n\n(phir dev server restart karein)";
    }
    const systemPrompt = buildSystemPrompt(resolvedContext);
    const contents = [
      ...history.slice(-10).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }]
      })),
      { role: "user", parts: [{ text: userText }] }
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
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

    if (!res.ok) {
      return `⚠️ AI service error (${res.status}). Thori dair baad try karein.`;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf kijiye, jawab generate nahi ho saka. Dobara try karein.";
  }, [apiKey, resolvedContext, geminiModel]);

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
      setMessages(prev => [...prev, { role: "assistant", text: "⚠️ Connection issue. Internet check kar ke dobara try karein." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, callGemini]);

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
                      background: "#10b981",
                      display: "inline-block"
                    }}
                  />
                  Live data connected
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
