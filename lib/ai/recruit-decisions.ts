// The approval of a recruiter run from the leader's answers to its drafts (F-RCR-03, ADR 0004):
// approved once any draft was sent, rejected once every draft was skipped, pending until then.

export type RecruitDecision = "sent" | "skipped";
export type Approval = "pending" | "approved" | "rejected";

export function approvalFor(
  candidateIds: readonly string[],
  decisions: Readonly<Record<string, RecruitDecision>>,
): Approval {
  const values = candidateIds.map((id) => decisions[id]);
  if (values.includes("sent")) return "approved";
  if (values.length > 0 && values.every((v) => v === "skipped")) return "rejected";
  return "pending";
}
