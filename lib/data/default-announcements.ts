// DEPRECATED & OBSOLETE:
// All announcements and configurations are 100% database-driven in Supabase PostgreSQL
// tables: `public.announcements` and `public.announcements_config`.
// Do not import or store data in this file.

import { AnnouncementConfig, AnnouncementItem } from "@/types";

export const DEFAULT_ANNOUNCEMENT_ITEMS: AnnouncementItem[] = [];

export const DEFAULT_ANNOUNCEMENT_CONFIG: AnnouncementConfig = {
  id: "default",
  interval_seconds: 4,
  is_active: true,
  items: [],
};
