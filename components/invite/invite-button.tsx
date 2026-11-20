"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { InviteDialog, type InviteDialogProps } from "./invite-dialog";

type InviteButtonProps = Omit<InviteDialogProps, "open" | "onClose" | "onSent"> & {
  /** `pending` when this team already invited the candidate (ranking `inviteStatus`). */
  inviteStatus?: string | null;
  onSent?: (inviteId: string | null) => void;
  className?: string;
};

/**
 * "Undang" for a candidate row, card or profile sheet (F-INV-01). Once sent it turns into a
 * "Menunggu respon" badge and can't be pressed again.
 */
export function InviteButton({ inviteStatus, onSent, className, ...dialog }: InviteButtonProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(inviteStatus === "pending");

  if (sent) {
    return (
      <StatusBadge tone="warning" className={className}>
        Menunggu respon
      </StatusBadge>
    );
  }

  return (
    <>
      <Button
        variant="accent"
        size="sm"
        className={cn("h-11 md:h-8", className)}
        onClick={() => setOpen(true)}
        icon={<UserPlus aria-hidden size={16} strokeWidth={1.75} />}
        aria-label={`Undang ${dialog.candidate.fullName}`}
      >
        Undang
      </Button>
      <InviteDialog
        {...dialog}
        open={open}
        onClose={() => setOpen(false)}
        onSent={(id) => {
          setSent(true);
          onSent?.(id);
        }}
      />
    </>
  );
}
