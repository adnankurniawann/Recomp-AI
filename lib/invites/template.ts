import { INVITE_MESSAGE_MAX } from "@/lib/validation/invite";

export interface InviteTemplateInput {
  candidateName: string;
  leaderName: string;
  teamName: string;
  competitionName: string;
  roleName: string;
  /** The top reason from the ranking (PRD §7.4), such as "Menutup semua skill wajib: Figma". */
  topReason?: string | null;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/**
 * The editable starting message of the invite dialog (PRD F-INV-01): "Halo [nama], aku [ketua] dari
 * tim [tim] untuk [lomba]. Kami lagi cari [role] dan profilmu cocok karena [alasan teratas]. Mau
 * gabung?". Without a reason it says the profile fits the role. Never longer than the message limit.
 */
export function inviteTemplate(input: InviteTemplateInput): string {
  const candidate = firstName(input.candidateName) || "kamu";
  const leader = firstName(input.leaderName) || "ketua tim";
  const opening = `Halo ${candidate}, aku ${leader} dari tim ${input.teamName} untuk ${input.competitionName}.`;
  const closing = "Mau gabung?";

  const reason = input.topReason?.trim().replace(/\.$/, "");
  const fit = reason
    ? `karena ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`
    : "dengan role ini";
  const message = `${opening} Kami lagi cari ${input.roleName} dan profilmu cocok ${fit}. ${closing}`;
  if (message.length <= INVITE_MESSAGE_MAX) return message;

  // Long names or reasons: drop the reason first, then cut the rest.
  const short = `${opening} Kami lagi cari ${input.roleName}. ${closing}`;
  return short.length <= INVITE_MESSAGE_MAX ? short : `${short.slice(0, INVITE_MESSAGE_MAX - 1)}…`;
}
