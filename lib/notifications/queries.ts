import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { toNotificationView, type NotificationView } from "./format";

export interface NotificationFeed {
  /** The 10 newest, for the bell dropdown (F-NTF-01). */
  items: NotificationView[];
  unreadCount: number;
  /** Invites waiting for the student's answer: the count next to "Undangan" in the sidebar. */
  pendingInvites: number;
}

const EMPTY: NotificationFeed = { items: [], unreadCount: 0, pendingInvites: 0 };

/**
 * The signed-in student's notifications, read under their session (RLS: owner only). A failed read
 * only empties the bell, so the page around it still loads.
 */
export const loadNotificationFeed = cache(
  async function loadNotificationFeed(): Promise<NotificationFeed | null> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: me } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!me) return EMPTY;

    const [list, unread, invites] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, type, payload, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null),
      supabase
        .from("invites")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", me.id)
        .eq("direction", "invite")
        .eq("status", "pending"),
    ]);
    for (const r of [list, unread, invites]) {
      if (r.error) console.error("[notifications]", r.error.message);
    }

    return {
      items: (list.data ?? []).map(toNotificationView),
      unreadCount: unread.count ?? 0,
      pendingInvites: invites.count ?? 0,
    };
  },
);
