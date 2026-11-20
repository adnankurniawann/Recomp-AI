"use client";

import { Send, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendInvite } from "@/app/(app)/undangan/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/input";
import type { RoleKey } from "@/lib/constants";
import { INVITE_MESSAGE_MAX } from "@/lib/validation/invite";

export interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  teamRoleId: string;
  roleName: string;
  colorKey: RoleKey;
  candidate: { id: string; fullName: string };
  /** Start of the message, usually `inviteTemplate(...)` (PRD F-INV-01). */
  defaultMessage: string;
  /** Marks the invite as AI-drafted when it came from the recruiter agent (F-RCR-01). */
  aiDrafted?: boolean;
  agentActionId?: string;
  /** Called after the invite exists, also when one was already pending. */
  onSent: (inviteId: string | null) => void;
}

/**
 * The invite dialog (PRD F-INV-01): the role is locked to the tab it came from, the message is
 * editable up to 500 characters, and nothing is sent until "Kirim undangan" (ADR 0004).
 */
export function InviteDialog({
  open,
  onClose,
  teamRoleId,
  roleName,
  colorKey,
  candidate,
  defaultMessage,
  aiDrafted = false,
  agentActionId,
  onSent,
}: InviteDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  const [message, setMessage] = useState(defaultMessage);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setMessage(defaultMessage);
      setError(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, defaultMessage]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await sendInvite({
        teamRoleId,
        candidateId: candidate.id,
        message,
        aiDrafted,
        ...(agentActionId && { agentActionId }),
      });
      if (!result.ok) {
        if (result.error.code === "ALREADY_PENDING") {
          onSent(null);
          onClose();
        }
        setError(result.error.fields?.message ?? result.error.message);
        return;
      }
      toast.success(`Undangan terkirim ke ${candidate.fullName}`);
      onSent(result.data.inviteId);
      onClose();
    });
  }

  const hint = (
    <span className="font-mono tabular-nums">
      {message.length}/{INVITE_MESSAGE_MAX}
    </span>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        if (pending) e.preventDefault();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-ink-strong/40"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (!pending) submit();
        }}
        className="flex flex-col gap-5 p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold tracking-[-0.01em] text-ink-strong">
            Undang {candidate.fullName}
          </h2>
          <IconButton
            label="Tutup"
            icon={<X aria-hidden size={18} strokeWidth={1.75} />}
            onClick={onClose}
            disabled={pending}
            className="-mt-1 -mr-1"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-2">Role</span>
          <div>
            <Chip color={colorKey}>{roleName}</Chip>
          </div>
        </div>

        <Field id={messageId} label="Pesan" hint={hint} error={error ?? undefined}>
          <Textarea
            id={messageId}
            rows={6}
            maxLength={INVITE_MESSAGE_MAX}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={fieldDescribedBy(messageId, hint, error ?? undefined)}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="lg" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={pending || message.trim().length === 0}
            aria-busy={pending}
            icon={<Send aria-hidden size={16} strokeWidth={1.75} />}
          >
            {pending ? "Mengirim…" : "Kirim undangan"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
