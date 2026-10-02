"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  ShoppingBag,
  Coins,
  Calendar,
  ChevronDown,
  Eye,
  Crown,
  CalendarDays,
  LineChart,
  Wallet,
  X,
  ExternalLink,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Boxes,
} from "lucide-react";
import { ExcelIcon, PdfIcon } from "./AdminPurseIcons";
import { SalesOrder, SalesReportData } from "@/lib/data/salesReport";
import { ProductMarginsStockTable } from "./ProductMarginsStockTable";

interface SalesReportDashboardProps {
  initialData?: SalesReportData | null;
}

export function SalesReportDashboard({ initialData }: SalesReportDashboardProps) {
  // Dynamic current month date range string
  const getCurrentMonthRange = () => {
    const now = new Date();
    const monthName = now.toLocaleString("en-IN", { month: "short" });
    const year = now.getFullYear();
    const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    return `01 ${monthName} ${year} - ${daysInMonth} ${monthName} ${year}`;
  };

  const [dateRange, setDateRange] = useState(getCurrentMonthRange);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");
  const [activeView, setActiveView] = useState<"margins" | "analytics">("margins");

  // 100% REAL state initialized strictly from initialData or zero defaults
  const [kpis, setKpis] = useState({
    totalOrders: initialData?.kpis?.totalOrders ?? 0,
    pursesSold: initialData?.kpis?.pursesSold ?? 0,
    totalRevenue: initialData?.kpis?.totalRevenue ?? 0,
    totalProfit: initialData?.kpis?.totalProfit ?? 0,
    ordersGrowth: initialData?.kpis?.ordersGrowth ?? 0,
    revenueGrowth: initialData?.kpis?.revenueGrowth ?? 0,
    pursesGrowth: initialData?.kpis?.pursesGrowth ?? 0,
    profitGrowth: initialData?.kpis?.profitGrowth ?? 0,
  });

  const [dailyData, setDailyData] = useState<{ day: string; revenue: number; orders: number }[]>(
    initialData?.dailyOverview ?? []
  );

  const [categories, setCategories] = useState<{ name: string; percentage: number; count: number; color: string }[]>(
    initialData?.categorySales ?? []
  );

  const [bestSellerProduct, setBestSellerProduct] = useState<{
    name: string;
    sku: string;
    soldPcs: number;
    revenue: number;
    imageUrl: string;
  } | null>(initialData?.bestSeller ?? null);

  const [summaryData, setSummaryData] = useState({
    today: initialData?.salesSummary?.today ?? 0,
    weekly: initialData?.salesSummary?.weekly ?? 0,
    monthly: initialData?.salesSummary?.monthly ?? 0,
    allTime: initialData?.salesSummary?.allTime ?? 0,
  });

  const [recentOrders, setRecentOrders] = useState<SalesOrder[]>(
    initialData?.recentOrders ?? []
  );

  // Live real-time fetch function
  const fetchLiveReport = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/sales-report");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d: SalesReportData = json.data;
          setKpis(d.kpis);
          setDailyData(d.dailyOverview || []);
          setCategories(d.categorySales || []);
          setBestSellerProduct(d.bestSeller || null);
          setSummaryData(d.salesSummary);
          setRecentOrders(d.recentOrders || []);
          setLastSyncedTime(
            new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      }
    } catch (err) {
      console.error("Live sales report sync error:", err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  // Initial load and sync
  useEffect(() => {
    // If no initial data passed, fetch immediately
    if (!initialData) {
      fetchLiveReport();
    } else {
      setLastSyncedTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
  }, [initialData, fetchLiveReport]);

  // Format currency in Indian standard ₹
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Helper for growth indicator
  const renderGrowthBadge = (growthPercent: number) => {
    if (growthPercent > 0) {
      return (
        <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
          <ArrowUpRight className="w-3.5 h-3.5" /> {growthPercent}%
        </span>
      );
    }
    if (growthPercent < 0) {
      return (
        <span className="text-rose-600 font-semibold flex items-center gap-0.5">
          <ArrowDownRight className="w-3.5 h-3.5" /> {Math.abs(growthPercent)}%
        </span>
      );
    }
    return (
      <span className="text-neutral-400 font-medium flex items-center gap-0.5">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  };

  // Export to Excel / CSV with REAL data
  const handleExportExcel = () => {
    if (recentOrders.length === 0) {
      alert("No sales orders available to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Purse Name",
      "Quantity",
      "Amount (INR)",
      "Order Date",
      "Status",
    ];

    const rows = recentOrders.map((o) => [
      o.orderId,
      `"${o.customerName}"`,
      `"${o.customerEmail || ""}"`,
      `"${o.customerPhone || ""}"`,
      `"${o.purseName}"`,
      o.quantity,
      o.amount,
      `"${o.orderDate}"`,
      o.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `DNORA_Real_Sales_Report_${dateRange.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF / Print Dialog
  const handleExportPdf = () => {
    window.print();
  };

  // Donut chart calculations
  const totalCategoryPurses =
    categories.reduce((sum, c) => sum + c.count, 0) || kpis.pursesSold;
  const donutSlices = categories.reduce<
    (typeof categories[number] & { startPercent: number; endPercent: number })[]
  >((acc, cat) => {
    const startPercent = acc.length > 0 ? acc[acc.length - 1].endPercent : 0;
    const endPercent = startPercent + cat.percentage;
    acc.push({ ...cat, startPercent, endPercent });
    return acc;
  }, []);

  // SVG dimensions for Sales Overview Chart
  const svgWidth = 620;
  const svgHeight = 240;
  const padLeft = 45;
  const padRight = 35;
  const padTop = 20;
  const padBottom = 30;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxRevenue = Math.max(1000, ...dailyData.map((d) => d.revenue || 0));
  const maxOrders = Math.max(5, ...dailyData.map((d) => d.orders || 0));
  const nPoints = Math.max(1, dailyData.length);
  const barWidth = Math.max(4, Math.floor(chartW / nPoints) - 3);

  // Generate smooth line points for Orders
  const orderPoints = dailyData.map((d, i) => {
    const x = padLeft + (i + 0.5) * (chartW / nPoints);
    const y = padTop + chartH - ((d.orders || 0) / maxOrders) * chartH;
    return { x, y, ...d };
  });

  const linePathD = orderPoints.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + curr.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }, "");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-bold text-neutral-900 tracking-tight font-heading">
              Sales Report
            </h1>

            {/* Live Realtime Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Real-time</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5 flex items-center gap-2">
            <span>Track your sales performance and revenue growth</span>
            {lastSyncedTime && (
              <span className="text-neutral-400 font-mono text-[11px]">
                (Synced at {lastSyncedTime})
              </span>
            )}
          </p>
        </div>

        {/* Date Selector + PDF & Excel Exports + Manual Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLiveReport(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh Real-time Sales Data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-neutral-500 ${
                isRefreshing ? "animate-spin text-neutral-900" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Date Range Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-neutral-200 rounded-xl shadow-lg p-1.5 z-40 space-y-1 text-xs font-medium">
                {[
                  getCurrentMonthRange(),
                  "Last 7 Days",
                  "Last 30 Days",
                  "All Time",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setDateRange(preset);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      dateRange === preset
                        ? "bg-rose-50 text-rose-700 font-semibold"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111827] hover:bg-black text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            title="Download or Print PDF Report"
          >
            <PdfIcon className="w-3.5 h-3.5 text-white" />
            <span>Export PDF</span>
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Download CSV / Excel Spreadsheet"
          >
            <ExcelIcon className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-neutral-100/90 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView("margins")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeView === "margins"
                ? "bg-neutral-900 text-white shadow-xs"
                : "bg-white text-neutral-700 hover:text-neutral-950 border border-neutral-200/80"
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Product Margins &amp; Stock Manager</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeView === "margins"
                  ? "bg-white/20 text-white"
                  : "bg-neutral-200 text-neutral-800"
              }`}
            >
              All Products
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("analytics")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeView === "analytics"
                ? "bg-neutral-900 text-white shadow-xs"
                : "bg-white text-neutral-700 hover:text-neutral-950 border border-neutral-200/80"
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>Revenue Analytics &amp; Orders</span>
          </button>
        </div>

        <span className="text-[11px] text-neutral-500 font-medium px-2">
          {activeView === "margins"
            ? "Enter MRP / Cost & Selling Price to track total margin, and save all products at once."
            : "Review monthly sales performance, category distribution & order logs."}
        </span>
      </div>

      {activeView === "margins" ? (
        <ProductMarginsStockTable hideHeader={true} />
      ) : (
        <>
          {/* 4 Metric / KPI Cards Row (100% REAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/70 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Orders</p>
              <h3 className="text-2xl sm:text-[26px] font-bold text-neutral-900 tracking-tight leading-tight">
                {kpis.totalOrders}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {renderGrowthBadge(kpis.ordersGrowth)}
            <span className="text-neutral-400 font-light">vs. last month</span>
          </div>
        </div>

        {/* Card 2: Purses Sold */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/70 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Purses Sold</p>
              <h3 className="text-2xl sm:text-[26px] font-bold text-neutral-900 tracking-tight leading-tight">
                {kpis.pursesSold}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {renderGrowthBadge(kpis.pursesGrowth)}
            <span className="text-neutral-400 font-light">vs. last month</span>
          </div>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/70 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-lg">
              ₹
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Revenue</p>
              <h3 className="text-2xl sm:text-[26px] font-bold text-neutral-900 tracking-tight leading-tight">
                {formatINR(kpis.totalRevenue)}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {renderGrowthBadge(kpis.revenueGrowth)}
            <span className="text-neutral-400 font-light">vs. last month</span>
          </div>
        </div>

        {/* Card 4: Total Profit */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/70 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Profit</p>
              <h3 className="text-2xl sm:text-[26px] font-bold text-neutral-900 tracking-tight leading-tight">
                {formatINR(kpis.totalProfit)}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {renderGrowthBadge(kpis.profitGrowth)}
            <span className="text-neutral-400 font-light">vs. last month</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Row (Sales Overview + Category Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Sales Overview (Composite Bar + Line Chart) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/70 shadow-2xs flex flex-col justify-between relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Sales Overview
            </h2>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2D3748]" />
                <span className="font-medium">Revenue (₹)</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
                <span className="font-medium">Orders</span>
              </div>
            </div>
          </div>

          {/* Dual Axis Responsive Chart Container */}
          <div className="relative w-full overflow-x-auto select-none pt-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 min-w-[500px]"
            >
              {/* Horizontal Gridlines & Left/Right Axis Labels */}
              {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => {
                const y = padTop + (idx / 4) * chartH;
                const leftVal = Math.round(maxRevenue * ratio);
                const rightVal = Math.round(maxOrders * ratio);

                return (
                  <g key={idx}>
                    {/* Left label (Revenue) */}
                    <text
                      x={padLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94A3B8"
                      fontFamily="sans-serif"
                    >
                      {leftVal.toLocaleString()}
                    </text>

                    {/* Horizontal faint line */}
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />

                    {/* Right label (Orders) */}
                    <text
                      x={svgWidth - padRight + 8}
                      y={y + 3.5}
                      textAnchor="start"
                      fontSize="9"
                      fill="#94A3B8"
                      fontFamily="sans-serif"
                    >
                      {rightVal}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Bars for Daily Revenue */}
              {dailyData.map((d, i) => {
                const x = padLeft + (i + 0.5) * (chartW / nPoints) - barWidth / 2;
                const barHeight = ((d.revenue || 0) / maxRevenue) * chartH;
                const y = padTop + chartH - barHeight;
                const isHovered = hoveredPoint === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(1, barHeight)}
                      rx="2"
                      fill={isHovered ? "#1E293B" : "#2D3748"}
                      className="transition-colors duration-150"
                    />
                  </g>
                );
              })}

              {/* Pink Line for Orders Volume */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Pink Nodes / Points for Orders */}
              {orderPoints.map((pt, i) => {
                const isHovered = hoveredPoint === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#FFFFFF"
                      stroke="#F43F5E"
                      strokeWidth={isHovered ? "2.5" : "2"}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* X-Axis Month Day Labels */}
              {dailyData
                .filter(
                  (_, idx) =>
                    idx % Math.max(1, Math.floor(dailyData.length / 7)) === 0 ||
                    idx === dailyData.length - 1
                )
                .map((d, idx) => {
                  const dataIdx = dailyData.indexOf(d);
                  const x = padLeft + (dataIdx + 0.5) * (chartW / nPoints);

                  return (
                    <text
                      key={`${d.day}-${idx}`}
                      x={x}
                      y={svgHeight - 8}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="#64748B"
                      fontFamily="sans-serif"
                    >
                      {d.day}
                    </text>
                  );
                })}
            </svg>

            {/* Interactive Floating Hover Tooltip */}
            {hoveredPoint !== null && dailyData[hoveredPoint] && (
              <div
                className="absolute z-20 pointer-events-none bg-neutral-900 text-white rounded-lg px-2.5 py-1.5 shadow-xl text-[11px] transform -translate-x-1/2 -translate-y-full transition-transform"
                style={{
                  left: `${
                    (padLeft + (hoveredPoint + 0.5) * (chartW / nPoints)) *
                    (100 / svgWidth)
                  }%`,
                  top: "28%",
                }}
              >
                <p className="font-bold text-neutral-200">
                  {dailyData[hoveredPoint].day}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white font-mono">
                    ₹{dailyData[hoveredPoint].revenue.toLocaleString("en-IN")}
                  </span>
                  <span className="text-rose-400 font-semibold">
                    {dailyData[hoveredPoint].orders} orders
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Sales by Purse Category (Donut Chart) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/70 shadow-2xs flex flex-col justify-between">
          <h2 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight mb-4">
            Sales by Purse Category
          </h2>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-neutral-400 text-xs">
              <ShoppingBag className="w-10 h-10 text-neutral-200 mb-2 stroke-1" />
              <p className="font-semibold text-neutral-600">No category sales yet</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Categories will populate automatically as clients place orders.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-5 my-auto">
              {/* Donut Gauge */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full -rotate-90 transform"
                >
                  {donutSlices.map((slice, idx) => {
                    const strokeDasharray = `${slice.percentage * 2.512} 251.2`;
                    const strokeDashoffset = `-${slice.startPercent * 2.512}`;
                    const isHovered = hoveredCategory === slice.name;

                    return (
                      <circle
                        key={`${slice.name}-${idx}`}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? "15" : "12"}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        onMouseEnter={() => setHoveredCategory(slice.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className="transition-all duration-200 cursor-pointer"
                      />
                    );
                  })}
                </svg>

                {/* Center Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  <span className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                    {totalCategoryPurses}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    Purses Sold
                  </span>
                </div>
              </div>

              {/* Category Breakdown Legend */}
              <div className="space-y-2 text-xs w-full max-w-[170px]">
                {categories.map((cat, idx) => {
                  const isHovered = hoveredCategory === cat.name;

                  return (
                    <div
                      key={`${cat.name}-${idx}`}
                      onMouseEnter={() => setHoveredCategory(cat.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`flex items-center justify-between py-0.5 px-1.5 rounded-md transition-colors cursor-pointer ${
                        isHovered
                          ? "bg-neutral-100 font-semibold"
                          : "text-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <span className="font-mono text-neutral-500 shrink-0 text-[11px] ml-1">
                        {cat.percentage}%{" "}
                        <span className="text-neutral-400">({cat.count})</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Best Selling Purse + Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Card: Best Selling Purse */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Best Selling Purse
            </h2>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Best Seller</span>
            </div>
          </div>

          {bestSellerProduct ? (
            <div className="flex items-center gap-5">
              {/* Bag Image in clean rounded frame */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-neutral-50 border border-neutral-200/80 overflow-hidden shrink-0 shadow-2xs">
                <Image
                  src={bestSellerProduct.imageUrl}
                  alt={bestSellerProduct.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              {/* Bag Details */}
              <div className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
                  {bestSellerProduct.name}
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  SKU:{" "}
                  <span className="text-neutral-700 font-semibold">
                    {bestSellerProduct.sku}
                  </span>
                </p>
                <p className="text-xs text-neutral-600">
                  Sold:{" "}
                  <span className="font-bold text-neutral-900">
                    {bestSellerProduct.soldPcs} pcs
                  </span>
                </p>
                <p className="text-xs text-neutral-600">
                  Revenue:{" "}
                  <span className="font-bold text-neutral-900 font-mono">
                    {formatINR(bestSellerProduct.revenue)}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-neutral-400 text-xs">
              No top seller recorded yet. Products will rank as sales are placed.
            </div>
          )}
        </div>

        {/* Right Card: Sales Summary (100% REAL) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/70 shadow-2xs flex flex-col justify-between">
          <h2 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight mb-4">
            Sales Summary
          </h2>

          <div className="divide-y divide-neutral-100 text-xs">
            {/* Today's Sales */}
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-neutral-600">
                <CalendarDays className="w-4 h-4 text-neutral-400" />
                <span>Today&apos;s Sales</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-neutral-900 font-mono text-sm">
                  {formatINR(summaryData.today)}
                </span>
                {summaryData.today > 0 ? (
                  <span className="text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-neutral-400 text-[11px] font-mono">
                    ₹0
                  </span>
                )}
              </div>
            </div>

            {/* Weekly Sales */}
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-neutral-600">
                <LineChart className="w-4 h-4 text-neutral-400" />
                <span>Weekly Sales (Last 7 Days)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-neutral-900 font-mono text-sm">
                  {formatINR(summaryData.weekly)}
                </span>
              </div>
            </div>

            {/* Monthly Sales */}
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-neutral-600">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>Monthly Sales</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-neutral-900 font-mono text-sm">
                  {formatINR(summaryData.monthly)}
                </span>
              </div>
            </div>

            {/* Total Sales (All Time) */}
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-neutral-600">
                <Wallet className="w-4 h-4 text-neutral-400" />
                <span>Total Sales (All Time)</span>
              </div>
              <span className="font-bold text-neutral-900 font-mono text-sm">
                {formatINR(summaryData.allTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Sales Orders Table (100% REAL) */}
      <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-2xs overflow-hidden">
        {/* Table Header */}
        <div className="p-5 sm:px-6 flex items-center justify-between border-b border-neutral-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Recent Sales Orders
            </h2>
            <p className="text-xs text-neutral-500 font-normal mt-0.5">
              Live updates directly from customer purchases
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="px-3.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-black hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            View All Orders
          </Link>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] border-b border-neutral-100 text-neutral-500 font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Purse Name</th>
                <th className="px-5 py-3.5 text-center">Quantity</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Order Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-neutral-400 text-xs"
                  >
                    <ShoppingBag className="w-8 h-8 text-neutral-200 mx-auto mb-2 stroke-1" />
                    <p className="font-semibold text-neutral-600">
                      No sales orders placed yet
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      New orders placed by clients on the storefront will appear
                      here in real time.
                    </p>
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const getStatusPill = (status: SalesOrder["status"]) => {
                    switch (status) {
                      case "Delivered":
                        return "bg-emerald-50 text-emerald-700 border-emerald-200";
                      case "Shipped":
                        return "bg-blue-50 text-blue-700 border-blue-200";
                      case "Confirmed":
                        return "bg-amber-50 text-amber-700 border-amber-200";
                      case "Pending":
                        return "bg-rose-50 text-rose-700 border-rose-200";
                      default:
                        return "bg-neutral-100 text-neutral-700 border-neutral-200";
                    }
                  };

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="px-5 py-3.5 font-mono font-semibold text-neutral-900">
                        {order.orderId}
                      </td>

                      {/* Customer Name */}
                      <td className="px-5 py-3.5 font-medium text-neutral-800">
                        {order.customerName}
                      </td>

                      {/* Purse Name */}
                      <td className="px-5 py-3.5 text-neutral-700">
                        {order.purseName}
                      </td>

                      {/* Quantity */}
                      <td className="px-5 py-3.5 text-center font-mono font-semibold text-neutral-700">
                        {order.quantity}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 font-mono font-bold text-neutral-900">
                        ₹{order.amount.toLocaleString("en-IN")}
                      </td>

                      {/* Order Date */}
                      <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">
                        {order.orderDate}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusPill(
                            order.status
                          )}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{order.status}</span>
                        </span>
                      </td>

                      {/* Action Eye Icon */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                          title="View Order Details"
                          aria-label="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Interactive Quick View Modal for Selected Order */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-mono">
                  {selectedOrder.orderId}
                </h3>
                <p className="text-xs text-neutral-500">
                  {selectedOrder.orderDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                  <Image
                    src={
                      selectedOrder.imageUrl ||
                      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80"
                    }
                    alt={selectedOrder.purseName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">
                    {selectedOrder.purseName}
                  </h4>
                  <p className="text-neutral-500">
                    Qty: {selectedOrder.quantity} item(s)
                  </p>
                  <p className="font-mono font-bold text-neutral-900 mt-0.5">
                    ₹{selectedOrder.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <p className="font-bold text-neutral-900 text-[11px] uppercase tracking-wider">
                  Customer Information
                </p>
                <p className="text-neutral-800 font-semibold">
                  {selectedOrder.customerName}
                </p>
                {selectedOrder.customerEmail && (
                  <p className="text-neutral-600">
                    {selectedOrder.customerEmail}
                  </p>
                )}
                {selectedOrder.customerPhone && (
                  <p className="text-neutral-500 font-mono">
                    {selectedOrder.customerPhone}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-neutral-600">
                  Fulfillment Status
                </span>
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                    selectedOrder.status === "Delivered"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedOrder.status === "Shipped"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-100 bg-[#FAF9F6] flex justify-end gap-2">
              <Link
                href="/admin/orders"
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Full Orders Manager</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesReportDashboard;
