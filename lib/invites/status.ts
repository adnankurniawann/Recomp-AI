import type { Enums } from "@/lib/supabase/types";

export type InviteStatus = Enums<"invite_status_t">;

/** The words and badge tone for each invite status (PRD §5.3, CONTEXT.md "Invite"). */
export const INVITE_STATUS: Record<
  InviteStatus,
  { label: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" }
> = {
  pending: { label: "Menunggu respon", tone: "warning" },
  accepted: { label: "Diterima", tone: "success" },
  declined: { label: "Ditolak", tone: "danger" },
  cancelled: { label: "Dibatalkan", tone: "neutral" },
  expired: { label: "Kedaluwarsa", tone: "neutral" },
};
