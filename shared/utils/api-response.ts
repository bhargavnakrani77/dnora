import { NextResponse } from "next/server";

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: Record<string, unknown>;
}

export const apiResponse = {
  success<T>(data: T, status = 200, meta?: Record<string, unknown>): NextResponse<ApiResponsePayload<T>> {
    const payload: ApiResponsePayload<T> = { success: true, data };
    if (meta) payload.meta = meta;
    return NextResponse.json(payload, { status });
  },

  error(message: string, status = 400, details?: unknown): NextResponse<ApiResponsePayload> {
    const payload: ApiResponsePayload = { success: false, error: message };
    if (details) payload.details = details;
    return NextResponse.json(payload, { status });
  },

  unauthorized(message = "Unauthorized access"): NextResponse<ApiResponsePayload> {
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  },

  forbidden(message = "Forbidden access"): NextResponse<ApiResponsePayload> {
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  },

  notFound(message = "Resource not found"): NextResponse<ApiResponsePayload> {
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  },

  serverError(message = "An unexpected server error occurred"): NextResponse<ApiResponsePayload> {
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  },
};
