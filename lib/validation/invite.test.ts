import { describe, expect, it } from "vitest";
import { cancelInviteSchema, respondInviteSchema, sendInviteSchema } from "./invite";

const id = "3f0b6a52-4c1e-4d7a-9b8e-2a1c5d6e7f80";

describe("sendInviteSchema", () => {
  const invite = { teamRoleId: id, candidateId: id, message: "Halo Dinda, mau gabung?" };

  it("accepts an invite and defaults aiDrafted to false", () => {
    expect(sendInviteSchema.parse(invite).aiDrafted).toBe(false);
  });

  it("allows 500 characters and rejects 501", () => {
    expect(sendInviteSchema.safeParse({ ...invite, message: "a".repeat(500) }).success).toBe(true);
    expect(sendInviteSchema.safeParse({ ...invite, message: "a".repeat(501) }).success).toBe(false);
  });

  it("rejects an empty message", () => {
    expect(sendInviteSchema.safeParse({ ...invite, message: "   " }).success).toBe(false);
  });
});

describe("respondInviteSchema and cancelInviteSchema", () => {
  it("accepts accept and decline only", () => {
    expect(respondInviteSchema.safeParse({ inviteId: id, action: "accept" }).success).toBe(true);
    expect(respondInviteSchema.safeParse({ inviteId: id, action: "decline" }).success).toBe(true);
    expect(respondInviteSchema.safeParse({ inviteId: id, action: "cancel" }).success).toBe(false);
  });

  it("requires a uuid", () => {
    expect(cancelInviteSchema.safeParse({ inviteId: "1" }).success).toBe(false);
  });
});
