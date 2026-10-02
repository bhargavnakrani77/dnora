import React from "react";
import { SalesReportDashboard } from "@/components/admin/SalesReportDashboard";
import { getSalesReportData } from "@/lib/data/salesReport";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sales Report & Revenue Analytics | DNORA Lifestyle",
  description: "Live real-time sales performance, revenue analytics, and customer orders report",
};

export default async function AdminSalesReportPage() {
  let initialData = null;
  try {
    initialData = await getSalesReportData();
  } catch (err) {
    console.error("Failed to fetch initial sales report on server:", err);
  }

  return <SalesReportDashboard initialData={initialData} />;
}
