// What a notification says and where it leads (PRD F-NTF-01). Pure, so every type has a test.
// The rows come from SQL functions: send_invite, accept_invite, decline_invite (migration 0004) and
// simulate_booking_payment. Payload fields can be missing, so every text has a fallback.

export type NotificationType =
  "invite_received" | "invite_accepted" | "invite_declined" | "booking_paid";

export interface NotificationRow {
  id: string;
  type: string;
  payload: unknown;
  read_at: string | null;
  created_at: string;
}

export interface NotificationView {
  id: string;
  type: NotificationType | "other";
  title: string;
  body: string | null;
  href: string;
  unread: boolean;
  createdAt: string;
}

function text(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** "sebagai Frontend di Tim Garuda", leaving out what the payload doesn't have. */
function roleInTeam(role: string | null, team: string | null): string | null {
  const parts = [role && `sebagai ${role}`, team && `di ${team}`].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export function toNotificationView(row: NotificationRow): NotificationView {
  const p = row.payload;
  const base = { id: row.id, unread: row.read_at === null, createdAt: row.created_at };
  const teamId = text(p, "team_id");
  const teamHref = teamId ? `/tim/${teamId}` : "/undangan?tab=terkirim";

  switch (row.type) {
    case "invite_received": {
      const from = text(p, "from_name");
      return {
        ...base,
        type: "invite_received",
        title: from ? `${from} mengundangmu bergabung` : "Ada undangan tim baru",
        body: roleInTeam(text(p, "role_name"), text(p, "team_name")),
        href: "/undangan",
      };
    }
    case "invite_accepted": {
      const who = text(p, "candidate_name");
      return {
        ...base,
        type: "invite_accepted",
        title: who ? `${who} menerima undanganmu` : "Undanganmu diterima",
        body: roleInTeam(text(p, "role_name"), text(p, "team_name")),
        href: teamHref,
      };
    }
    case "invite_declined": {
      const who = text(p, "candidate_name");
      return {
        ...base,
        type: "invite_declined",
        title: who ? `${who} menolak undanganmu` : "Undanganmu ditolak",
        body: roleInTeam(text(p, "role_name"), text(p, "team_name")),
        href: "/undangan?tab=terkirim",
      };
    }
    case "booking_paid": {
      const mentor = text(p, "mentor_name");
      const service = text(p, "service_title");
      const mentorId = text(p, "mentor_id");
      return {
        ...base,
        type: "booking_paid",
        title: mentor ? `Booking dengan ${mentor} berhasil` : "Booking mentor berhasil",
        body: service,
        href: mentorId ? `/mentor/${mentorId}` : "/mentor",
      };
    }
    default:
      return {
        ...base,
        type: "other",
        title: "Ada kabar baru untukmu",
        body: null,
        href: "/lomba",
      };
  }
}

/** The badge text: nothing at 0, "9+" from 10 on, so the pill stays one size. */
export function unreadBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}
