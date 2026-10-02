import { db } from "@/lib/db";

// Global in-memory cache to guarantee ultra-fast responses and resilient fallback
interface VisitorEntry {
  visitorId: string;
  path: string;
  lastSeen: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __dnora_active_visitors__: Map<string, VisitorEntry> | undefined;
}

const memoryStore = globalThis.__dnora_active_visitors__ ?? new Map<string, VisitorEntry>();
if (!globalThis.__dnora_active_visitors__) {
  globalThis.__dnora_active_visitors__ = memoryStore;
}

// TTL Window: A visitor is considered live if heartbeat received in last 2.5 minutes (150s)
const VISITOR_TIMEOUT_MS = 150 * 1000;

export async function recordVisitorHeartbeat(
  visitorId: string,
  path = "/",
  userAgent?: string,
  ipAddress?: string
): Promise<number> {
  const now = Date.now();

  // 1. Update in-memory store
  memoryStore.set(visitorId, {
    visitorId,
    path,
    lastSeen: now,
  });

  // 2. Prune old in-memory records
  for (const [id, entry] of memoryStore.entries()) {
    if (now - entry.lastSeen > VISITOR_TIMEOUT_MS) {
      memoryStore.delete(id);
    }
  }

  // 3. Persist to PostgreSQL asynchronously without blocking
  try {
    await db.query(
      `INSERT INTO public.active_visitors (visitor_id, path, user_agent, ip_address, last_seen)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (visitor_id) DO UPDATE
       SET path = EXCLUDED.path,
           user_agent = EXCLUDED.user_agent,
           ip_address = EXCLUDED.ip_address,
           last_seen = NOW()`,
      [visitorId, path, userAgent?.slice(0, 500) || null, ipAddress?.slice(0, 100) || null]
    );
  } catch (err) {
    console.error("DB error recording active visitor heartbeat:", err);
  }

  return memoryStore.size;
}

export async function removeVisitor(visitorId: string): Promise<void> {
  memoryStore.delete(visitorId);
  try {
    await db.query(`DELETE FROM public.active_visitors WHERE visitor_id = $1`, [visitorId]);
  } catch (err) {
    console.error("DB error removing active visitor:", err);
  }
}

export async function getActiveVisitorCount(): Promise<number> {
  const now = Date.now();

  // 1. Clean in-memory
  for (const [id, entry] of memoryStore.entries()) {
    if (now - entry.lastSeen > VISITOR_TIMEOUT_MS) {
      memoryStore.delete(id);
    }
  }

  // 2. Query DB with safety prune
  try {
    // Delete stale visitors older than 180 seconds (3 minutes)
    await db.query(`DELETE FROM public.active_visitors WHERE last_seen < NOW() - INTERVAL '180 seconds'`);
    
    // Count live visitors seen in last 150 seconds (2.5 minutes)
    const res = await db.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count 
       FROM public.active_visitors 
       WHERE last_seen >= NOW() - INTERVAL '150 seconds'`
    );

    const dbCount = res.rows[0]?.count ?? 0;
    // Return max of DB and memory to prevent false zeroes
    return Math.max(dbCount, memoryStore.size);
  } catch (err) {
    console.error("DB error counting active visitors, using memory fallback:", err);
    return memoryStore.size;
  }
}
