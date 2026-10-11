import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./index.css";

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Application Crash caught by GlobalErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.removeItem("solar_erp_token");
    localStorage.removeItem("solar_erp_user");
    localStorage.removeItem("solar_erp_original_admin_token");
    localStorage.removeItem("solar_erp_original_admin_user");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f4f6f9] text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Solar ERP Runtime Safeguard</h2>
                <p className="text-xs text-rose-600">An unexpected component error was caught safely</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-mono text-rose-700 break-words font-semibold">
                {this.state.error?.toString()}
              </div>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] text-slate-600 font-mono overflow-x-auto max-h-40 p-2 bg-white rounded border border-slate-200">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Reload Application
              </button>
              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs transition border border-slate-300 font-medium cursor-pointer"
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
