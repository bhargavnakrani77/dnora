"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Coins,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  Layers,
  BarChart3,
  CreditCard,
  Eye,
  AlertCircle,
} from "lucide-react";
import { SalesReportData, SalesOrder } from "@/lib/data/salesReport";

interface ExecutiveDashboardProps {
  initialData?: SalesReportData | null;
}

export function ExecutiveDashboard({ initialData }: ExecutiveDashboardProps) {
  const [data, setData] = useState<SalesReportData | null>(initialData || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("30d");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");

  // Live real-time fetch function
  const fetchLiveData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/sales-report");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          setLastSynced(
            new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      }
    } catch (err) {
      console.error("Dashboard live fetch error:", err);
    } finally {
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Sync on mount if initialData not provided
  useEffect(() => {
    if (!initialData) {
      fetchLiveData(false);
    } else {
      setLastSynced(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
  }, [initialData, fetchLiveData]);

  // Currency Formatter
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // KPIs
  const kpis = data?.kpis || {
    totalOrders: 0,
    pursesSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    ordersGrowth: 0,
    revenueGrowth: 0,
    pursesGrowth: 0,
    profitGrowth: 0,
  };

  const recentOrders = useMemo(() => data?.recentOrders || [], [data]);

  // Pipeline order status breakdown
  const orderStats = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let shipped = 0;
    let delivered = 0;
    let cancelled = 0;

    recentOrders.forEach((o) => {
      const s = o.status?.toLowerCase();
      if (s === "pending") pending++;
      else if (s === "confirmed") confirmed++;
      else if (s === "shipped") shipped++;
      else if (s === "delivered") delivered++;
      else if (s === "cancelled") cancelled++;
    });

    const activeCount = pending + confirmed + shipped;
    return { pending, confirmed, shipped, delivered, cancelled, activeCount };
  }, [recentOrders]);

  // Average Order Value
  const aov = useMemo(() => {
    if (!kpis.totalOrders || kpis.totalOrders === 0) return 0;
    return Math.round(kpis.totalRevenue / kpis.totalOrders);
  }, [kpis.totalRevenue, kpis.totalOrders]);

  // Filtered daily overview based on 7d or 30d
  const chartData = useMemo(() => {
    const raw = data?.dailyOverview || [];
    if (timeRange === "7d") {
      return raw.slice(-7);
    }
    return raw;
  }, [data?.dailyOverview, timeRange]);

  // Chart Peak and Average
  const chartStats = useMemo(() => {
    if (!chartData || chartData.length === 0) return { max: 0, avg: 0, total: 0 };
    const values = chartData.map((d) => (chartMetric === "revenue" ? d.revenue : d.orders));
    const max = Math.max(...values, 1);
    const total = values.reduce((sum, v) => sum + v, 0);
    const avg = Math.round(total / chartData.length);
    return { max, avg, total };
  }, [chartData, chartMetric]);

  // Filtered recent orders for the live table
  const displayedOrders = useMemo(() => {
    return recentOrders.filter((order) => {
      const matchesStatus =
        orderStatusFilter === "all" ||
        order.status?.toLowerCase() === orderStatusFilter.toLowerCase();

      const q = orderSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.orderId?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.purseName?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [recentOrders, orderStatusFilter, orderSearchQuery]);

  // SVG Spline Path Generator
  const svgConfig = useMemo(() => {
    const width = 800;
    const height = 240;
    const paddingX = 20;
    const paddingY = 30;

    if (!chartData || chartData.length < 2) {
      return { path: "", areaPath: "", points: [], width, height };
    }

    const maxVal = Math.max(chartStats.max * 1.15, 10);
    const stepX = (width - paddingX * 2) / (chartData.length - 1);

    const points = chartData.map((d, i) => {
      const val = chartMetric === "revenue" ? d.revenue : d.orders;
      const x = paddingX + i * stepX;
      const y = height - paddingY - (val / maxVal) * (height - paddingY * 2);
      return { x, y, val, day: d.day, raw: d };
    });

    // Spline curve generator
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const areaPath = `${path} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;

    return { path, areaPath, points, width, height, paddingY };
  }, [chartData, chartMetric, chartStats.max]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Header / Luxury Greeting Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
              Live Boutique Command Centre
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-heading">
            Executive Overview
          </h1>
          <p className="text-xs text-neutral-500 font-light max-w-xl">
            Real-time storefront checkout velocity, fulfillment dispatch queue, and revenue trajectory.
          </p>
        </div>

        {/* Action Controls & Sync Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Last synced badge */}
          {lastSynced && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-mono border border-neutral-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live: {lastSynced}</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLiveData(true)}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh live metrics from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-black" : ""}`} />
            <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          {/* Deep Sales Report Link */}
          <Link
            href="/admin/sales-report"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer active:scale-95"
          >
            <BarChart3 className="w-3.5 h-3.5 text-neutral-300" />
            <span>Full Sales Report</span>
            <ArrowUpRight className="w-3 h-3 text-neutral-400" />
          </Link>
        </div>
      </div>

      {/* 4 Luxury KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Sales Revenue */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs transition hover:border-neutral-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Gross Sales
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-mono">
              {formatINR(kpis.totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  kpis.revenueGrowth >= 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {kpis.revenueGrowth >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(kpis.revenueGrowth)}% MoM
              </span>
              <span className="text-[11px] text-neutral-400">vs last month</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/30 to-amber-500" />
        </div>

        {/* KPI 2: Total Orders */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs transition hover:border-neutral-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Orders Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-mono">
              {kpis.totalOrders}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  kpis.ordersGrowth >= 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {kpis.ordersGrowth >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(kpis.ordersGrowth)}%
              </span>
              <span className="text-[11px] text-neutral-400">Total volume</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/30 to-purple-500" />
        </div>

        {/* KPI 3: Fulfillment Queue (Actionable) */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs transition hover:border-neutral-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Dispatch Queue
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-mono flex items-baseline gap-2">
              <span>{orderStats.activeCount}</span>
              <span className="text-xs font-normal text-neutral-500">active orders</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px]">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold">
                <Clock className="w-3 h-3" /> {orderStats.pending} pending
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                <Truck className="w-3 h-3" /> {orderStats.shipped} in-transit
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/30 to-blue-500" />
        </div>

        {/* KPI 4: Average Order Value (AOV) */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs transition hover:border-neutral-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Average Order Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-mono">
              {formatINR(aov)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.5 rounded-md">
                Luxury Basket
              </span>
              <span className="text-[11px] text-neutral-400">
                {kpis.pursesSold} items total sold
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/30 to-emerald-500" />
        </div>
      </div>

      {/* CORE SECTION: The Interactive Graph + Orders Status Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Luxury Spline Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Graph Header & Switchers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Storefront Growth Trajectory
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-500">
                  {chartMetric === "revenue"
                    ? "Daily sales volume across 30 days"
                    : "Daily count of customer orders placed"}
                </p>
              </div>

              {/* Metric & Time Range Switcher */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Metric Mode */}
                <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setChartMetric("revenue")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      chartMetric === "revenue"
                        ? "bg-white text-black shadow-2xs font-bold"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric("orders")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      chartMetric === "orders"
                        ? "bg-white text-black shadow-2xs font-bold"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    Orders
                  </button>
                </div>

                {/* Time range */}
                <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setTimeRange("7d")}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      timeRange === "7d"
                        ? "bg-white text-black shadow-2xs font-bold"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    7D
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange("30d")}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      timeRange === "30d"
                        ? "bg-white text-black shadow-2xs font-bold"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    30D
                  </button>
                </div>
              </div>
            </div>

            {/* Quick summary strip above chart */}
            <div className="flex items-center gap-4 pt-3 pb-1 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total in Period:</span>
                <span className="font-mono font-bold text-neutral-900 ml-1.5">
                  {chartMetric === "revenue" ? formatINR(chartStats.total) : `${chartStats.total} Orders`}
                </span>
              </div>
              <div className="h-3 w-px bg-neutral-200" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Peak Day:</span>
                <span className="font-mono font-bold text-purple-700 ml-1.5">
                  {chartMetric === "revenue" ? formatINR(chartStats.max) : `${chartStats.max} Orders`}
                </span>
              </div>
              <div className="h-3 w-px bg-neutral-200 hidden sm:block" />
              <div className="hidden sm:block">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Daily Avg:</span>
                <span className="font-mono font-bold text-neutral-900 ml-1.5">
                  {chartMetric === "revenue" ? formatINR(chartStats.avg) : `${chartStats.avg} / day`}
                </span>
              </div>
            </div>

            {/* SVG Interactive Chart Canvas */}
            <div className="relative w-full pt-4 select-none">
              <svg
                viewBox={`0 0 ${svgConfig.width} ${svgConfig.height}`}
                className="w-full h-48 sm:h-56 overflow-visible"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.32" />
                    <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.04" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Gridlines */}
                {[0.25, 0.5, 0.75].map((pct, idx) => (
                  <line
                    key={idx}
                    x1="20"
                    y1={svgConfig.height * pct}
                    x2={svgConfig.width - 20}
                    y2={svgConfig.height * pct}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* Base Bottom Baseline */}
                <line
                  x1="20"
                  y1={svgConfig.height - 30}
                  x2={svgConfig.width - 20}
                  y2={svgConfig.height - 30}
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                />

                {/* Gradient Filled Area */}
                {svgConfig.areaPath && (
                  <path d={svgConfig.areaPath} fill="url(#areaGradient)" />
                )}

                {/* Spline Curve Stroke */}
                {svgConfig.path && (
                  <path
                    d={svgConfig.path}
                    fill="none"
                    stroke="url(#strokeGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points and Hover Crosshair */}
                {svgConfig.points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  return (
                    <g key={idx}>
                      {/* Active vertical crosshair */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={10}
                          x2={pt.x}
                          y2={svgConfig.height - 30}
                          stroke="#8B5CF6"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Interactive Circle Node */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : idx % 3 === 0 || chartData.length <= 10 ? 3.5 : 2}
                        className="transition-all duration-150 cursor-pointer"
                        fill={isHovered ? "#8B5CF6" : "#FFFFFF"}
                        stroke="#8B5CF6"
                        strokeWidth={isHovered ? 3 : 2}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />

                      {/* Transparent Hover Hitbox */}
                      <rect
                        x={pt.x - 12}
                        y={0}
                        width={24}
                        height={svgConfig.height}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic Floating Tooltip */}
              {hoveredIndex !== null && svgConfig.points[hoveredIndex] && (
                <div
                  className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-xl bg-neutral-950/95 backdrop-blur-md text-white text-xs border border-white/20 shadow-xl space-y-0.5"
                  style={{
                    left: `${(svgConfig.points[hoveredIndex].x / svgConfig.width) * 100}%`,
                    top: `${(svgConfig.points[hoveredIndex].y / svgConfig.height) * 100}%`,
                  }}
                >
                  <p className="text-[10px] text-neutral-400 font-medium">
                    {svgConfig.points[hoveredIndex].day}
                  </p>
                  <p className="font-mono font-bold text-white text-xs">
                    {chartMetric === "revenue"
                      ? formatINR(svgConfig.points[hoveredIndex].raw.revenue)
                      : `${svgConfig.points[hoveredIndex].raw.orders} Orders`}
                  </p>
                  <p className="text-[9px] text-neutral-400 font-mono">
                    {chartMetric === "revenue"
                      ? `${svgConfig.points[hoveredIndex].raw.orders} Orders placed`
                      : formatINR(svgConfig.points[hoveredIndex].raw.revenue)}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Dates Axis */}
            <div className="flex justify-between items-center px-4 pt-1 text-[10px] font-mono text-neutral-400">
              {chartData
                .filter((_, idx) => idx === 0 || idx === Math.floor(chartData.length / 2) || idx === chartData.length - 1)
                .map((d, i) => (
                  <span key={i}>{d.day}</span>
                ))}
            </div>
          </div>
        </div>

        {/* Pipeline & Delivery Health (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-neutral-700" />
                  <span>Fulfillment Pipeline</span>
                </h3>
                <p className="text-[11px] text-neutral-500">Live order statuses</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs text-purple-700 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pipeline Status Breakdown Cards */}
            <div className="space-y-2.5 pt-3">
              {/* Delivered */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">Delivered Successfully</span>
                </div>
                <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {orderStats.delivered}
                </span>
              </div>

              {/* In Transit / Shipped */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-950">Dispatched & In-Transit</span>
                </div>
                <span className="font-mono font-bold text-xs text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  {orderStats.shipped}
                </span>
              </div>

              {/* Pending Action */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-950">Pending Processing</span>
                </div>
                <span className="font-mono font-bold text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {orderStats.pending}
                </span>
              </div>

              {/* Cancelled */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-600">Cancelled / Refunded</span>
                </div>
                <span className="font-mono text-xs text-neutral-500 bg-neutral-200/60 px-2 py-0.5 rounded">
                  {orderStats.cancelled}
                </span>
              </div>
            </div>
          </div>

          {/* Best Seller Highlight Card */}
          {data?.bestSeller && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white space-y-2.5 border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5C378]">
                  👑 Top Boutique Silhouette
                </span>
                <span className="text-[10px] font-mono text-neutral-400">SKU: {data.bestSeller.sku}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-white/10">
                  <Image
                    src={data.bestSeller.imageUrl}
                    alt={data.bestSeller.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{data.bestSeller.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300 font-mono">
                    <span>{data.bestSeller.soldPcs} pcs sold</span>
                    <span>•</span>
                    <span className="text-[#E5C378] font-bold">{formatINR(data.bestSeller.revenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIVE ORDERS COMMAND TABLE (The core Orders focus requested) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Table Header & Quick Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Recent Client Orders
              </h2>
              <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md border border-neutral-200">
                {displayedOrders.length} orders
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Live orders placed by boutique customers. Click any order to open fulfillment.
            </p>
          </div>

          {/* Quick Search & Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search orders or client..."
                className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-black font-medium w-48 sm:w-56"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200 text-xs">
              {[
                { label: "All", val: "all" },
                { label: "Pending", val: "pending" },
                { label: "Shipped", val: "shipped" },
                { label: "Delivered", val: "delivered" },
              ].map((tab) => (
                <button
                  key={tab.val}
                  type="button"
                  onClick={() => setOrderStatusFilter(tab.val)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    orderStatusFilter === tab.val
                      ? "bg-white text-black shadow-2xs font-bold"
                      : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Link
              href="/admin/orders"
              className="text-xs font-bold text-neutral-700 hover:text-black px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition flex items-center gap-1 shrink-0"
            >
              <span>Manage All</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </Link>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {displayedOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto text-neutral-300" />
              <p className="text-xs font-semibold text-neutral-600">No matching orders found</p>
              <p className="text-[11px] text-neutral-400">
                {orderSearchQuery ? "Try a different search term" : "New customer orders will appear here automatically."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Handbag / Silhouette</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayedOrders.map((order) => {
                  const statusKey = order.status?.toLowerCase();
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700">
                      {order.status}
                    </span>
                  );

                  if (statusKey === "delivered") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                      </span>
                    );
                  } else if (statusKey === "shipped") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                        <Truck className="w-3 h-3" /> Shipped
                      </span>
                    );
                  } else if (statusKey === "pending") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    );
                  } else if (statusKey === "confirmed") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    );
                  } else if (statusKey === "cancelled") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3 h-3" /> Cancelled
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-50/80 transition-colors group cursor-pointer"
                    >
                      {/* Order Number */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/admin/orders?search=${encodeURIComponent(order.orderId)}`}
                          className="font-mono font-bold text-neutral-900 group-hover:text-purple-700 flex items-center gap-1"
                        >
                          <span>{order.orderId}</span>
                        </Link>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-900 truncate max-w-[150px]">
                          {order.customerName}
                        </div>
                        {order.customerPhone && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {order.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {order.imageUrl && (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                              <Image
                                src={order.imageUrl}
                                alt={order.purseName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-800 truncate max-w-[180px]">
                              {order.purseName}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono">Qty: {order.quantity}</p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                        {formatINR(order.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">{statusBadge}</td>

                      {/* Date */}
                      <td className="py-3 px-3 text-[11px] text-neutral-500 whitespace-nowrap">
                        {order.orderDate}
                      </td>

                      {/* Action Link */}
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/orders?search=${encodeURIComponent(order.orderId)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-black hover:text-white transition shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Administrative Quick Shortcuts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/orders"
          className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-black transition shadow-2xs group flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white transition text-neutral-800 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">All Orders</h4>
            <p className="text-[10px] text-neutral-400">Dispatch & courier</p>
          </div>
        </Link>

        <Link
          href="/admin/products/new"
          className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-black transition shadow-2xs group flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white transition text-neutral-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">Add Product</h4>
            <p className="text-[10px] text-neutral-400">New collection item</p>
          </div>
        </Link>

        <Link
          href="/admin/stock"
          className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-black transition shadow-2xs group flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white transition text-neutral-800 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">Stock Levels</h4>
            <p className="text-[10px] text-neutral-400">Inventory alerts</p>
          </div>
        </Link>

        <Link
          href="/admin/sales-report"
          className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-black transition shadow-2xs group flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white transition text-neutral-800 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">Sales Report</h4>
            <p className="text-[10px] text-neutral-400">Export PDF & Excel</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
