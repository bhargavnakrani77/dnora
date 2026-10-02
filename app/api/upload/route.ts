import { NextRequest, NextResponse } from "next/server";
import { POST as mediaUploadPost } from "@/app/api/media/upload/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return mediaUploadPost(req);
}
