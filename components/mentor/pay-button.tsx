"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { simulatePayment } from "@/app/(marketing)/mentor/actions";
import { Button } from "@/components/ui/button";

/** "Bayar (Simulasi)" on the checkout page (F-MNT-03). Goes to the team dashboard once paid. */
export function PayButton({ bookingId, teamId }: { bookingId: string; teamId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pay() {
    startTransition(async () => {
      const res = await simulatePayment(bookingId);
      if (!res.ok) {
        toast.error(res.error.message);
        router.refresh();
        return;
      }
      toast.success("Pembayaran simulasi berhasil. Sesi mentor masuk ke dashboard tim.");
      router.push(`/tim/${teamId}`);
    });
  }

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      disabled={pending}
      aria-busy={pending}
      onClick={pay}
    >
      {pending ? "Memproses…" : "Bayar (Simulasi)"}
    </Button>
  );
}
