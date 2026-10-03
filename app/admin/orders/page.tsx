"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  Edit,
  ChevronRight,
  Loader2,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  CreditCard,
  User,
  X,
  Check,
  Printer,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Order, OrderItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import InvoiceModal from "@/components/InvoiceModal";

interface PaymentStats {
  totalPaid: number;
  codPaid: number;
  gatewayPaid: number;
  gatewayPending: number;
  codPending: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);

  // Financial Payment Breakdown stats
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalPaid: 0,
    codPaid: 0,
    gatewayPaid: 0,
    gatewayPending: 0,
    codPending: 0,
  });

  // Order Deletion State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status updating in modal
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("paid");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Bulk select state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("confirmed");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalCount(data.total || 0);
        if (data.paymentStats) {
          setPaymentStats(data.paymentStats);
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
        setOrderToDelete(null);
        fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete order");
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("An unexpected error occurred while deleting the order.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedOrderIds.size === 0) return;
    setBulkUpdating(true);
    setBulkSuccess(null);
    try {
      const res = await fetch("/api/admin/orders/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: Array.from(selectedOrderIds), status: bulkStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setBulkSuccess(`${data.updated} orders updated to "${bulkStatus}".`);
        setSelectedOrderIds(new Set());
        fetchOrders();
        setTimeout(() => setBulkSuccess(null), 3000);
      }
    } catch {
      console.error("Bulk update failed");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleWhatsAppOrder = (order: Order) => {
    const phone = order.customer_phone?.replace(/\D/g, "");
    if (!phone) return;
    const msg = encodeURIComponent(
      `Hello ${order.customer_name}, your DNORA Lifestyle order ${order.order_number} is now ${order.status.toUpperCase()}. ` +
      (order.tracking_number ? `Tracking: ${order.tracking_number} (${order.carrier || "Courier"})` : "We will share the tracking details shortly.") +
      ` Thank you for shopping with us! 🛍️`
    );
    window.open(`https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${msg}`, "_blank");
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.payment_status || "paid");
    setCarrier(order.carrier || "BlueDart Express");
    setTrackingNumber(order.tracking_number || "");
    setNotes(order.notes || "");
    setUpdateSuccess(false);
  };

  const handleSaveOrderUpdate = async () => {
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(true);
      setUpdateSuccess(false);

      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          carrier,
          trackingNumber,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data.order);
        setUpdateSuccess(true);
        // Refresh table list
        fetchOrders();
        setTimeout(() => setUpdateSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Metrics
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const shippedOrders = orders.filter((o) => o.status === "shipped").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing":
      case "confirmed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Orders & Shipments Management
          </h1>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Monitor client orders, dispatch status, tracking numbers, and fulfillment.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Total Orders</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1 font-mono">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">Pending / Action</p>
          <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">{pendingOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">In Transit / Shipped</p>
          <p className="text-2xl font-bold text-blue-700 mt-1 font-mono">{shippedOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Total Volume</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1 font-mono">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Live Payment Breakdown & Settlement Card */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">Payment Realization & Settlement Breakdown</h2>
              <p className="text-[11px] text-neutral-400 font-light">
                Live financial split: received revenue vs pending collections across Payment Gateway & COD.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold self-start sm:self-auto">
            Live Settlement
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 pt-1">
          {/* 1. Total Paid Overall */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Total Received</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                {formatPrice(paymentStats.totalPaid)}
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> All settled revenue
            </p>
          </div>

          {/* 2. Gateway Received (Prepaid) */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Gateway Received</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                {formatPrice(paymentStats.gatewayPaid)}
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1 font-mono">
              Prepaid / Online
            </p>
          </div>

          {/* 3. COD Received (Collected) */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">COD Collected</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-purple-300 mt-1">
                {formatPrice(paymentStats.codPaid)}
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
              Delivered Handover
            </p>
          </div>

          {/* 4. Gateway Pending */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider">Gateway Pending</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-amber-300 mt-1">
                {formatPrice(paymentStats.gatewayPending)}
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
              Awaiting clearance
            </p>
          </div>

          {/* 5. COD Pending */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-rose-400/90 uppercase tracking-wider">COD Pending</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-rose-300 mt-1">
                {formatPrice(paymentStats.codPending)}
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
              Awaiting delivery
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-neutral-950 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, customer, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-hidden focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Bulk Success Toast */}
      {bulkSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {bulkSuccess}
        </div>
      )}

      {/* Bulk Toolbar — appears when orders are selected */}
      {selectedOrderIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 bg-neutral-900 text-white rounded-xl animate-in fade-in duration-200">
          <span className="text-xs font-bold">{selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""} selected</span>
          <div className="flex items-center gap-2 flex-1">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
            >
              {["pending","processing","confirmed","shipped","delivered","cancelled"].map((s) => (
                <option key={s} value={s} className="text-neutral-900 bg-white">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={bulkUpdating}
              onClick={handleBulkUpdate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-neutral-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition cursor-pointer disabled:opacity-60"
            >
              {bulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Apply to All
            </button>
            <button
              type="button"
              onClick={() => setSelectedOrderIds(new Set())}
              className="ml-auto px-3 py-1.5 text-white/60 hover:text-white text-xs cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-7 h-7 text-neutral-900 animate-spin mx-auto mb-2" />
            <p className="text-xs text-neutral-500 font-light">Loading client orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-semibold text-neutral-900">No Orders Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-light">
              There are currently no orders matching your status filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.size === orders.length && orders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrderIds(new Set(orders.map((o) => o.id)));
                        } else {
                          setSelectedOrderIds(new Set());
                        }
                      }}
                      className="w-3.5 h-3.5 rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => {
                  const isChecked = selectedOrderIds.has(order.id);
                  return (
                    <tr key={order.id} className={`hover:bg-neutral-50/70 transition-colors ${isChecked ? "bg-blue-50/40" : ""}`}>
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = new Set(selectedOrderIds);
                            if (e.target.checked) next.add(order.id);
                            else next.delete(order.id);
                            setSelectedOrderIds(next);
                          }}
                          className="w-3.5 h-3.5 rounded cursor-pointer"
                        />
                      </td>
                      {/* Order Number */}
                      <td className="px-4 py-3.5 font-mono font-bold text-neutral-900">
                        {order.order_number}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-neutral-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-neutral-900">{order.customer_name}</p>
                        <p className="text-[11px] text-neutral-500">{order.customer_email}</p>
                        {order.customer_phone && (
                          <p className="text-[10px] text-neutral-400 font-mono">{order.customer_phone}</p>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {order.items?.slice(0, 2).map((it, i) => (
                            <div
                              key={i}
                              className="relative w-8 h-9 rounded-sm overflow-hidden bg-neutral-100 border border-neutral-200"
                              title={`${it.product_name} (x${it.quantity})`}
                            >
                              {it.image_url ? (
                                <Image src={it.image_url} alt={it.product_name} fill className="object-cover" />
                              ) : (
                                <Package className="w-3 h-3 text-neutral-400 m-auto" />
                              )}
                            </div>
                          ))}
                          <span className="text-[11px] text-neutral-500 font-medium">
                            {order.items?.length || 1} {order.items?.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 font-mono font-bold text-neutral-900">
                        {formatPrice(order.total_amount)}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                              order.payment_status === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {order.payment_status || "paid"}
                          </span>
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-xs font-semibold ${
                              order.payment_method === "cod"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {order.payment_method === "cod" ? "Cash On Delivery" : order.payment_method || "Online"}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp */}
                          {order.customer_phone && (
                            <button
                              type="button"
                              onClick={() => handleWhatsAppOrder(order)}
                              title="Send WhatsApp tracking update"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewingInvoiceOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-800 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                            title="Instant View & Print Bill"
                          >
                            <Printer className="w-3 h-3 text-neutral-600" />
                            <span>Bill</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-900 bg-neutral-900 hover:bg-black text-white text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Manage</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-neutral-400 hover:text-rose-600 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                            title="Permanently Delete Order"
                          >
                            <Trash2 className="w-3 h-3" />
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

      {/* Order Details Slide-Over / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900 font-mono">
                    {selectedOrder.order_number}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingInvoiceOrder(selectedOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Tax Invoice / Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Order Status Action Panel */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Update Fulfillment & Tracking
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                      Fulfillment Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-hidden focus:border-neutral-950 font-medium"
                    >
                      <option value="pending">Pending (Awaiting fulfillment)</option>
                      <option value="processing">Processing (Atelier tailoring)</option>
                      <option value="shipped">Shipped (In transit)</option>
                      <option value="delivered">Delivered (Completed)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                      Payment Status (COD / Online)
                    </label>
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-hidden focus:border-neutral-950 font-medium"
                    >
                      <option value="paid">Paid (Funds Verified)</option>
                      <option value="pending">Pending (Cash on Delivery Due)</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                      Carrier Service
                    </label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g. BlueDart, Delhivery, FedEx"
                      className="w-full p-2 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-hidden focus:border-neutral-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                      Tracking Number (AWB)
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. BLUEDART987654321"
                      className="w-full p-2 text-xs rounded-lg border border-neutral-300 bg-white font-mono focus:outline-hidden focus:border-neutral-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                    Internal Fulfillment Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Client requested bespoke monographed dustbag"
                    className="w-full p-2 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-hidden focus:border-neutral-950"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveOrderUpdate}
                    disabled={updatingStatus}
                    className="flex-1 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {updatingStatus ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Database...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Status Changes</span>
                      </>
                    )}
                  </button>
                  {updateSuccess && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Updated!
                    </span>
                  )}
                </div>
              </div>

              {/* Customer & Shipping Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-white rounded-lg border border-neutral-200/80 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Client Profile</p>
                  <p className="font-semibold text-neutral-900">{selectedOrder.customer_name}</p>
                  <p className="text-neutral-600">{selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-neutral-500 font-mono">{selectedOrder.customer_phone}</p>
                  )}
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-neutral-200/80 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Destination</p>
                  {selectedOrder.shipping_address ? (
                    (() => {
                      const addr = selectedOrder.shipping_address as Record<string, string | undefined>;
                      return (
                        <>
                          <p className="text-neutral-800 font-medium">
                            {addr.address_line1 || addr.addressLine1 || ""}
                          </p>
                          <p className="text-neutral-600 font-light">
                            {addr.city}, {addr.state} - {addr.postal_code || addr.postalCode}
                          </p>
                          <p className="text-neutral-500 font-light">
                            {addr.country || "India"}
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-neutral-400 italic">No physical address stored.</p>
                  )}
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Ordered Silhouettes ({selectedOrder.items?.length || 0})
                </p>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden bg-white">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded-md overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                          {it.image_url ? (
                            <Image src={it.image_url} alt={it.product_name} fill className="object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-neutral-400 m-auto" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{it.product_name}</p>
                          <p className="text-[11px] text-neutral-500">
                            Qty: {it.quantity} {it.attributes?.selectedColor ? `• ${it.attributes.selectedColor}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-neutral-900">
                        {formatPrice(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Grand Total</span>
                  <span className="font-mono font-bold text-sm text-neutral-950">
                    {formatPrice(selectedOrder.total_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Payment Status</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedOrder.payment_status || "paid"}
                  </span>
                </div>
              </div>

              {/* Danger Zone: Permanent Deletion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(selectedOrder)}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Order Deletion Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Permanently Delete Order?
                </h3>
                <p className="text-xs font-mono font-bold text-neutral-700 mt-0.5">
                  {orderToDelete.order_number} • {formatPrice(orderToDelete.total_amount)}
                </p>
              </div>
            </div>

            <div className="text-xs text-neutral-600 space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80 leading-relaxed font-light">
              <p>
                This action will <strong className="font-semibold text-rose-700">permanently delete</strong> all records of this order from the database.
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-500">
                <li>Removed completely from client member order history</li>
                <li>Permanently wiped from admin orders list</li>
                <li>Excluded from all sales reports, revenue metrics & analytics</li>
                <li>All purchased line items will be removed</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(orderToDelete.id)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant High-Resolution Invoice Modal */}
      <InvoiceModal
        order={viewingInvoiceOrder}
        onClose={() => setViewingInvoiceOrder(null)}
      />
    </div>
  );
}
