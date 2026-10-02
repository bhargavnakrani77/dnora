import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { verifyAdminSession } from "@/lib/auth/session";
import { HomepageSection } from "@/types";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sections = await store.getHomepageSections();
    return NextResponse.json({ success: true, sections });
  } catch (error: unknown) {
    console.error("Error fetching homepage sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch homepage sections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // If an array of sections is passed (full save / reorder)
    if (Array.isArray(body.sections)) {
      const saved = await store.saveHomepageSections(body.sections);
      revalidatePath("/");
      return NextResponse.json({ success: true, sections: saved });
    }

    // If a single new or updated section is passed
    if (body.section && typeof body.section === "object") {
      const current = await store.getHomepageSections();
      const section: HomepageSection = body.section;

      const existingIndex = current.findIndex((s) => s.id === section.id);
      let updated: HomepageSection[];

      if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], ...section };
      } else {
        const newSec: HomepageSection = {
          ...section,
          id: section.id || `sec-${Date.now()}`,
          sort_order: section.sort_order ?? current.length + 1,
          is_active: section.is_active ?? true,
        };
        updated = [...current, newSec];
      }

      const saved = await store.saveHomepageSections(updated);
      revalidatePath("/");
      return NextResponse.json({ success: true, sections: saved });
    }

    return NextResponse.json(
      { success: false, error: "Invalid payload. Provide sections array or section object." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Error updating homepage sections:", error);
    const msg = error instanceof Error ? error.message : "Failed to save sections";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Section ID is required" }, { status: 400 });
    }

    const current = await store.getHomepageSections();
    const filtered = current.filter((s) => s.id !== id);
    const saved = await store.saveHomepageSections(filtered);

    revalidatePath("/");
    return NextResponse.json({ success: true, sections: saved });
  } catch (error: unknown) {
    console.error("Error deleting homepage section:", error);
    return NextResponse.json({ success: false, error: "Failed to delete section" }, { status: 500 });
  }
}
