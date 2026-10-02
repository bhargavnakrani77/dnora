"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  Search,
  RefreshCw,
  Minus,
  Plus,
  Check,
  Package,
  Layers,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface StockProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  price: number;
  cost_price?: number | null;
  status: string;
  image_url?: string;
  category_name?: string;
}

interface StockSummary {
  totalSkus: number;
  totalUnits?: number;
  totalCostValue?: number;
  totalRetailValue?: number;
  totalProfitPotential?: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface ProductMarginsStockTableProps {
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export function ProductMarginsStockTable({
  title = "Product Margins, Pricing & Stock Manager",
  subtitle = "Add MRP / Cost Price and Selling Price to track unit margin and total margin across inventory.",
  hideHeader = false,
}: ProductMarginsStockTableProps) {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [summary, setSummary] = useState<StockSummary>({
    totalSkus: 0,
    totalUnits: 0,
    totalCostValue: 0,
    totalRetailValue: 0,
    totalProfitPotential: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [costInputs, setCostInputs] = useState<Record<string, string>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/stock?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const prods: StockProduct[] = json.products || [];
        setProducts(prods);
        if (json.summary) setSummary(json.summary);

        const initialStock: Record<string, number> = {};
        const initialCost: Record<string, string> = {};
        const initialPrice: Record<string, string> = {};

        prods.forEach((p) => {
          initialStock[p.id] = p.stock;
          initialCost[p.id] =
            p.cost_price !== undefined && p.cost_price !== null ? String(p.cost_price) : "";
          initialPrice[p.id] = p.price !== undefined ? String(p.price) : "";
        });

        setStockInputs(initialStock);
        setCostInputs(initialCost);
        setPriceInputs(initialPrice);
      }
    } catch (err) {
      console.error("Failed to fetch product stock:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStock();
  };

  const handleStockInputChange = (productId: string, val: string) => {
    const num = parseInt(val, 10);
    setStockInputs((prev) => ({
      ...prev,
      [productId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleCostInputChange = (productId: string, val: string) => {
    setCostInputs((prev) => ({
      ...prev,
      [productId]: val,
    }));
  };

  const handlePriceInputChange = (productId: string, val: string) => {
    setPriceInputs((prev) => ({
      ...prev,
      [productId]: val,
    }));
  };

  const handleQuickAdjust = (productId: string, diff: number) => {
    setStockInputs((prev) => {
      const current = prev[productId] !== undefined ? prev[productId] : 0;
      return {
        ...prev,
        [productId]: Math.max(0, current + diff),
      };
    });
  };

  const handleSaveStock = async (productId: string) => {
    const newStock = stockInputs[productId];
    if (newStock === undefined) return;

    const rawCost = costInputs[productId];
    const rawPrice = priceInputs[productId];

    try {
      setUpdatingId(productId);
      const res = await fetch("/api/admin/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          newStock,
          costPrice: rawCost !== undefined && rawCost !== "" ? parseFloat(rawCost) : null,
          price: rawPrice !== undefined && rawPrice !== "" ? parseFloat(rawPrice) : undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSavedId(productId);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stock: newStock,
                  cost_price: json.cost_price !== undefined ? json.cost_price : (rawCost ? parseFloat(rawCost) : null),
                  price: json.price !== undefined ? json.price : (rawPrice ? parseFloat(rawPrice) : p.price),
                }
              : p
          )
        );
        setTimeout(() => setSavedId(null), 2000);
      }
    } catch (err) {
      console.error("Failed to save stock:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Bulk save all products together in 1 click
  const handleSaveAll = async () => {
    if (products.length === 0) return;
    try {
      setSavingAll(true);
      const items = products.map((p) => {
        const rawCost = costInputs[p.id];
        const rawPrice = priceInputs[p.id];
        const newStock = stockInputs[p.id] !== undefined ? stockInputs[p.id] : p.stock;
        return {
          productId: p.id,
          newStock,
          costPrice: rawCost !== undefined && rawCost !== "" ? parseFloat(rawCost) : null,
          price: rawPrice !== undefined && rawPrice !== "" ? parseFloat(rawPrice) : p.price,
        };
      });

      const res = await fetch("/api/admin/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        setSaveAllSuccess(true);
        await fetchStock();
        setTimeout(() => setSaveAllSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to bulk save all products:", err);
    } finally {
      setSavingAll(false);
    }
  };

  const overallMarginPercent =
    summary.totalRetailValue && summary.totalRetailValue > 0 && summary.totalProfitPotential
      ? Math.round((summary.totalProfitPotential / summary.totalRetailValue) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Header controls (NO "Add New Product" button) */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200/70">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-heading flex items-center gap-2.5">
              <Boxes className="w-6 h-6 text-neutral-800" />
              <span>{title}</span>
            </h2>
            <p className="text-xs text-neutral-500 font-light mt-0.5">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchStock}
              disabled={loading || savingAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {/* Save All Products button */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll || loading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60 ${
                saveAllSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-900 hover:bg-black text-white"
              }`}
            >
              {savingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving All Products...</span>
                </>
              ) : saveAllSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>All Products Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save All Products</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards: Cost vs Selling & Valuation Tracking */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inventory Investment */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 bg-linear-to-b from-neutral-50/40 to-white shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-neutral-700" />
              <span>Total Inventory Cost</span>
            </p>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
              MRP / Cost
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-950">
            {formatPrice(summary.totalCostValue || 0)}
          </p>
          <p className="text-[11px] text-neutral-500 font-light mt-1">
            Total capital tied in current inventory
          </p>
        </div>

        {/* Card 2: Total Retail Value (Selling Value) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
              <span>Total Retail (Sales Value)</span>
            </p>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
              Selling Price
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900">
            {formatPrice(summary.totalRetailValue || 0)}
          </p>
          <p className="text-[11px] text-neutral-400 font-light mt-1">
            Revenue potential at active customer prices
          </p>
        </div>

        {/* Card 3: Projected Inventory Gross Margin */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 bg-linear-to-b from-emerald-50/40 to-white shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Projected Total Margin</span>
            </p>
            {overallMarginPercent !== null && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                +{overallMarginPercent}% Margin
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-800">
            +{formatPrice(summary.totalProfitPotential || 0)}
          </p>
          <p className="text-[11px] text-emerald-700/80 font-light mt-1">
            Calculated total margin on all available stock
          </p>
        </div>

        {/* Card 4: Inventory Units & Health */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              <span>Stock Status</span>
            </p>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
              {summary.totalSkus} Products
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900">
            {summary.totalUnits ?? 0} <span className="text-sm font-normal text-neutral-500 font-sans">Units</span>
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="text-emerald-700 font-semibold">{summary.inStock} In Stock</span>
            <span className="text-neutral-300">•</span>
            <span className="text-amber-700 font-semibold">{summary.lowStock} Low</span>
            <span className="text-neutral-300">•</span>
            <span className="text-rose-700 font-semibold">{summary.outOfStock} Out</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: `All Products (${summary.totalSkus})` },
            { id: "low-stock", label: `Low Stock (${summary.lowStock})` },
            { id: "in-stock", label: `In Stock (${summary.inStock})` },
            { id: "out-of-stock", label: `Out of Stock (${summary.outOfStock})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === tab.id
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Stock Inventory & Price Tracking Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-7 h-7 text-neutral-900 animate-spin mx-auto mb-2" />
            <p className="text-xs text-neutral-500 font-light">Loading products, pricing and margins...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-semibold text-neutral-900">No Products Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-light">
              No product records match your selected filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Product &amp; SKU</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5">MRP / Cost (₹)</th>
                  <th className="px-3 py-3.5">Selling Price (₹)</th>
                  <th className="px-3 py-3.5">Unit Margin</th>
                  <th className="px-3 py-3.5">Total Margin on Stock</th>
                  <th className="px-3 py-3.5">Units &amp; Status</th>
                  <th className="px-4 py-3.5 text-right">Quick Stock &amp; Price Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => {
                  const currentStock = stockInputs[product.id] ?? product.stock;
                  const currentCostStr = costInputs[product.id] ?? "";
                  const currentPriceStr = priceInputs[product.id] ?? String(product.price);

                  const activeCost = currentCostStr !== "" ? parseFloat(currentCostStr) : null;
                  const activePrice = currentPriceStr !== "" ? parseFloat(currentPriceStr) : product.price;

                  const unitProfit =
                    activeCost !== null && !isNaN(activeCost) && !isNaN(activePrice)
                      ? activePrice - activeCost
                      : null;
                  const unitMargin =
                    unitProfit !== null && activePrice > 0
                      ? Math.round((unitProfit / activePrice) * 100)
                      : null;

                  const totalCostVal = activeCost !== null ? currentStock * activeCost : null;
                  const totalRetailVal = currentStock * activePrice;
                  const totalProfitVal = unitProfit !== null ? currentStock * unitProfit : null;

                  const isLow = product.stock > 0 && product.stock <= 5;
                  const isOut = product.stock === 0;
                  const isUpdating = updatingId === product.id;
                  const isSaved = savedId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* Product Image & Name */}
                      <td className="px-4 py-3.5 max-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-neutral-400 m-auto" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/product/${product.slug}`}
                              target="_blank"
                              className="font-bold text-neutral-900 hover:underline flex items-center gap-1 truncate"
                            >
                              <span className="truncate">{product.name}</span>
                              <ExternalLink className="w-3 h-3 text-neutral-400 opacity-60 shrink-0" />
                            </Link>
                            <p className="text-[10.5px] text-neutral-400 font-mono">
                              SKU: {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3.5 text-neutral-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10.5px] font-medium">
                          {product.category_name || "Handbag"}
                        </span>
                      </td>

                      {/* Cost / MRP Price (Editable Input) */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-700 text-[11px] font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={currentCostStr}
                              onChange={(e) => handleCostInputChange(product.id, e.target.value)}
                              placeholder="Cost ₹"
                              title="MRP / Cost Price"
                              className="w-22 px-2 py-1 rounded-md border border-neutral-300 bg-neutral-50/60 font-mono font-bold text-neutral-900 text-xs focus:bg-white focus:outline-hidden focus:border-black"
                            />
                          </div>
                          <span className="text-[9.5px] text-neutral-400 mt-0.5">MRP / Cost</span>
                        </div>
                      </td>

                      {/* Selling Price (Editable Input) */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-700 text-[11px] font-bold">₹</span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={currentPriceStr}
                              onChange={(e) => handlePriceInputChange(product.id, e.target.value)}
                              placeholder="Selling Price"
                              title="Selling Price to Customer"
                              className="w-22 px-2 py-1 rounded-md border border-neutral-300 bg-white font-mono font-bold text-neutral-900 text-xs focus:outline-hidden focus:border-black"
                            />
                          </div>
                          <span className="text-[9.5px] text-neutral-400 mt-0.5">Selling Price</span>
                        </div>
                      </td>

                      {/* Unit Profit & Margin */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {unitProfit !== null ? (
                          <div className="flex flex-col">
                            <span
                              className={`font-mono font-bold text-xs ${
                                unitProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {unitProfit >= 0
                                ? `+${formatPrice(unitProfit)}`
                                : `-${formatPrice(Math.abs(unitProfit))}`}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                unitProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {unitMargin}% margin
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">No cost set</span>
                        )}
                      </td>

                      {/* Total Margin Valuation in Stock */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col text-[11px] font-mono">
                          <span className="text-neutral-900 font-semibold">
                            Sale: {formatPrice(totalRetailVal)}
                          </span>
                          {totalCostVal !== null && (
                            <span className="text-neutral-600 text-[10.5px]">
                              Cost: {formatPrice(totalCostVal)}
                            </span>
                          )}
                          {totalProfitVal !== null && (
                            <span className="text-emerald-700 font-bold text-[10.5px]">
                              Total Margin: +{formatPrice(totalProfitVal)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Units & Health Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-extrabold text-xs text-neutral-900">
                            {product.stock} units
                          </span>
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>Out of Stock</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>In Stock</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick Stock & Price Adjustment */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Decrement 1 */}
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(product.id, -1)}
                            className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                            title="Decrement -1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct Stock Input */}
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => handleStockInputChange(product.id, e.target.value)}
                            title="Direct Stock Quantity"
                            className="w-14 px-1.5 py-1 rounded-md border border-neutral-300 text-center font-mono font-bold text-xs focus:outline-hidden focus:border-neutral-900"
                          />

                          {/* Increment 1 */}
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(product.id, 1)}
                            className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                            title="Increment +1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Save Single Product */}
                          <button
                            type="button"
                            onClick={() => handleSaveStock(product.id)}
                            disabled={isUpdating}
                            className={`ml-1 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                              isSaved
                                ? "bg-emerald-600 text-white"
                                : "bg-neutral-900 hover:bg-black text-white"
                            }`}
                            title="Save this product"
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : isSaved ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <span>Save</span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer with Bulk Save */}
            <div className="p-4 bg-[#FAF9F6] border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-neutral-500 font-light">
                Showing {products.length} products. Changes made in MRP, Selling Price, and Stock can be saved individually or in batch.
              </span>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={savingAll || loading}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60 ${
                  saveAllSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-900 hover:bg-black text-white"
                }`}
              >
                {savingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving All Products...</span>
                  </>
                ) : saveAllSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>All Products Saved!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save All Products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductMarginsStockTable;
