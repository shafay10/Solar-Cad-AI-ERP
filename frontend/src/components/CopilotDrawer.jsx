import React, { useState, useRef, useEffect } from "react";
import {
  Bot, Send, X, Sparkles, MessageSquare, CornerDownLeft,
  ChevronDown, ChevronUp, RefreshCw, Layers, ShieldCheck, Sun, Zap
} from "lucide-react";

export default function CopilotDrawer({ activeProject, token, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "copilot",
      text: `Hello ${currentUser?.fullName || "Engineer"}! I am your **GreenTech AI Solar Copilot**.\nI can query your live ERP projects, generate 3-line survey briefs, calculate ideal tilt angles for Pakistani coordinates, and analyze turnkey margins in PKR. How can I assist you?`,
      timestamp: "Live",
      suggestions: ["Summarize Active Project", "Total kWp in ERP", "Calculate Ideal Tilt", "Check Cable Voltage Drop"]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text,
          activeProjectId: activeProject?.id || null
        })
      });

      // Auto-heal on session desync
      if (res.status === 401) {
        localStorage.removeItem("solar_erp_token");
        localStorage.removeItem("solar_erp_user");
        // Retry immediately as guest without stale token
        res = await fetch("/api/copilot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            activeProjectId: activeProject?.id || null
          })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Copilot response failed");
      }

      if (data.sessionDesync) {
        localStorage.removeItem("solar_erp_token");
        localStorage.removeItem("solar_erp_user");
      }

      const copilotMsg = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        text: data.answer || data.response || data.text || "No response received.",
        structuredData: data.structuredData,
        suggestions: data.suggestions || [],
        timestamp: data.pktTimestamp ? data.pktTimestamp.split(" | ")[1] : "PKT"
      };

      setMessages(prev => [...prev, copilotMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "copilot",
          text: `⚠️ **Connection Notice:** ${err.message || "Failed to query ERP Copilot API."}`,
          timestamp: "Error"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-5 z-40 p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition flex items-center gap-2.5 border border-emerald-500 cursor-pointer"
          title="Open GreenTech AI Copilot"
        >
          <Bot className="w-5 h-5 animate-pulse" />
          <span className="hidden sm:inline text-xs font-bold tracking-wide">GreenTech Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 border border-white" />
        </button>
      )}

      {/* Slide-out Interactive Copilot Panel */}
      {isOpen && (
        <div className="fixed bottom-0 sm:bottom-6 right-0 sm:right-6 z-50 w-full sm:w-[420px] h-[540px] max-h-[90vh] bg-white border border-slate-200 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  GreenTech AI Copilot
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 font-mono px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                    ERP NLP
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Active Site: {activeProject?.clientName || "All Projects"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              aria-label="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50/40">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl shadow-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white font-medium rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {/* Message Text with Simple Markdown Formatting */}
                  <div>
                    {msg.text.split("\n").map((line, lIdx) => (
                      <p key={lIdx} className={line.startsWith("**") || line.startsWith("1.") ? "font-bold mt-1 text-slate-900" : "mt-0.5"}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Structured Data Badges if available */}
                  {msg.structuredData && (
                    <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      {(msg.structuredData.erpStats?.totalApprovedCapacityKw !== undefined || msg.structuredData.totalCapacityKw !== undefined) && (
                        <div className="bg-slate-50 p-1.5 rounded border border-emerald-200 text-emerald-800">
                          Approved: <strong>{msg.structuredData.erpStats?.totalApprovedCapacityKw || msg.structuredData.totalCapacityKw} kWp</strong>
                        </div>
                      )}
                      {(msg.structuredData.erpStats?.totalProjects !== undefined || msg.structuredData.approvedProjects !== undefined) && (
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-700">
                          Sites: <strong>{msg.structuredData.erpStats?.totalProjects || msg.structuredData.approvedProjects} Active</strong>
                        </div>
                      )}
                    </div>
                  )}

                  <span className={`block text-[9px] text-right mt-1 font-mono ${msg.sender === "user" ? "text-emerald-100" : "text-slate-400"}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Suggestion Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(sug)}
                        className="text-[10px] bg-white hover:bg-slate-50 text-emerald-700 border border-slate-200 hover:border-emerald-400 rounded-lg px-2.5 py-1 transition flex items-center gap-1 shadow-xs cursor-pointer font-medium"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 text-xs text-emerald-700 w-fit shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="font-medium">GreenTech AI is analyzing ERP database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Copilot about projects, margins, tilt..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm cursor-pointer"
              aria-label="Send Query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
