"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { assignMemberRole } from "@/app/(app)/tim/actions";
import { Select } from "@/components/ui/input";

interface MemberRoleSelectProps {
  teamId: string;
  member: { profileId: string; fullName: string };
  currentRoleId: string;
  roles: { id: string; name: string; full: boolean }[];
}

/** The leader moves a member to another role from the member list (F-TEM-03, `assignMemberRole`). */
export function MemberRoleSelect({ teamId, member, currentRoleId, roles }: MemberRoleSelectProps) {
  const [pending, startTransition] = useTransition();

  function move(roleId: string) {
    startTransition(async () => {
      const res = await assignMemberRole(teamId, member.profileId, roleId);
      if (!res.ok) return void toast.error(res.error.message);
      toast.success(`${member.fullName} dipindah ke ${roles.find((r) => r.id === roleId)?.name}.`);
    });
  }

  return (
    <Select
      aria-label={`Role ${member.fullName}`}
      value={currentRoleId}
      disabled={pending}
      aria-busy={pending}
      onChange={(e) => move(e.target.value)}
      className="w-full"
    >
      {roles.map((r) => (
        <option key={r.id} value={r.id} disabled={r.full && r.id !== currentRoleId}>
          {r.name}
          {r.full && r.id !== currentRoleId ? " (penuh)" : ""}
        </option>
      ))}
    </Select>
  );
}
