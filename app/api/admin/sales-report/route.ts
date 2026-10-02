import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { getSalesReportData } from "@/lib/data/salesReport";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getSalesReportData();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error generating sales report data:", error);
    return NextResponse.json(
      { error: "Failed to generate sales report analytics" },
      { status: 500 }
    );
  }
}
