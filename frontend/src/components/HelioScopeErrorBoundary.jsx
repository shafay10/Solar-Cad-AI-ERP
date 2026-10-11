import React from "react";
import { AlertTriangle, RefreshCw, Layers } from "lucide-react";

export default class HelioScopeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HelioScope CAD ErrorBoundary Caught Exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[480px] bg-white border border-amber-300 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-2">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              HelioScope CAD Engine Safeguard Active
            </h3>
            <p className="text-xs text-slate-600">
              The CAD photogrammetry or coordinate math engine caught a calculation exception. The platform's safeguard prevented the browser from freezing or turning into a blank screen.
            </p>
            {this.state.error?.message && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left font-mono text-[11px] text-amber-800 break-words">
                {this.state.error.message}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Reset CAD Viewport
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Layers className="w-4 h-4" /> Reload Entire Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
