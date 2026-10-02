import React from "react";
import { ExecutiveDashboard } from "@/components/admin/ExecutiveDashboard";
import { getSalesReportData } from "@/lib/data/salesReport";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Overview | DNORA Lifestyle",
  description: "Live real-time boutique metrics, order dispatch pipeline, and revenue trajectory",
};

export default async function AdminDashboardPage() {
  let initialData = null;
  try {
    initialData = await getSalesReportData();
  } catch (err) {
    console.error("Failed to fetch initial dashboard data on server:", err);
  }

  return <ExecutiveDashboard initialData={initialData} />;
}
