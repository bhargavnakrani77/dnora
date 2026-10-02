"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Sparkles,
  Coins,
  ShieldCheck,
  Clock,
  Eye,
  CreditCard,
  Banknote,
  PackageCheck,
} from "lucide-react";
import { ShippingConfig } from "@/types";

export default function AdminShippingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [isStandardEnabled, setIsStandardEnabled] = useState(true);
  const [standardTitle, setStandardTitle] = useState("Complimentary Insured Courier");
  const [standardRate, setStandardRate] = useState<number>(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(0);
  const [standardEstimatedDays, setStandardEstimatedDays] = useState("3-5 business days");

  const [isExpressEnabled, setIsExpressEnabled] = useState(true);
  const [expressTitle, setExpressTitle] = useState("VIP Express Air Courier");
  const [expressRate, setExpressRate] = useState<number>(150);
  const [expressEstimatedDays, setExpressEstimatedDays] = useState("1-2 business days");

  const [isCodEnabled, setIsCodEnabled] = useState(true);
  const [codCharge, setCodCharge] = useState<number>(0);

  // Fetch initial shipping config
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/shipping-settings");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const c: ShippingConfig = json.data;
            setIsStandardEnabled(c.is_standard_enabled ?? true);
            setStandardTitle(c.standard_title || "Complimentary Insured Courier");
            setStandardRate(c.standard_rate ?? 0);
            setFreeShippingThreshold(c.free_shipping_threshold ?? 0);
            setStandardEstimatedDays(c.standard_estimated_days || "3-5 business days");

            setIsExpressEnabled(c.is_express_enabled ?? true);
            setExpressTitle(c.express_title || "VIP Express Air Courier");
            setExpressRate(c.express_rate ?? 150);
            setExpressEstimatedDays(c.express_estimated_days || "1-2 business days");

            setIsCodEnabled(c.is_cod_enabled ?? true);
            setCodCharge(c.cod_charge ?? 0);
          }
        }
      } catch (err) {
        console.error("Failed to load shipping config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const payload: Partial<ShippingConfig> = {
        is_standard_enabled: isStandardEnabled,
        standard_title: standardTitle.trim(),
        standard_rate: Number(standardRate),
        free_shipping_threshold: Number(freeShippingThreshold),
        standard_estimated_days: standardEstimatedDays.trim(),
        is_express_enabled: isExpressEnabled,
        express_title: expressTitle.trim(),
        express_rate: Number(expressRate),
        express_estimated_days: expressEstimatedDays.trim(),
        is_cod_enabled: isCodEnabled,
        cod_charge: Number(codCharge),
      };

      const res = await fetch("/api/admin/shipping-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update shipping settings");
      }

      setStatusMsg({
        type: "success",
        text: "Shipping charges & logistics settings updated successfully! Live on checkout.",
      });

      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating settings";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
          Loading shipping management...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 pt-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-neutral-800" />
              <span>Shipping Charges & Logistics Management</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
              Live
            </span>
          </div>
          <p className="text-xs text-neutral-500 max-w-2xl">
            Configure live shipping rates, free delivery thresholds, VIP couriers, and Cash on Delivery fees across your boutique checkout.
          </p>
        </div>

        {/* Save button in header */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "Saving Changes..." : "Save Live Rates"}</span>
        </button>
      </div>

      {/* Status Alert Toast */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border shadow-sm transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Standard Delivery Options */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-blue-600" />
                <span>1. Standard Delivery Configuration</span>
              </h2>
              <p className="text-[11px] text-neutral-500">
                Primary courier service shown to all customers during checkout.
              </p>
            </div>

            {/* Toggle Enable */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <span className="text-xs font-semibold text-neutral-700">
                {isStandardEnabled ? "Active (Enabled)" : "Disabled"}
              </span>
              <input
                type="checkbox"
                checked={isStandardEnabled}
                onChange={(e) => setIsStandardEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                Delivery Method Title
              </label>
              <input
                type="text"
                value={standardTitle}
                onChange={(e) => setStandardTitle(e.target.value)}
                placeholder="e.g. Complimentary Insured Courier"
                className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-medium"
              />
              <p className="text-[10px] text-neutral-400 mt-1">Displayed as the shipping option title.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                Estimated Delivery Timeline
              </label>
              <input
                type="text"
                value={standardEstimatedDays}
                onChange={(e) => setStandardEstimatedDays(e.target.value)}
                placeholder="e.g. 3-5 business days"
                className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-medium"
              />
              <p className="text-[10px] text-neutral-400 mt-1">Expected transit days shown under the title.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                Standard Shipping Fee (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={standardRate}
                  onChange={(e) => setStandardRate(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Enter 0 for free standard delivery, or a fixed fee (e.g. 99).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                Free Shipping Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Orders with subtotal above this amount get 100% Free Shipping. (0 = threshold inactive).
              </p>
            </div>
          </div>
        </div>

        {/* 2. VIP / Express Delivery Options */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>2. VIP Express / Air Courier Delivery</span>
              </h2>
              <p className="text-[11px] text-neutral-500">
                Premium expedited courier option for urgent deliveries.
              </p>
            </div>

            {/* Toggle Enable */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <span className="text-xs font-semibold text-neutral-700">
                {isExpressEnabled ? "Active (Enabled)" : "Disabled"}
              </span>
              <input
                type="checkbox"
                checked={isExpressEnabled}
                onChange={(e) => setIsExpressEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                Express Method Title
              </label>
              <input
                type="text"
                value={expressTitle}
                onChange={(e) => setExpressTitle(e.target.value)}
                placeholder="e.g. VIP Express Air Courier"
                className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                Express Delivery Timeline
              </label>
              <input
                type="text"
                value={expressEstimatedDays}
                onChange={(e) => setExpressEstimatedDays(e.target.value)}
                placeholder="e.g. 1-2 business days"
                className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                Express Shipping Fee (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={expressRate}
                  onChange={(e) => setExpressRate(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">Extra fee charged when selected (e.g. 150).</p>
            </div>
          </div>
        </div>

        {/* 3. Cash on Delivery (COD) Settings */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>3. Cash on Delivery (COD) Policy</span>
              </h2>
              <p className="text-[11px] text-neutral-500">
                Control whether customers can choose COD and charge an optional handling fee.
              </p>
            </div>

            {/* Toggle Enable */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <span className="text-xs font-semibold text-neutral-700">
                {isCodEnabled ? "COD Allowed" : "COD Disabled"}
              </span>
              <input
                type="checkbox"
                checked={isCodEnabled}
                onChange={(e) => setIsCodEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                COD Extra Handling Charge (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={codCharge}
                  onChange={(e) => setCodCharge(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Set 0 for free COD, or add an extra fee (e.g. ₹50) for cash handling.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
              <p className="font-bold text-neutral-800">💡 Checkout Impact:</p>
              <p className="text-[11px] text-neutral-600 leading-relaxed font-light">
                {isCodEnabled
                  ? `Customers will be able to select Cash on Delivery.${
                      codCharge > 0 ? ` An extra fee of ₹${codCharge} will be added to order total.` : " No extra COD fee is charged."
                    }`
                  : "Cash on Delivery is disabled. Customers will only be able to checkout using Online Gateway (UPI, Card, NetBanking)."}
              </p>
            </div>
          </div>
        </div>

        {/* Live Customer Checkout Simulation Preview */}
        <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#E5C378]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Live Storefront Checkout Simulation Preview
              </h3>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Step 2: Shipping Options</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Standard Preview */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isStandardEnabled
                  ? "bg-white/10 border-white/30"
                  : "bg-white/5 border-white/10 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">
                  {standardTitle || "Standard Delivery"}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {standardRate === 0 ? "FREE" : `₹${standardRate}`}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 font-light">
                Standard delivery ({standardEstimatedDays || "3-5 business days"}).
                {freeShippingThreshold > 0 && ` Free for orders over ₹${freeShippingThreshold}.`}
              </p>
            </div>

            {/* Express Preview */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isExpressEnabled
                  ? "bg-white/10 border-purple-400/40"
                  : "bg-white/5 border-white/10 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#E5C378]" />
                  <span>{expressTitle || "Express Delivery"}</span>
                </span>
                <span className="text-xs font-bold text-purple-300 font-mono">
                  ₹{expressRate}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 font-light">
                Priority express delivery ({expressEstimatedDays || "1-2 business days"}).
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin"
            className="px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-black rounded-xl transition border border-neutral-200 bg-white hover:bg-neutral-50 shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving Changes..." : "Save Live Shipping Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
