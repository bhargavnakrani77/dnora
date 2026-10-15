import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/data/store";
import {
  AUTH_COOKIE,
  isCallerAuthorized,
  jsonWithCors,
  optionsCorsResponse,
} from "@/lib/auth/sys-auth";

export const dynamic = "force-dynamic";

/**
 * Handle CORS preflight for cross-origin requests from external websites
 */
export async function OPTIONS() {
  return optionsCorsResponse();
}

/**
 * GET: Retrieve current server down / maintenance status
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE);
    const isAuthed = isCallerAuthorized(req, null, authCookie?.value);

    const siteStatus = await store.getSiteStatus();
    const isServerDown = siteStatus.status === "terminated";

    return jsonWithCors({
      success: true,
      authenticated: isAuthed,
      serverDown: isServerDown,
      status: siteStatus.status,
      mode: siteStatus.mode || "503_error",
      message: siteStatus.message || "Storefront status normal",
      updated_at: siteStatus.updated_at || new Date().toISOString(),
      updated_by: siteStatus.updated_by || "system",
    });
  } catch (error: any) {
    return jsonWithCors(
      {
        success: false,
        error: error?.message || "Failed to inspect system status",
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Toggle or explicitly set Server Down ON or OFF
 * Can be called from any external website with API Key or Bearer Token.
 *
 * Supported body payloads:
 * 1) { "serverDown": true }  // Turn Server Down ON (HTTP 503 Maintenance)
 * 2) { "serverDown": false } // Turn Server Down OFF (Bring Online)
 * 3) { "status": "terminated" | "online" }
 * 4) { "action": "down" | "up" | "toggle" }
 * Optional: { "message": "Custom 503 maintenance message" }
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE);
    const body = await req.json().catch(() => ({}));

    // Authorize caller
    const isAuthorized = isCallerAuthorized(req, body, authCookie?.value);
    if (!isAuthorized) {
      return jsonWithCors(
        {
          success: false,
          error:
            "Unauthorized. Please provide a valid API key via 'x-api-key' header, 'Authorization: Bearer <key>', '?apiKey=<key>' query param, or in request body.",
        },
        { status: 401 }
      );
    }

    const currentStatus = await store.getSiteStatus();
    const isCurrentlyDown = currentStatus.status === "terminated";

    let targetStatus: "online" | "terminated";

    if (typeof body.serverDown === "boolean") {
      targetStatus = body.serverDown ? "terminated" : "online";
    } else if (body.status === "terminated" || body.status === "online") {
      targetStatus = body.status;
    } else if (
      body.action === "down" ||
      body.action === "turn_off" ||
      body.action === "stop" ||
      body.action === "maintenance"
    ) {
      targetStatus = "terminated";
    } else if (
      body.action === "up" ||
      body.action === "turn_on" ||
      body.action === "start" ||
      body.action === "online"
    ) {
      targetStatus = "online";
    } else if (body.action === "toggle") {
      targetStatus = isCurrentlyDown ? "online" : "terminated";
    } else {
      // Default to toggling if not specified
      targetStatus = isCurrentlyDown ? "online" : "terminated";
    }

    const mode = body.mode || (targetStatus === "terminated" ? "503_error" : "online");
    const defaultMsg =
      targetStatus === "terminated"
        ? "503 Service Unavailable: Database cluster connection timeout."
        : "Storefront operational and healthy.";
    const message = body.message || defaultMsg;
    const updatedBy = body.updatedBy || "external_api";

    const success = await store.setSiteStatus(targetStatus, mode, message, updatedBy);

    try {
      revalidatePath("/", "layout");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    return jsonWithCors({
      success,
      serverDown: targetStatus === "terminated",
      status: targetStatus,
      mode,
      message,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
      notice:
        targetStatus === "terminated"
          ? "Server is now DOWN. Public visitors will receive HTTP 503."
          : "Server is now ONLINE. Storefront is fully accessible.",
    });
  } catch (error: any) {
    return jsonWithCors(
      {
        success: false,
        error: error?.message || "Failed to toggle server status",
      },
      { status: 500 }
    );
  }
}
