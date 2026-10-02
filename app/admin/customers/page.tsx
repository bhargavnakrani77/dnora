"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { AdminCustomer } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "admin" | "buyers">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.customers || []);
      } else {
        setStatusMsg({ type: "error", text: "Failed to load customers from server." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error loading customer directory." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      (c.full_name && c.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery.trim()));

    if (!matchesSearch) return false;

    if (roleFilter === "customer") return c.role === "customer";
    if (roleFilter === "admin") return c.role === "admin";
    if (roleFilter === "buyers") return c.total_orders > 0;
    return true;
  });

  const totalSpentLtv = customers.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);
  const activeBuyersCount = customers.filter((c) => c.total_orders > 0).length;

  return (
    <div className="space-y-8 w-full pb-16 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-700 border border-purple-200">
              Maison CRM & Clients
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Registered Customers & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            View all authenticated client profiles, registration dates, order histories, and delivery destinations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2.5 text-neutral-600 hover:text-black bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 shadow-xs transition cursor-pointer"
            title="Refresh Customers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Registered</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{customers.length}</div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Authenticated accounts</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Active Buyers</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{activeBuyersCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Clients with orders placed</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Customer LTV</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono">
            {formatPrice(totalSpentLtv)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Cumulative order value</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Avg Value / Buyer</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono">
            {activeBuyersCount > 0 ? formatPrice(totalSpentLtv / activeBuyersCount) : "₹0"}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Across purchasing clients</div>
        </div>
      </div>

      {/* Search & Tabs Filter */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              roleFilter === "all"
                ? "bg-neutral-900 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            All ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("buyers")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              roleFilter === "buyers"
                ? "bg-neutral-900 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Buyers ({activeBuyersCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("customer")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              roleFilter === "customer"
                ? "bg-neutral-900 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Clients Only
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("admin")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              roleFilter === "admin"
                ? "bg-neutral-900 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            <p className="text-xs text-neutral-500 font-medium">Retrieving client records...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 text-neutral-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-800">No Customers Found</h3>
              <p className="text-xs text-neutral-500">
                {searchQuery ? "No client matches your search filter." : "No registered customers in the database yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Registered On</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3.5 px-4">Primary Destination</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredCustomers.map((cust) => {
                  const initial = cust.full_name ? cust.full_name.charAt(0) : cust.email.charAt(0);

                  return (
                    <tr key={cust.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Customer Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initial.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900">
                              {cust.full_name || "Maison Guest"}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono">
                              {cust.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="text-neutral-700 flex items-center gap-1.5 font-mono text-[11.5px]">
                            {cust.phone ? cust.phone : <span className="text-neutral-400 font-sans italic">No phone</span>}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`text-[9.5px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                            cust.role === "admin"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-neutral-100 text-neutral-700 border-neutral-200"
                          }`}
                        >
                          {cust.role}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-4 text-neutral-600 font-mono text-[11px]">
                        {new Date(cust.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Orders */}
                      <td className="py-4 px-4 text-center">
                        <span className={`font-bold font-mono px-2 py-0.5 rounded-full ${cust.total_orders > 0 ? "bg-emerald-50 text-emerald-800" : "text-neutral-400"}`}>
                          {cust.total_orders}
                        </span>
                      </td>

                      {/* Spent */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-neutral-900">
                        {formatPrice(cust.total_spent)}
                      </td>

                      {/* Primary Address */}
                      <td className="py-4 px-4 text-neutral-600 max-w-xs truncate">
                        {cust.primary_address ? (
                          <span title={`${cust.primary_address.city}, ${cust.primary_address.state}`}>
                            {cust.primary_address.city}, {cust.primary_address.state}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">None saved</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOMER DETAILS MODAL / DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {selectedCustomer.full_name
                    ? selectedCustomer.full_name.charAt(0).toUpperCase()
                    : selectedCustomer.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-neutral-900">
                    {selectedCustomer.full_name || "Maison Client"}
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono">{selectedCustomer.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-center">
                <div className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Role</div>
                <div className="text-xs font-bold uppercase tracking-widest text-neutral-800 mt-1">
                  {selectedCustomer.role}
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-center">
                <div className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Total Orders</div>
                <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
                  {selectedCustomer.total_orders}
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-center">
                <div className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Total Value</div>
                <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
                  {formatPrice(selectedCustomer.total_spent)}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 border-b border-neutral-100 pb-1.5">
                Contact & Account Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <span className="font-mono">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <span className="font-mono">{selectedCustomer.phone || "No phone listed"}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>Joined {new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Authenticated Identity</span>
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 border-b border-neutral-100 pb-1.5">
                Saved Delivery Addresses ({selectedCustomer.addresses?.length || 0})
              </h4>
              {(!selectedCustomer.addresses || selectedCustomer.addresses.length === 0) ? (
                <p className="text-xs text-neutral-400 italic">No delivery addresses on file.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900">{addr.full_name}</span>
                        {addr.is_default && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-neutral-900 text-white">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-600 leading-snug">
                        {addr.address_line1} {addr.address_line2}
                        <br />
                        {addr.city}, {addr.state} {addr.postal_code}
                      </p>
                      <p className="text-neutral-500 font-mono text-[11px]">Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
