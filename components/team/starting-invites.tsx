"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { findStudent } from "@/app/(app)/tim/actions";
import { Button } from "@/components/ui/button";
import { fieldDescribedBy } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input, Select } from "@/components/ui/input";
import { MAX_STARTING_INVITES } from "@/lib/validation/team";

export interface StartingInvite {
  profileId: string;
  fullName: string;
  username: string;
  roleIndex: number;
}

interface StartingInvitesProps {
  roles: ReadonlyArray<{ name: string; slots: number }>;
  leaderRoleIndex: number;
  value: StartingInvite[];
  onChange: (value: StartingInvite[]) => void;
}

/** Step 3 of the team wizard: add students you already know by username (F-TEM-01). */
export function StartingInvites({ roles, leaderRoleIndex, value, onChange }: StartingInvitesProps) {
  const open = roles
    .map((r, i) => ({ name: r.name, index: i }))
    .filter((r) => !(r.index === leaderRoleIndex && roles[r.index]!.slots === 1));
  const [username, setUsername] = useState("");
  const [roleIndex, setRoleIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const chosenRole = open.some((r) => r.index === roleIndex) ? roleIndex! : open[0]?.index;
  const full = value.length >= MAX_STARTING_INVITES;

  function add() {
    if (chosenRole === undefined || !username.trim()) return;
    startTransition(async () => {
      const res = await findStudent(username);
      if (!res.ok) return setError(res.error.message);
      if (value.some((v) => v.profileId === res.data.profileId))
        return setError("Username ini sudah ada di daftar.");
      onChange([...value, { ...res.data, roleIndex: chosenRole }]);
      setUsername("");
      setError(undefined);
    });
  }

  if (open.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="invites-heading">
      <h3 id="invites-heading" className="text-sm font-medium text-ink-2">
        Ajak teman yang sudah kamu kenal <span className="font-normal text-ink-3">(opsional)</span>
      </h3>
      <p className="text-sm text-ink-3">
        Mereka menerima undangan biasa dan masuk tim setelah menerimanya.
      </p>

      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((v) => (
            <li
              key={v.profileId}
              className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
            >
              <span className="text-sm text-ink">
                {v.fullName} <span className="text-ink-3">@{v.username}</span> sebagai{" "}
                <span className="font-medium">{roles[v.roleIndex]?.name}</span>
              </span>
              <IconButton
                label={`Batalkan undangan untuk ${v.username}`}
                icon={<X aria-hidden size={16} strokeWidth={1.75} />}
                onClick={() => onChange(value.filter((x) => x.profileId !== v.profileId))}
              />
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="invite-username" className="sr-only">
              Username
            </label>
            <Input
              id="invite-username"
              placeholder="username"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              aria-invalid={!!error}
              aria-describedby={fieldDescribedBy("invite-username", undefined, error)}
              className="sm:flex-1"
            />
            <label htmlFor="invite-role" className="sr-only">
              Role untuk teman ini
            </label>
            <Select
              id="invite-role"
              value={chosenRole}
              onChange={(e) => setRoleIndex(Number(e.target.value))}
              className="sm:w-56"
            >
              {open.map((r) => (
                <option key={r.index} value={r.index}>
                  {r.name}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={add}
              disabled={pending || !username.trim()}
              aria-busy={pending}
              icon={<Plus aria-hidden size={16} strokeWidth={1.75} />}
            >
              Tambah
            </Button>
          </div>
          {error && (
            <p id="invite-username-error" className="text-xs text-danger-ink">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
