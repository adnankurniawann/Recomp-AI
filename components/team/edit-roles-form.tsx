"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveRoles } from "@/app/(app)/tim/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ERROR_MESSAGES, issuesToFields } from "@/lib/action-result";
import type { RoleSuggestion } from "@/lib/ai/skill-map";
import type { CompCategory } from "@/lib/constants";
import type { SkillOption } from "@/lib/profile/form";
import { saveRolesSchema, totalSlots } from "@/lib/validation/team";
import { RoleEditor, type EditorRole } from "./role-editor";

interface EditRolesFormProps {
  teamId: string;
  initialRoles: EditorRole[];
  templates: RoleSuggestion[];
  skills: SkillOption[];
  category: CompCategory;
  teamMax: number;
}

/** The role editor for an existing team, with a confirmation when filled roles change. */
export function EditRolesForm({
  teamId,
  initialRoles,
  templates,
  skills,
  category,
  teamMax,
}: EditRolesFormProps) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  const blocker =
    roles.length === 0
      ? "Tim butuh minimal 1 role"
      : totalSlots(roles) > teamMax
        ? `Total slot melebihi batas tim lomba (maks. ${teamMax})`
        : null;

  // Roles that already have members and were changed: the leader confirms before saving.
  const changedFilled = initialRoles
    .filter((before) => (before.memberCount ?? 0) > 0)
    .filter((before) => {
      const after = roles.find((r) => r.id === before.id);
      return after && JSON.stringify(after) !== JSON.stringify(before);
    })
    .map((r) => roles.find((x) => x.id === r.id)!.name);

  function save(confirmed: boolean) {
    const parsed = saveRolesSchema.safeParse({ teamId, roles });
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      toast.error(ERROR_MESSAGES.VALIDATION);
      return;
    }
    if (!confirmed && changedFilled.length > 0) return setConfirming(changedFilled);

    setConfirming(null);
    startTransition(async () => {
      const res = await saveRoles(teamId, roles);
      if (!res.ok) {
        setErrors(res.error.fields ?? {});
        toast.error(res.error.message);
        return;
      }
      toast.success("Role tim sudah disimpan.");
      router.push(`/tim/${teamId}`);
    });
  }

  return (
    <Card padding="lg" className="flex flex-col gap-6 max-sm:px-4">
      <RoleEditor
        roles={roles}
        onChange={(next) => {
          setRoles(next);
          setConfirming(null);
        }}
        skills={skills}
        templates={templates}
        category={category}
        teamMax={teamMax}
        errors={errors}
      />

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        {blocker && (
          <p role="status" className="text-sm text-warning-ink">
            {blocker}
          </p>
        )}
        {confirming && (
          <div role="alert" className="flex flex-col gap-3 rounded-md bg-wash px-4 py-3">
            <p className="text-sm text-ink">
              Role {confirming.join(", ")} sudah punya anggota. Simpan perubahan ini?
            </p>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => save(true)} disabled={pending}>
                Ya, simpan
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(null)}>
                Batal
              </Button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <Link href={`/tim/${teamId}`} className={buttonClasses("secondary", "lg")}>
            Kembali
          </Link>
          {!confirming && (
            <Button
              variant="primary"
              size="lg"
              disabled={!!blocker || pending}
              aria-busy={pending}
              onClick={() => save(false)}
            >
              {pending ? "Menyimpan…" : "Simpan role"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
