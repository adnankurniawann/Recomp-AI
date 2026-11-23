import { describe, expect, it } from "vitest";
import type { GenerateJson } from "./guidebook";
import { checkDraft, runRecruiterAgent, templateDraft, type RecruitCandidate } from "./recruiter";

const team = {
  teamName: "Ombak",
  competitionName: "Hackathon Kota Pintar 2026",
  roleName: "UI/UX Designer",
  leaderFirstName: "Raka",
};

const dinda: RecruitCandidate = {
  candidateId: "c-dinda",
  fullName: "Dinda Putri",
  firstName: "Dinda",
  score: 92,
  matchedSkills: ["Figma", "User Research"],
  reasons: [
    "Menutup semua skill wajib: Figma, User Research",
    "Figma level Mahir, ada bukti portofolio",
  ],
};
const arif: RecruitCandidate = {
  ...dinda,
  candidateId: "c-arif",
  fullName: "Arif Hidayat",
  firstName: "Arif",
  score: 70,
  matchedSkills: ["Figma"],
  reasons: [
    "Menutup 1 dari 2 skill wajib: Figma",
    "6 jam per minggu, 2 jam di bawah kebutuhan role",
  ],
};

const skills = ["Figma", "User Research", "React", "Python", "Public Speaking"];

const good = (name: string) =>
  `Halo ${name}, aku Raka dari Tim Ombak untuk Hackathon Kota Pintar 2026. Kami lagi cari UI/UX Designer dan kamu sudah pegang Figma dengan bukti portofolio. Mau gabung bareng kami?`;

function fakeLlm(answer: string | Error) {
  const calls: Parameters<GenerateJson>[0][] = [];
  const generate: GenerateJson = async (req) => {
    calls.push(req);
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { generate, calls };
}

describe("checkDraft", () => {
  it("accepts a draft that only uses the given facts and swaps em dashes for commas", () => {
    const msg = good("Dinda").replace("Kami lagi", "— kami lagi");
    const r = checkDraft(msg, team, dinda, skills);
    expect(r).not.toBeNull();
    expect(r).not.toContain("—");
  });

  it("rejects numbers that aren't in the facts", () => {
    const msg = `${good("Dinda")} Kamu pernah juara 3 kali.`;
    expect(checkDraft(msg, team, dinda, skills)).toBeNull();
    // 2026 is in the competition name, so it may stay.
    expect(checkDraft(good("Dinda"), team, dinda, skills)).not.toBeNull();
  });

  it("rejects a skill the candidate wasn't given", () => {
    const msg = good("Arif").replace("Figma", "Figma dan React");
    expect(checkDraft(msg, team, arif, skills)).toBeNull();
    expect(checkDraft(good("Arif"), team, arif, skills)).not.toBeNull();
  });

  it("rejects drafts under 80 or over 500 characters", () => {
    expect(checkDraft("Halo Dinda, mau gabung?", team, dinda, skills)).toBeNull();
    expect(checkDraft(good("Dinda") + " Ayo".repeat(120), team, dinda, skills)).toBeNull();
  });
});

describe("runRecruiterAgent", () => {
  it("uses the LLM drafts and sends only the allowed facts", async () => {
    const llm = fakeLlm(
      JSON.stringify([
        { candidateId: "c-dinda", message: good("Dinda") },
        { candidateId: "c-arif", message: good("Arif") },
      ]),
    );
    const r = await runRecruiterAgent({
      team,
      candidates: [dinda, arif],
      allSkillNames: skills,
      generate: llm.generate,
    });
    expect(r.error).toBeNull();
    expect(r.drafts.map((d) => [d.candidateId, d.aiDrafted, d.score])).toEqual([
      ["c-dinda", true, 92],
      ["c-arif", true, 70],
    ]);
    const sent = llm.calls[0]!.turns[0]!.text;
    expect(sent).toContain('"firstName":"Dinda"');
    expect(sent).not.toContain("Putri"); // first name only
    expect(sent).not.toContain("92"); // no score
  });

  it("falls back to the template per draft that fails the check or is missing", async () => {
    const llm = fakeLlm(
      JSON.stringify([{ candidateId: "c-dinda", message: `${good("Dinda")} Juara 1 nasional!` }]),
    );
    const r = await runRecruiterAgent({
      team,
      candidates: [dinda, arif],
      allSkillNames: skills,
      generate: llm.generate,
    });
    expect(r.drafts.every((d) => !d.aiDrafted)).toBe(true);
    expect(r.drafts[0]!.message).toBe(templateDraft(team, dinda).message);
    expect(r.drafts[1]!.message).toContain("Halo Arif");
  });

  it("uses templates without calling anything when AI is off, and when the call fails", async () => {
    const off = await runRecruiterAgent({
      team,
      candidates: [dinda],
      allSkillNames: skills,
      generate: null,
    });
    expect(off).toEqual({ drafts: [templateDraft(team, dinda)], error: null });
    expect(off.drafts[0]!.message).toContain("menutup semua skill wajib: Figma, User Research");

    const failed = await runRecruiterAgent({
      team,
      candidates: [dinda],
      allSkillNames: skills,
      generate: fakeLlm(new Error("503")).generate,
    });
    expect(failed.drafts[0]!.aiDrafted).toBe(false);
    expect(failed.error).toBe("LLM call failed");
  });

  it("falls back on output that isn't the JSON array", async () => {
    const r = await runRecruiterAgent({
      team,
      candidates: [dinda],
      allSkillNames: skills,
      generate: fakeLlm('{"drafts": []}').generate,
    });
    expect(r).toEqual({ drafts: [templateDraft(team, dinda)], error: "invalid JSON" });
  });
});
