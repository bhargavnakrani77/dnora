"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurPwd, setShowCurPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!newPwd || newPwd.length < 4) {
      setStatusMsg({ type: "error", text: "New password must be at least 4 characters long." });
      return;
    }

    if (newPwd !== confirmPwd) {
      setStatusMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPwd || undefined,
          newPassword: newPwd,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: "success", text: "Admin master password has been successfully updated!" });
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      } else {
        setStatusMsg({ type: "error", text: data.error || "Failed to update password." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-neutral-900 text-white">
            Security & Controls
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Admin Settings & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Manage master administrator security, update access passwords, and manage customer account security credentials.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Change Password Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 pb-5 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-amber-400 flex items-center justify-center shadow-xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">Change Admin Master Password</h2>
                <p className="text-xs text-neutral-500">Update your credentials for the administration panel</p>
              </div>
            </div>

            {statusMsg && (
              <div
                className={`mt-5 p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                  statusMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {statusMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurPwd ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="Enter current admin password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurPwd(!showCurPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showCurPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Enter new password (min. 4 characters)"
                    minLength={4}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Re-enter new password"
                    minLength={4}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPwd && newPwd !== confirmPwd && (
                  <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !newPwd || newPwd !== confirmPwd}
                  className="px-6 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Quick Links & Information */}
        <div className="space-y-6">
          {/* Quick link to customers */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Customer Passwords</h3>
              <p className="text-xs text-neutral-500 mt-1">
                View plain passwords, reveal/hide credentials, or set new passwords for any registered client.
              </p>
            </div>
            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-900 hover:text-purple-700 transition"
            >
              <span>Manage Customer Passwords</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Security Overview */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Authentication Security</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Admin sessions are protected with encrypted HTTP-only session cookies with strict SameSite verification. Changing your password immediately invalidates unauthorized access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
