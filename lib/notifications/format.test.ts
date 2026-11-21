import { describe, expect, it } from "vitest";
import { toNotificationView, unreadBadge, type NotificationRow } from "./format";

const row = (type: string, payload: unknown, read_at: string | null = null): NotificationRow => ({
  id: "n1",
  type,
  payload,
  read_at,
  created_at: "2026-11-21T08:00:00Z",
});

describe("toNotificationView", () => {
  it("says who invited, for which role and team, and leads to /undangan", () => {
    const view = toNotificationView(
      row("invite_received", {
        from_name: "Dinda",
        role_name: "Frontend",
        team_name: "Tim Garuda",
        team_id: "t1",
      }),
    );
    expect(view).toMatchObject({
      type: "invite_received",
      title: "Dinda mengundangmu bergabung",
      body: "sebagai Frontend di Tim Garuda",
      href: "/undangan",
      unread: true,
    });
  });

  it("sends the leader to the team page when an invite is accepted", () => {
    const view = toNotificationView(
      row("invite_accepted", { candidate_name: "Raka", role_name: "Backend", team_id: "t9" }),
    );
    expect(view.title).toBe("Raka menerima undanganmu");
    expect(view.body).toBe("sebagai Backend");
    expect(view.href).toBe("/tim/t9");
  });

  it("sends a declined invite to the sent tab", () => {
    const view = toNotificationView(row("invite_declined", { candidate_name: "Raka" }));
    expect(view.title).toBe("Raka menolak undanganmu");
    expect(view.body).toBeNull();
    expect(view.href).toBe("/undangan?tab=terkirim");
  });

  it("names the mentor of a paid booking", () => {
    const view = toNotificationView(
      row("booking_paid", {
        mentor_name: "Bu Sari",
        service_title: "Review pitch deck",
        mentor_id: "m1",
      }),
    );
    expect(view).toMatchObject({
      title: "Booking dengan Bu Sari berhasil",
      body: "Review pitch deck",
      href: "/mentor/m1",
    });
  });

  it("falls back when the payload is empty or odd", () => {
    expect(toNotificationView(row("invite_received", null)).title).toBe("Ada undangan tim baru");
    expect(toNotificationView(row("invite_accepted", { candidate_name: "  " })).title).toBe(
      "Undanganmu diterima",
    );
    expect(toNotificationView(row("booking_paid", [])).href).toBe("/mentor");
    expect(toNotificationView(row("something_new", {}))).toMatchObject({
      type: "other",
      href: "/lomba",
    });
  });

  it("is read once read_at is set", () => {
    expect(toNotificationView(row("invite_received", {}, "2026-11-21T09:00:00Z")).unread).toBe(
      false,
    );
  });
});

describe("unreadBadge", () => {
  it("hides at zero and caps at 9+", () => {
    expect(unreadBadge(0)).toBeNull();
    expect(unreadBadge(-1)).toBeNull();
    expect(unreadBadge(3)).toBe("3");
    expect(unreadBadge(9)).toBe("9");
    expect(unreadBadge(10)).toBe("9+");
  });
});
