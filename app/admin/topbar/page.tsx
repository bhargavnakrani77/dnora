"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  ExternalLink,
  Eye,
  Sliders,
  ShieldCheck,
  Search,
  Heart,
  User,
  ShoppingBag,
  Phone,
  Mail,
} from "lucide-react";
import { TopBarConfig, DEFAULT_TOPBAR_CONFIG } from "@/lib/topbar-constants";

export default function AdminTopBarPage() {
  const [config, setConfig] = useState<TopBarConfig>(DEFAULT_TOPBAR_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/topbar");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || DEFAULT_TOPBAR_CONFIG);
      } else {
        showStatus("error", "Failed to load TopBar settings");
      }
    } catch {
      showStatus("error", "Error connecting to TopBar settings API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/topbar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (res.ok) {
        showStatus("success", "TopBar configuration saved successfully");
      } else {
        showStatus("error", "Failed to save TopBar configuration");
      }
    } catch {
      showStatus("error", "Communication failure while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to restore factory luxury TopBar settings?")) return;
    setConfig(DEFAULT_TOPBAR_CONFIG);
    setSaving(true);
    try {
      const res = await fetch("/api/topbar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: DEFAULT_TOPBAR_CONFIG }),
      });
      if (res.ok) {
        showStatus("success", "TopBar reset to defaults");
      }
    } catch {
      showStatus("error", "Failed to reset settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 uppercase">
            Top Bar Studio
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure luxury brand typography, concierge contact details, feature toggles, and header controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={fetchConfig}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div
          className={`flex items-center gap-2.5 p-3.5 text-xs rounded-lg font-medium transition animate-in fade-in ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Live Interactive Preview Box */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-800">
              Live Top Bar Header Simulation
            </h2>
          </div>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black"
          >
            <span>Open Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Header Preview Rendering */}
        <div className="p-6 bg-white border-b border-neutral-100">
          <div className="border border-neutral-200 rounded-lg p-4 shadow-sm bg-white">
            <div className="flex items-center justify-between h-14 border-b border-neutral-100 px-4">
              {/* Left: Menu & Search */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-900">
                  MENU
                </span>
                {config.show_search && (
                  <div className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                    <Search className="w-3 h-3" />
                    <span>Search</span>
                  </div>
                )}
              </div>

              {/* Center: Brand Typography */}
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-serif tracking-[0.25em] font-light uppercase text-black">
                  {config.brand_name || "DNORA"}
                </h3>
                {config.tagline && (
                  <p className="text-[8px] tracking-[0.3em] uppercase text-neutral-400 font-medium">
                    {config.tagline}
                  </p>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4 text-neutral-800">
                {config.show_wishlist && <Heart className="w-4 h-4 text-neutral-700" />}
                {config.show_account && <User className="w-4 h-4 text-neutral-700" />}
                {config.show_cart && (
                  <div className="relative">
                    <ShoppingBag className="w-4 h-4 text-black" />
                    <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                      0
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Concierge Bar Preview */}
            <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-2 px-4">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-neutral-400" />
                {config.concierge_phone || "+39 02 8901 3450"}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-neutral-400" />
                {config.concierge_email || "concierge@dnora.luxury"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Settings Form */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        {/* Brand Identity & Typography */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Sliders className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              Brand Identity & Header Typography
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Brand Name (Center Logo Text)
              </label>
              <input
                type="text"
                required
                value={config.brand_name}
                onChange={(e) => setConfig({ ...config, brand_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black uppercase font-serif tracking-widest"
                placeholder="DNORA"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Tagline / Sub-Heading
              </label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black tracking-widest text-xs"
                placeholder="HAUTE MAROQUINERIE • MILANO / PARIS"
              />
            </div>
          </div>
        </div>

        {/* Concierge & Support Contact */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <ShieldCheck className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              VIP Concierge & Client Support Contact
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Concierge Telephone Support
              </label>
              <input
                type="text"
                value={config.concierge_phone}
                onChange={(e) => setConfig({ ...config, concierge_phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black font-mono text-xs"
                placeholder="+39 02 8901 3450"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Concierge Email Address
              </label>
              <input
                type="email"
                value={config.concierge_email}
                onChange={(e) => setConfig({ ...config, concierge_email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black font-mono text-xs"
                placeholder="concierge@dnora.luxury"
              />
            </div>
          </div>
        </div>

        {/* Feature Switches & Visibility Toggles */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Eye className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              Header Action Toggles & Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Show Search */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 cursor-pointer hover:bg-neutral-50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Search Button
                </span>
                <span className="text-[11px] text-neutral-500">
                  Quick live search modal on left header
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.show_search}
                onChange={(e) => setConfig({ ...config, show_search: e.target.checked })}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </label>

            {/* Show Wishlist */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 cursor-pointer hover:bg-neutral-50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Wishlist Heart Trigger
                </span>
                <span className="text-[11px] text-neutral-500">
                  Allow shoppers to view saved items
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.show_wishlist}
                onChange={(e) => setConfig({ ...config, show_wishlist: e.target.checked })}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </label>

            {/* Show Account */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 cursor-pointer hover:bg-neutral-50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Member Portal / Account Icon
                </span>
                <span className="text-[11px] text-neutral-500">
                  Customer login, profile & order tracking
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.show_account}
                onChange={(e) => setConfig({ ...config, show_account: e.target.checked })}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </label>

            {/* Show Cart Bag */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 cursor-pointer hover:bg-neutral-50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Shopping Bag Drawer Trigger
                </span>
                <span className="text-[11px] text-neutral-500">
                  Side drawer with item counter badge
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.show_cart}
                onChange={(e) => setConfig({ ...config, show_cart: e.target.checked })}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </label>

            {/* Sticky Header */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 cursor-pointer hover:bg-neutral-50 sm:col-span-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Sticky Header with Glassmorphism Blur
                </span>
                <span className="text-[11px] text-neutral-500">
                  TopBar remains pinned at the top with translucent backdrop blur when scrolling
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.is_sticky}
                onChange={(e) => setConfig({ ...config, is_sticky: e.target.checked })}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save TopBar Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
