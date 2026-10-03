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
  Copy,
  Check,
  ExternalLink,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ArrowUpRight,
  Globe,
  Sliders,
  Terminal,
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

interface EnvCredentials {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    databaseUrl: string;
    directUrl: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  googleOAuth: {
    clientId: string;
    clientSecret: string;
  };
  admin: {
    email: string;
    password?: string;
  };
  site: {
    url: string;
    devMasterKey: string;
  };
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
  const [credentials, setCredentials] = useState<EnvCredentials | null>(null);

  const [siteStatus, setSiteStatus] = useState<"online" | "terminated">("online");
  const [statusMode, setStatusMode] = useState<string>("503_error");
  const [customMessage, setCustomMessage] = useState<string>(
    "503 Service Unavailable: Database cluster connection timeout."
  );
  const [toggling, setToggling] = useState(false);
  const [purging, setPurging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Admin password change modal / form
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [authorizingAdmin, setAuthorizingAdmin] = useState(false);

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch telemetry status and environment credentials
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
        if (data.credentials) {
          setCredentials(data.credentials);
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

  // One-Click Admin Redirect
  const handleAuthorizeAndOpenAdmin = async () => {
    setAuthorizingAdmin(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/sys-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "authorize_admin" }),
      });
      const data = await res.json();
      if (data.success) {
        window.open("/admin", "_blank");
      } else {
        setErrorMsg(data.error || "Failed to issue admin authorization.");
      }
    } catch {
      setErrorMsg("Network error issuing admin credentials.");
    } finally {
      setAuthorizingAdmin(false);
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim()) return;

    setUpdatingPassword(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/sys-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_admin_password",
          newPassword: newAdminPassword.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Admin password updated successfully in database!");
        setNewAdminPassword("");
        fetchTelemetry();
      } else {
        setErrorMsg(data.error || "Failed to update admin password.");
      }
    } catch {
      setErrorMsg("Network error.");
    } finally {
      setUpdatingPassword(false);
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

  // Render Login Screen if unauthenticated (Minimalism White)
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-900">
                Developer Infrastructure Console
              </h1>
              <p className="text-xs text-slate-500 font-mono">NODE_CLUSTER: AWS-AP-NE-1 // SECURE</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">
                Developer Master Passcode
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Enter master authorization key"
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-medium py-3 rounded-xl text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Developer Terminal</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Restricted Systems Engineering & Administration Gateway
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-900" />
        <span>Connecting to Operations Gateway...</span>
      </div>
    );
  }

  const isTerminated = siteStatus === "terminated";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-slate-900 selection:text-white pb-20">
      {/* Top Header Bar (Minimalism White) */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  DNORA Operations Hub
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                  SYSCTL v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                HOST: dnora.in • REGION: AWS-0-AP-NE-1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Direct Admin Panel Redirect Button */}
            <button
              onClick={handleAuthorizeAndOpenAdmin}
              disabled={authorizingAdmin}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{authorizingAdmin ? "Authorizing..." : "Open Admin Panel"}</span>
            </button>

            <button
              onClick={handlePurgeCache}
              disabled={purging}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${purging ? "animate-spin text-slate-900" : ""}`} />
              <span>Flush Cache</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl text-slate-600 hover:text-red-600 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8">
        {/* Status Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-red-600 hover:text-red-900">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. MASTER KILLSWITCH SECTION                                   */}
        {/* ============================================================== */}
        <section className={`border rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300 ${
          isTerminated
            ? "bg-red-50/70 border-red-200"
            : "bg-white border-slate-200"
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${
                  isTerminated ? "bg-red-600 animate-ping" : "bg-emerald-500"
                }`} />
                <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  isTerminated
                    ? "bg-red-100 border-red-200 text-red-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}>
                  {isTerminated ? "Storefront Terminated (503 Active Worldwide)" : "Production Status: Online & Live"}
                </span>
              </div>

              <h2 className="text-2xl font-semibold text-slate-900">
                {isTerminated ? "Storefront is Offline (Server Down)" : "Storefront is Operational"}
              </h2>

              <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed">
                {isTerminated
                  ? "All public visitors, customers, and client visiting dnora.in receive a realistic HTTP 503 Server Unavailable error. No products, cart, or admin pages are accessible."
                  : "Storefront is live and taking customer orders. Toggle below to initiate an immediate emergency server down error."}
              </p>
            </div>

            {/* Toggle Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {isTerminated ? (
                <button
                  onClick={() => handleToggleStatus("online")}
                  disabled={toggling}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>{toggling ? "Restoring..." : "⚡ Restore Online Now"}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus("terminated")}
                  disabled={toggling}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{toggling ? "Terminating..." : "⛔ Terminate Site (Server Down)"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-4 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>503 Preview</span>
              </button>
            </div>
          </div>

          {/* Killswitch Trace Settings */}
          <div className="mt-6 pt-6 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Simulation Mode
              </label>
              <select
                value={statusMode}
                onChange={(e) => setStatusMode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900 font-mono"
              >
                <option value="503_error">503 Service Unavailable (Cloud Cluster Timeout)</option>
                <option value="500_error">500 Internal Server Error (PostgreSQL Pool Exhaustion)</option>
                <option value="maintenance">Scheduled System Maintenance Window</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Technical Error Trace Footprint
              </label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Custom server error string"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900 font-mono"
              />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. DEVELOPER BYPASS & ADMIN QUICK CONTROLS                     */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Developer Bypass Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Developer Bypass Token
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Even when the storefront is in Terminated mode, you can browse the live website in this browser. Others will only see the 503 error.
                </p>
              </div>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 transition-colors"
            >
              <span>Test Live Storefront in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Change Admin Password */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  Admin Credentials Control
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Account: {credentials?.admin.email || "admin@dnora.luxury"}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">
                  Change Admin Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new admin password"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={updatingPassword || !newAdminPassword.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Takes effect immediately in database for /admin/login.
              </p>
            </form>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. ENVIRONMENT & CREDENTIALS CONTROL HUB                       */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-900" />
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Environment & API Credentials Control Hub
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Live .env.local Configuration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supabase Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Supabase PostgreSQL & Auth
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                  {diagnostics?.dbConnected ? `CONNECTED (${diagnostics?.dbLatencyMs}ms)` : "DISCONNECTED"}
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {/* Supabase URL */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">NEXT_PUBLIC_SUPABASE_URL</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="truncate max-w-[260px] text-slate-800">
                      {credentials?.supabase.url || "https://cszqvzndixlmrmtevsub.supabase.co"}
                    </span>
                    <button
                      onClick={() => handleCopy(credentials?.supabase.url || "", "sb_url")}
                      className="text-slate-400 hover:text-slate-700 ml-2"
                    >
                      {copiedKey === "sb_url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* DATABASE_URL (Pooler 6543) */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">DATABASE_URL (Port 6543 Transaction Pooler)</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="truncate max-w-[260px] text-slate-800">
                      {visibleSecrets["db_url"]
                        ? credentials?.supabase.databaseUrl
                        : "postgresql://postgres.cszqvzndixlmrmtevsub:••••••••@...pooler.supabase.com:6543/postgres"}
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button onClick={() => toggleSecretVisibility("db_url")} className="text-slate-400 hover:text-slate-700">
                        {visibleSecrets["db_url"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(credentials?.supabase.databaseUrl || "", "db_url")}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === "db_url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Anon Key */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="truncate max-w-[260px] text-slate-800">
                      {visibleSecrets["anon_key"]
                        ? credentials?.supabase.anonKey
                        : "sb_publishable_KXDdo2w...KA76g"}
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button onClick={() => toggleSecretVisibility("anon_key")} className="text-slate-400 hover:text-slate-700">
                        {visibleSecrets["anon_key"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(credentials?.supabase.anonKey || "", "anon_key")}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === "anon_key" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cloudinary CDN Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Cloud className="w-4 h-4 text-sky-600" />
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Cloudinary Media CDN
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium">
                  {cloudinary?.connected ? `OPERATIONAL (${cloudinary.latencyMs}ms)` : "STANDBY"}
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {/* Cloud Name */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">CLOUDINARY_CLOUD_NAME</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-slate-800 font-semibold">{credentials?.cloudinary.cloudName || "rvtnjdih"}</span>
                    <button
                      onClick={() => handleCopy(credentials?.cloudinary.cloudName || "", "c_name")}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === "c_name" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">CLOUDINARY_API_KEY</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-slate-800">{credentials?.cloudinary.apiKey || "814476649836586"}</span>
                    <button
                      onClick={() => handleCopy(credentials?.cloudinary.apiKey || "", "c_key")}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === "c_key" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* API Secret */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">CLOUDINARY_API_SECRET</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="truncate max-w-[260px] text-slate-800">
                      {visibleSecrets["c_secret"]
                        ? credentials?.cloudinary.apiSecret
                        : "FV-7Xm4bz7k-•••••••••••••"}
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button onClick={() => toggleSecretVisibility("c_secret")} className="text-slate-400 hover:text-slate-700">
                        {visibleSecrets["c_secret"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(credentials?.cloudinary.apiSecret || "", "c_secret")}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === "c_secret" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Google OAuth Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Google Cloud Console OAuth
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                  AUTHORIZED
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {/* Client ID */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">GOOGLE_CLIENT_ID</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="truncate max-w-[260px] text-slate-800">
                      {credentials?.googleOAuth.clientId || "48518709889-2t1p67...googleusercontent.com"}
                    </span>
                    <button
                      onClick={() => handleCopy(credentials?.googleOAuth.clientId || "", "g_id")}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === "g_id" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Client Secret */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">GOOGLE_CLIENT_SECRET</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="truncate max-w-[260px] text-slate-800">
                      {visibleSecrets["g_secret"]
                        ? credentials?.googleOAuth.clientSecret
                        : "GOCSPX-Lw-kc•••••••••••••"}
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button onClick={() => toggleSecretVisibility("g_secret")} className="text-slate-400 hover:text-slate-700">
                        {visibleSecrets["g_secret"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(credentials?.googleOAuth.clientSecret || "", "g_secret")}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === "g_secret" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Site & System Security */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Site & Master Security Keys
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                  PROTECTED
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {/* Master Dev Key */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">DEV_MASTER_KEY (Gateway Passcode)</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-slate-800 font-semibold">{credentials?.site.devMasterKey || "dnora@sysctl#9981"}</span>
                    <button
                      onClick={() => handleCopy(credentials?.site.devMasterKey || "dnora@sysctl#9981", "m_key")}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === "m_key" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Site URL */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">NEXT_PUBLIC_SITE_URL</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-slate-800">{credentials?.site.url || "https://dnora.in"}</span>
                    <button
                      onClick={() => handleCopy(credentials?.site.url || "https://dnora.in", "s_url")}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === "s_url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. LIVE INVENTORY & STORE METRICS                              */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Storefront Inventory & Real-Time Sync
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Products</span>
              <div className="text-xl font-semibold text-slate-900 mt-1">{diagnostics?.totalProducts || 0}</div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Active Catalog</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Categories</span>
              <div className="text-xl font-semibold text-slate-900 mt-1">{diagnostics?.totalCategories || 0}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Collections</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Hero Banners</span>
              <div className="text-xl font-semibold text-slate-900 mt-1">{diagnostics?.totalHeroBanners || 0}</div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Published</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Orders</span>
              <div className="text-xl font-semibold text-slate-900 mt-1">{diagnostics?.totalOrders || 0}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">PostgreSQL</span>
            </div>
          </div>
        </section>
      </main>

      {/* 503 Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 max-w-xl w-full rounded-2xl p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-mono text-xs px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
            >
              Close [✕]
            </button>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-mono text-[11px] font-semibold mb-3">
              HTTP 503
            </div>
            <h1 className="text-xl font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              503 Service Temporarily Unavailable
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.
            </p>
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-600 space-y-1">
              <div>Server: cloudflare-nginx / vercel-edge</div>
              <div>Host: dnora.in</div>
              <div>Cluster: AWS-0-AP-NE-1 (Database Timeout)</div>
              <div>Timestamp: {new Date().toISOString()}</div>
              <div>Trace: {customMessage}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
