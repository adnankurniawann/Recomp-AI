"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelInvite, respondInvite } from "@/app/(app)/undangan/actions";
import { Button } from "@/components/ui/button";

interface RespondProps {
  inviteId: string;
  /** The team as named in a sentence, "Tim Ombak" (teamPhrase). */
  team: string;
  /** The student already has a team for this competition (PRD §5.3). */
  hasTeam: boolean;
}

/** "Terima" and "Tolak" on an incoming invite. Declining asks once more, since it can't be undone. */
export function RespondButtons({ inviteId, team, hasTeam }: RespondProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function respond(action: "accept" | "decline") {
    startTransition(async () => {
      const result = await respondInvite(inviteId, action);
      if (!result.ok) {
        toast.error(result.error.message);
        router.refresh();
        return;
      }
      toast.success(action === "accept" ? `Kamu sekarang anggota ${team}` : "Undangan ditolak");
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Konfirmasi tolak">
        <span className="text-sm text-ink-2">Tolak undangan ini?</span>
        <Button
          size="sm"
          variant="danger"
          className="h-11 md:h-8"
          disabled={pending}
          onClick={() => respond("decline")}
        >
          {pending ? "Menolak…" : "Ya, tolak"}
        </Button>
        <Button
          size="sm"
          className="h-11 md:h-8"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Batal
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="accent"
          className="h-11 md:h-10"
          disabled={hasTeam || pending}
          aria-busy={pending}
          onClick={() => respond("accept")}
          icon={<Check aria-hidden size={16} strokeWidth={1.75} />}
        >
          {pending ? "Memproses…" : "Terima"}
        </Button>
        <Button
          variant="secondary"
          className="h-11 md:h-10"
          disabled={pending}
          onClick={() => setConfirming(true)}
          icon={<X aria-hidden size={16} strokeWidth={1.75} />}
        >
          Tolak
        </Button>
      </div>
      {hasTeam && <p className="text-sm text-warning-ink">Kamu sudah punya tim untuk lomba ini</p>}
    </div>
  );
}

/** "Batalkan" on a pending invite the student sent (F-INV-06). */
export function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function cancel() {
    startTransition(async () => {
      const result = await cancelInvite(inviteId);
      if (!result.ok) toast.error(result.error.message);
      else toast.success("Undangan dibatalkan");
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" className="h-11 md:h-8" onClick={() => setConfirming(true)}>
        Batalkan
      </Button>
    );
  }
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Konfirmasi batalkan"
    >
      <Button
        size="sm"
        variant="danger"
        className="h-11 md:h-8"
        disabled={pending}
        onClick={cancel}
      >
        {pending ? "Membatalkan…" : "Ya, batalkan"}
      </Button>
      <Button
        size="sm"
        className="h-11 md:h-8"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Tidak
      </Button>
    </div>
  );
}
