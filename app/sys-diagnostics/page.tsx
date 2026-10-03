"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Power,
  RefreshCw,
  Database,
  Cloud,
  Layers,
  Lock,
  Eye,
  EyeOff,
  Radio,
  ExternalLink,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface DiagnosticsData {
  dbConnected: boolean;
  dbLatencyMs: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalHeroBanners: number;
  siteStatus: {
    status: "online" | "terminated";
    mode?: string;
    message?: string;
    updated_at?: string;
  };
}

interface CloudinaryHealth {
  connected: boolean;
  cloudName: string;
  latencyMs: number;
  error?: string;
}

export default function SystemDiagnosticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [masterKey, setMasterKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [cloudinary, setCloudinary] = useState<CloudinaryHealth | null>(null);
  const [siteStatus, setSiteStatus] = useState<"online" | "terminated">("online");
  const [statusMode, setStatusMode] = useState<string>("503_error");
  const [customMessage, setCustomMessage] = useState<string>(
    "503 Service Unavailable: Database cluster connection timeout."
  );
  const [toggling, setToggling] = useState(false);
  const [purging, setPurging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch telemetry status
  const fetchTelemetry = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sys-diagnostics");
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        if (data.diagnostics) {
          setDiagnostics(data.diagnostics);
          if (data.diagnostics.siteStatus) {
            setSiteStatus(data.diagnostics.siteStatus.status);
            setStatusMode(data.diagnostics.siteStatus.mode || "503_error");
            if (data.diagnostics.siteStatus.message) {
              setCustomMessage(data.diagnostics.siteStatus.message);
            }
          }
        }
        if (data.cloudinary) {
          setCloudinary(data.cloudinary);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Handle Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey.trim()) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/sys-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", masterKey: masterKey.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setMasterKey("");
        fetchTelemetry();
      } else {
        setErrorMsg(data.error || "Authentication failed. Invalid signature.");
      }
    } catch {
      setErrorMsg("Network error communicating with telemetry gateway.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Killswitch
  const handleToggleStatus = async (targetStatus: "online" | "terminated") => {
    setToggling(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/sys-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_status",
          status: targetStatus,
          mode: statusMode,
          message: customMessage,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSiteStatus(targetStatus);
        setSuccessMsg(
          targetStatus === "terminated"
            ? "Site TERMINATED. 503 Server Down error active worldwide."
            : "Site RESTORED. Storefront operational and healthy."
        );
        fetchTelemetry();
      } else {
        setErrorMsg(data.error || "Failed to update system status.");
      }
    } catch {
      setErrorMsg("Failed to connect to gateway endpoint.");
    } finally {
      setToggling(false);
    }
  };

  // Purge Cache
  const handlePurgeCache = async () => {
    setPurging(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/sys-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge_cache" }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Edge ISR and route cache successfully flushed.");
      } else {
        setErrorMsg(data.error || "Cache purge failed.");
      }
    } catch {
      setErrorMsg("Network error.");
    } finally {
      setPurging(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/sys-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setIsAuthenticated(false);
      setDiagnostics(null);
    } catch {
      setIsAuthenticated(false);
    }
  };

  // Render Login Screen if unauthenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#070709] text-[#E0E0E0] flex flex-col items-center justify-center p-4 selection:bg-[#EF4444] selection:text-white">
        <div className="w-full max-w-md bg-[#0F0F13] border border-[#23232C] rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-800 via-amber-500/40 to-neutral-800" />

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700/60 flex items-center justify-center text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-wider text-neutral-100 font-mono uppercase">
                System Telemetry Gateway
              </h1>
              <p className="text-xs text-neutral-500 font-mono">NODE_CLUSTER: AWS-AP-NE-1 // SECURE</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                Developer Master Passcode
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Enter secret authorization key"
                  required
                  autoFocus
                  className="w-full bg-[#16161D] border border-[#2B2B36] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-400 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-neutral-200 text-black font-medium py-3 rounded-xl text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 font-mono disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize Operations Console</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#1C1C24] text-center">
            <span className="text-[11px] font-mono text-neutral-600">
              Restricted DevOps & Systems Engineering Access Only
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-neutral-400 font-mono text-xs gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
        <span>Initializing Telemetry Console...</span>
      </div>
    );
  }

  const isTerminated = siteStatus === "terminated";

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200 font-sans selection:bg-[#EF4444] selection:text-white pb-16">
      {/* Top Bar */}
      <header className="border-b border-[#1A1A22] bg-[#0A0A0E]/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
                  DNORA Telemetry & Systems Terminal
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400">
                  v2.6-SYSCTL
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-500">
                HOST: dnora.in // REGION: AWS-0-AP-NE-1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePurgeCache}
              disabled={purging}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${purging ? "animate-spin text-amber-400" : ""}`} />
              <span>Flush Cache</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-lg text-red-300 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Exit Console</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8">
        {/* Status Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-300">
              ✕
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-red-500 hover:text-red-300">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MASTER KILLSWITCH SECTION                                      */}
        {/* ============================================================== */}
        <section className={`border rounded-2xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 ${
          isTerminated
            ? "bg-gradient-to-b from-[#1C0A0A] to-[#120505] border-red-800/80 shadow-[0_0_50px_rgba(239,68,68,0.15)]"
            : "bg-gradient-to-b from-[#0A1610] to-[#060D09] border-emerald-800/80 shadow-[0_0_50px_rgba(16,185,129,0.12)]"
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`w-3.5 h-3.5 rounded-full animate-ping ${
                  isTerminated ? "bg-red-500" : "bg-emerald-500"
                }`} />
                <span className={`text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${
                  isTerminated
                    ? "bg-red-950/80 border-red-700 text-red-400"
                    : "bg-emerald-950/80 border-emerald-700 text-emerald-400"
                }`}>
                  {isTerminated ? "CRITICAL: STOREFRONT TERMINATED (503 ACTIVE)" : "PRODUCTION SYSTEM: ONLINE & HEALTHY"}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white">
                {isTerminated ? "Website is Terminated (Server Down)" : "Website is Live & Operational"}
              </h2>

              <p className="text-xs md:text-sm text-neutral-400 max-w-2xl leading-relaxed">
                {isTerminated
                  ? "All public visitors, customers, and client visiting dnora.in immediately receive an authentic HTTP 503 Server Unavailable error. No products, cart, or admin pages are accessible."
                  : "Storefront is live, responsive, and processing customer orders seamlessly. Toggle below to initiate an emergency killswitch shutdown."}
              </p>
            </div>

            {/* Toggle Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {isTerminated ? (
                <button
                  onClick={() => handleToggleStatus("online")}
                  disabled={toggling}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 rounded-xl text-sm font-mono tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Power className="w-5 h-5" />
                  <span>{toggling ? "Restoring Site..." : "⚡ RESTORE ONLINE NOW"}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus("terminated")}
                  disabled={toggling}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-4 rounded-xl text-sm font-mono tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-red-600/30 disabled:opacity-50"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>{toggling ? "Terminating..." : "⛔ TERMINATE SITE (SERVER DOWN)"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-4 py-4 rounded-xl border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>503 Preview</span>
              </button>
            </div>
          </div>

          {/* Killswitch Settings Config */}
          <div className="mt-8 pt-6 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Simulation Simulation Mode
              </label>
              <select
                value={statusMode}
                onChange={(e) => setStatusMode(e.target.value)}
                className="w-full bg-[#111116] border border-[#262633] rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500/70"
              >
                <option value="503_error">503 Service Unavailable (Cloud Cluster Timeout)</option>
                <option value="500_error">500 Internal Server Error (PostgreSQL Pool Exhaustion)</option>
                <option value="maintenance">Scheduled System Maintenance Window</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Technical Error Trace Footprint
              </label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Custom server error string"
                className="w-full bg-[#111116] border border-[#262633] rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500/70"
              />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* DEVELOPER BYPASS BADGE                                         */}
        {/* ============================================================== */}
        <div className="bg-[#0E0E14] border border-[#1F1F2A] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono font-semibold text-white uppercase tracking-wider">
                  Developer Bypass Mode
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 font-semibold">
                  ACTIVE IN THIS BROWSER
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                Your browser has the signed bypass token. Even when the storefront is in Terminated mode, you can open and browse the actual website normally. Anyone else (including client) will see the 503 error.
              </p>
            </div>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-200 transition-colors shrink-0"
          >
            <span>Open Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* ============================================================== */}
        {/* INFRASTRUCTURE TELEMETRY METRICS                               */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <h3 className="text-xs font-mono font-semibold tracking-wider uppercase text-neutral-300">
              Live Infrastructure Telemetry
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database */}
            <div className="bg-[#0E0E14] border border-[#1F1F2A] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-mono uppercase tracking-wider">PostgreSQL Pool</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-mono font-semibold text-white">
                {diagnostics?.dbConnected ? "CONNECTED" : "OFFLINE"}
              </div>
              <div className="text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                <span>Supabase Tokyo</span>
                <span className="text-emerald-400">{diagnostics?.dbLatencyMs || 0}ms</span>
              </div>
            </div>

            {/* Cloudinary CDN */}
            <div className="bg-[#0E0E14] border border-[#1F1F2A] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-mono uppercase tracking-wider">Cloudinary CDN</span>
                <Cloud className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-mono font-semibold text-white">
                {cloudinary?.connected ? "OPERATIONAL" : "UNREACHABLE"}
              </div>
              <div className="text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                <span>Cloud: {cloudinary?.cloudName || "rvtnjdih"}</span>
                <span className="text-sky-400">{cloudinary?.latencyMs || 0}ms</span>
              </div>
            </div>

            {/* Products */}
            <div className="bg-[#0E0E14] border border-[#1F1F2A] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-mono uppercase tracking-wider">Catalog Products</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-mono font-semibold text-white">
                {diagnostics?.totalProducts || 0} Products
              </div>
              <div className="text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                <span>Categories: {diagnostics?.totalCategories || 0}</span>
                <span className="text-amber-400">Active</span>
              </div>
            </div>

            {/* Banners */}
            <div className="bg-[#0E0E14] border border-[#1F1F2A] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-mono uppercase tracking-wider">Hero Banners</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-mono font-semibold text-white">
                {diagnostics?.totalHeroBanners || 0} Banners
              </div>
              <div className="text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                <span>Orders: {diagnostics?.totalOrders || 0}</span>
                <span className="text-purple-400">Synced</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 503 Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-[#333] max-w-xl w-full rounded-lg p-8 shadow-2xl border border-neutral-300 font-sans relative">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black font-mono text-sm px-2 py-1 rounded border border-neutral-200"
            >
              Close [✕]
            </button>
            <h1 className="text-xl font-normal text-neutral-900 border-b border-neutral-200 pb-3 mb-4">
              503 Service Temporarily Unavailable
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.
            </p>
            <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded font-mono text-[11px] text-neutral-500 space-y-1">
              <div>HTTP Status: 503 Service Unavailable</div>
              <div>Server: cloudflare-nginx / gateway</div>
              <div>Host: dnora.in</div>
              <div>Cluster: AWS-0-AP-NE-1 (Connection Timeout)</div>
              <div>Timestamp: {new Date().toISOString()}</div>
              <div>Trace: {customMessage}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
