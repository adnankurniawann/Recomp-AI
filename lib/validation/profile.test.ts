import { describe, expect, it } from "vitest";
import {
  contactPrefsSchema,
  historyItemSchema,
  identitySchema,
  onboardingStepInput,
  portfolioItemSchema,
  rolesSkillsSchema,
} from "./profile";

const identity = {
  fullName: "Dinda Putri",
  username: "dinda_p",
  campus: "Institut Contoh",
  major: "DKV",
  entryYear: 2024,
  bio: "",
};

const skills = [
  { skillId: 12, level: 3, evidenceUrl: "https://behance.net/dinda" },
  { skillId: 13, level: 2 },
  { skillId: 14, level: 2, evidenceUrl: "" },
];

const contact = {
  whatsapp: "0812-3456-7890",
  contactEmail: "",
  hoursPerWeek: 6,
  goal: "win",
  workTime: "night",
  openToInvite: true,
};

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe("identitySchema", () => {
  it("accepts a valid step 1 and turns an empty bio into null", () => {
    expect(identitySchema.parse(identity).bio).toBeNull();
  });

  it("lowercases the username", () => {
    expect(identitySchema.parse({ ...identity, username: "Dinda_P" }).username).toBe("dinda_p");
  });

  it.each(["ab", "a".repeat(21), "dinda putri", "dinda-p", "dinda.p"])(
    "rejects the username %s",
    (username) => {
      expect(identitySchema.safeParse({ ...identity, username }).success).toBe(false);
    },
  );

  it("requires campus and major", () => {
    expect(identitySchema.safeParse({ ...identity, campus: " " }).success).toBe(false);
    expect(identitySchema.safeParse({ ...identity, major: "" }).success).toBe(false);
  });

  it("allows a bio of exactly 280 characters and rejects 281", () => {
    expect(identitySchema.safeParse({ ...identity, bio: "a".repeat(280) }).success).toBe(true);
    expect(identitySchema.safeParse({ ...identity, bio: "a".repeat(281) }).success).toBe(false);
  });

  it("keeps the entry year between 2015 and 2035", () => {
    expect(identitySchema.safeParse({ ...identity, entryYear: 2014 }).success).toBe(false);
    expect(identitySchema.safeParse({ ...identity, entryYear: 2036 }).success).toBe(false);
  });
});

describe("rolesSkillsSchema", () => {
  it("accepts 1 to 3 roles and at least 3 skills", () => {
    const parsed = rolesSkillsSchema.parse({ preferredRoles: ["uiux", "product"], skills });
    expect(parsed.skills[1]?.evidenceUrl).toBeNull();
  });

  it("asks for at least one role", () => {
    const result = rolesSkillsSchema.safeParse({ preferredRoles: [], skills });
    expect(firstMessage(result)).toBe("Pilih minimal 1 role yang kamu minati");
  });

  it("rejects more than 3 roles", () => {
    const preferredRoles = ["backend", "frontend", "uiux", "data"];
    expect(rolesSkillsSchema.safeParse({ preferredRoles, skills }).success).toBe(false);
  });

  it("rejects a role outside the list", () => {
    expect(rolesSkillsSchema.safeParse({ preferredRoles: ["other"], skills }).success).toBe(false);
  });

  it("asks for at least 3 skills", () => {
    const result = rolesSkillsSchema.safeParse({
      preferredRoles: ["uiux"],
      skills: skills.slice(0, 2),
    });
    expect(firstMessage(result)).toBe("Pilih minimal 3 skill");
  });

  it("rejects the same skill twice", () => {
    const dup = [...skills, { skillId: 12, level: 1 }];
    expect(rolesSkillsSchema.safeParse({ preferredRoles: ["uiux"], skills: dup }).success).toBe(
      false,
    );
  });

  it("rejects levels outside 1 to 4 and http evidence", () => {
    const bad = [{ ...skills[0]!, level: 5 }, ...skills.slice(1)];
    expect(rolesSkillsSchema.safeParse({ preferredRoles: ["uiux"], skills: bad }).success).toBe(
      false,
    );
    const http = [{ ...skills[0]!, evidenceUrl: "http://a.id" }, ...skills.slice(1)];
    expect(rolesSkillsSchema.safeParse({ preferredRoles: ["uiux"], skills: http }).success).toBe(
      false,
    );
  });
});

describe("historyItemSchema and portfolioItemSchema", () => {
  const history = {
    competitionName: "Hackathon Kampus",
    year: 2025,
    category: "hackathon",
    role: "UI/UX Designer",
    result: "finalist",
    evidenceUrl: "",
    note: "",
  };

  it("accepts a history item and nulls empty optionals", () => {
    const parsed = historyItemSchema.parse(history);
    expect(parsed.evidenceUrl).toBeNull();
    expect(parsed.note).toBeNull();
  });

  it("rejects a result outside the enum and a note over 200 characters", () => {
    expect(historyItemSchema.safeParse({ ...history, result: "winner" }).success).toBe(false);
    expect(historyItemSchema.safeParse({ ...history, note: "a".repeat(201) }).success).toBe(false);
  });

  it("requires an https portfolio link and caps the description at 300", () => {
    const item = { title: "Redesign app", url: "https://figma.com/file/1", description: "" };
    expect(portfolioItemSchema.parse(item).skillIds).toEqual([]);
    expect(portfolioItemSchema.safeParse({ ...item, url: "http://figma.com" }).success).toBe(false);
    expect(portfolioItemSchema.safeParse({ ...item, description: "a".repeat(301) }).success).toBe(
      false,
    );
  });
});

describe("contactPrefsSchema", () => {
  it("normalises WhatsApp to +62 and turns an empty email into null", () => {
    const parsed = contactPrefsSchema.parse(contact);
    expect(parsed.whatsapp).toBe("+6281234567890");
    expect(parsed.contactEmail).toBeNull();
  });

  it("rejects a number that isn't Indonesian", () => {
    const result = contactPrefsSchema.safeParse({ ...contact, whatsapp: "+6512345678" });
    expect(firstMessage(result)).toBe("Nomor WhatsApp harus diawali +62 atau 08");
  });

  it("rejects a malformed email", () => {
    expect(contactPrefsSchema.safeParse({ ...contact, contactEmail: "dinda@" }).success).toBe(
      false,
    );
  });

  it("keeps hours between 0 and 40", () => {
    expect(contactPrefsSchema.safeParse({ ...contact, hoursPerWeek: 0 }).success).toBe(true);
    expect(contactPrefsSchema.safeParse({ ...contact, hoursPerWeek: 41 }).success).toBe(false);
    expect(contactPrefsSchema.safeParse({ ...contact, hoursPerWeek: -1 }).success).toBe(false);
  });
});

describe("onboardingStepInput", () => {
  it("picks the schema by step", () => {
    expect(onboardingStepInput.safeParse({ step: 1, data: identity }).success).toBe(true);
    expect(onboardingStepInput.safeParse({ step: 4, data: contact }).success).toBe(true);
    expect(onboardingStepInput.safeParse({ step: 2, data: identity }).success).toBe(false);
    expect(onboardingStepInput.safeParse({ step: 5, data: identity }).success).toBe(false);
  });
});
