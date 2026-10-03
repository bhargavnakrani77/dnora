"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  Calendar,
  Percent,
  IndianRupee,
  X,
} from "lucide-react";
import { Coupon, CouponDiscountType } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as CouponDiscountType,
    discount_value: "",
    minimum_order_amount: "",
    maximum_discount_amount: "",
    usage_limit: "",
    is_active: true,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const json = await res.json();
        setCoupons(json.coupons || []);
      }
    } catch {
      setStatusMsg({ type: "error", text: "Failed to load coupons." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleToggle = async (coupon: Coupon) => {
    setTogglingId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      if (res.ok) {
        setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      }
    } catch {
      setStatusMsg({ type: "error", text: "Toggle failed." });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon permanently?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setStatusMsg({ type: "success", text: "Coupon deleted." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Delete failed." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) {
      setStatusMsg({ type: "error", text: "Code and discount value are required." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase(),
          discount_value: parseFloat(form.discount_value),
          minimum_order_amount: parseFloat(form.minimum_order_amount || "0"),
          maximum_discount_amount: form.maximum_discount_amount ? parseFloat(form.maximum_discount_amount) : null,
          usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
          valid_until: form.valid_until || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setCoupons((prev) => [json.coupon, ...prev]);
        setShowForm(false);
        setForm({ code: "", description: "", discount_type: "percentage", discount_value: "", minimum_order_amount: "", maximum_discount_amount: "", usage_limit: "", is_active: true, valid_from: new Date().toISOString().slice(0, 10), valid_until: "" });
        setStatusMsg({ type: "success", text: `Coupon "${json.coupon.code}" created!` });
      } else {
        setStatusMsg({ type: "error", text: json.error || "Failed to create coupon." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error." });
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = (c: Coupon) => c.valid_until ? new Date(c.valid_until) < new Date() : false;
  const isFullyUsed = (c: Coupon) => c.usage_limit != null && c.used_count >= c.usage_limit;

  const activeCoupons = coupons.filter((c) => c.is_active && !isExpired(c) && !isFullyUsed(c)).length;
  const totalUsages = coupons.reduce((s, c) => s + c.used_count, 0);

  return (
    <div className="space-y-8 w-full pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-700 border border-purple-200">
              Discount Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Coupons & Discounts</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Create and manage promotional coupon codes for your customers.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button type="button" onClick={fetchCoupons} disabled={loading}
            className="p-2.5 text-neutral-600 hover:text-black bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 shadow-xs transition cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button type="button" onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs">
            <Plus className="w-4 h-4" />
            New Coupon
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200 ${statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-neutral-400 hover:text-neutral-700 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Coupons</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{coupons.length}</div>
          <div className="text-[11px] text-neutral-400 mt-1">All codes</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Active</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{activeCoupons}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Live & usable</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Usages</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{totalUsages}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Times redeemed</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Expired / Disabled</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{coupons.filter((c) => !c.is_active || isExpired(c)).length}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Inactive codes</div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            <p className="text-xs text-neutral-500">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Tag className="w-10 h-10 text-neutral-300 mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-neutral-800">No Coupons Yet</h3>
              <p className="text-xs text-neutral-500 mt-1">Create your first coupon code above.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min. Order</th>
                  <th className="py-3.5 px-4 text-center">Used / Limit</th>
                  <th className="py-3.5 px-4">Valid Until</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon);
                  const fullyUsed = isFullyUsed(coupon);
                  const effective = coupon.is_active && !expired && !fullyUsed;

                  return (
                    <tr key={coupon.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Code */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-lg tracking-wider">
                            {coupon.code}
                          </span>
                          <button onClick={() => handleCopy(coupon.code)} className="text-neutral-400 hover:text-neutral-700 transition cursor-pointer" title="Copy code">
                            {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {coupon.description && <p className="text-[11px] text-neutral-400 mt-1">{coupon.description}</p>}
                      </td>

                      {/* Discount */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-neutral-900 font-mono">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : formatPrice(coupon.discount_value)}
                        </span>
                        {coupon.discount_type === "percentage" && coupon.maximum_discount_amount && (
                          <p className="text-[11px] text-neutral-400 mt-0.5">Max {formatPrice(coupon.maximum_discount_amount)}</p>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="py-4 px-4 font-mono text-neutral-700">
                        {coupon.minimum_order_amount > 0 ? formatPrice(coupon.minimum_order_amount) : <span className="text-neutral-400 italic">None</span>}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-4 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-full ${fullyUsed ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-700"}`}>
                          {coupon.used_count}{coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : ""}
                        </span>
                      </td>

                      {/* Valid Until */}
                      <td className="py-4 px-4 text-neutral-600 font-mono text-[11px]">
                        {coupon.valid_until ? (
                          <span className={expired ? "text-red-500" : ""}>
                            {new Date(coupon.valid_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            {expired && " (Expired)"}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">No expiry</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`text-[9.5px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                          effective
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : expired
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-neutral-100 text-neutral-500 border-neutral-200"
                        }`}>
                          {effective ? "Active" : expired ? "Expired" : fullyUsed ? "Used Up" : "Disabled"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle */}
                          <button
                            type="button"
                            disabled={togglingId === coupon.id}
                            onClick={() => handleToggle(coupon)}
                            title={coupon.is_active ? "Disable coupon" : "Enable coupon"}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                          >
                            {togglingId === coupon.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : coupon.is_active ? (
                              <ToggleRight className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-neutral-400" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={deletingId === coupon.id}
                            onClick={() => handleDelete(coupon.id)}
                            title="Delete coupon"
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            {deletingId === coupon.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Create New Coupon</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Generate a promotional discount code</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Code */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">Coupon Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. DNORA20"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm font-mono font-bold uppercase tracking-widest bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Festive season offer"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                />
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">Discount Type *</label>
                  <div className="flex rounded-xl border border-neutral-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, discount_type: "percentage" }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition cursor-pointer ${form.discount_type === "percentage" ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}
                    >
                      <Percent className="w-3 h-3" /> %
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, discount_type: "fixed" }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition cursor-pointer ${form.discount_type === "fixed" ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}
                    >
                      <IndianRupee className="w-3 h-3" /> Fixed
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                    Value * {form.discount_type === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                    placeholder={form.discount_type === "percentage" ? "20" : "500"}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                    required
                  />
                </div>
              </div>

              {/* Min Order + Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">Min. Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minimum_order_amount}
                    onChange={(e) => setForm((f) => ({ ...f, minimum_order_amount: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                  />
                </div>
                {form.discount_type === "percentage" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">Max Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.maximum_discount_amount}
                      onChange={(e) => setForm((f) => ({ ...f, maximum_discount_amount: e.target.value }))}
                      placeholder="1000"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                    />
                  </div>
                )}
              </div>

              {/* Usage Limit */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">Usage Limit (leave blank = unlimited)</label>
                <input
                  type="number"
                  min="1"
                  value={form.usage_limit}
                  onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                  placeholder="e.g. 100"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />Valid From
                  </label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />Valid Until
                  </label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className="cursor-pointer"
                >
                  {form.is_active
                    ? <ToggleRight className="w-8 h-8 text-emerald-600" />
                    : <ToggleLeft className="w-8 h-8 text-neutral-400" />}
                </button>
                <span className="text-xs font-medium text-neutral-700">
                  {form.is_active ? "Active — coupon is usable immediately" : "Inactive — coupon is disabled"}
                </span>
              </div>

              {/* Submit */}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
