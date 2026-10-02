"use client";

import React from "react";
import { ProductMarginsStockTable } from "@/components/admin/ProductMarginsStockTable";

export default function StockManagementPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ProductMarginsStockTable
        title="Product Stock, MRP & Selling Price Manager"
        subtitle="Real-time tracking of MRP, cost price, selling price, unit margins, and inventory valuation."
      />
    </div>
  );
}
