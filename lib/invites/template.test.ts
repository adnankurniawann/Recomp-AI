import { describe, expect, it } from "vitest";
import { INVITE_MESSAGE_MAX } from "@/lib/validation/invite";
import { inviteTemplate, teamPhrase } from "./template";

const base = {
  candidateName: "Dinda Putri",
  leaderName: "Rani Ayu",
  teamName: "Ombak",
  competitionName: "Hackathon Kampus 2026",
  roleName: "UI/UX Designer",
};

describe("inviteTemplate", () => {
  it("fills the PRD F-INV-01 template with first names and the top reason", () => {
    expect(
      inviteTemplate({ ...base, topReason: "Menutup semua skill wajib: Figma, User Research" }),
    ).toBe(
      "Halo Dinda, aku Rani dari Tim Ombak untuk Hackathon Kampus 2026. Kami lagi cari UI/UX Designer " +
        "dan profilmu cocok karena menutup semua skill wajib: Figma, User Research. Mau gabung?",
    );
  });

  it("says the profile fits the role when there is no reason", () => {
    expect(inviteTemplate({ ...base, topReason: null })).toContain(
      "Kami lagi cari UI/UX Designer dan profilmu cocok dengan role ini. Mau gabung?",
    );
  });

  it("drops a trailing full stop from the reason", () => {
    expect(
      inviteTemplate({ ...base, topReason: "Memang berminat jadi UI/UX Designer." }),
    ).toContain("karena memang berminat jadi UI/UX Designer. Mau gabung?");
  });

  it("never goes over the message limit", () => {
    const long = inviteTemplate({ ...base, topReason: "x".repeat(600) });
    expect(long.length).toBeLessThanOrEqual(INVITE_MESSAGE_MAX);
    expect(long).not.toContain("karena");

    const huge = inviteTemplate({ ...base, teamName: "T".repeat(600) });
    expect(huge.length).toBe(INVITE_MESSAGE_MAX);
  });
});

describe("teamPhrase", () => {
  it.each([
    ["Ombak", "Tim Ombak"],
    ["Tim Ombak", "Tim Ombak"],
    ["tim ombak", "tim ombak"],
    ["  Timnas Muda ", "Tim Timnas Muda"],
    ["TIM 7", "TIM 7"],
  ])("%s → %s", (name, expected) => {
    expect(teamPhrase(name)).toBe(expected);
  });
});
