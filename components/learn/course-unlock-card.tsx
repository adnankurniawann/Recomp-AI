"use client";

import { Lock, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { redeemPromo, simulatePurchase } from "@/app/(app)/belajar/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { formatRupiah } from "@/lib/format/currency";

interface CourseUnlockCardProps {
  courseId: string;
  courseTitle: string;
  price: number;
}

/**
 * Shown in place of a locked lesson (PRD F-LRN-05): the price, a promo code field and
 * "Bayar (Simulasi)". No money moves; the payment is labelled as simulated (ADR 0005).
 */
export function CourseUnlockCard({ courseId, courseTitle, price }: CourseUnlockCardProps) {
  const router = useRouter();
  const codeId = useId();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function unlocked(message: string) {
    toast.success(message);
    router.refresh();
  }

  function applyCode() {
    setCodeError(null);
    startTransition(async () => {
      const result = await redeemPromo(courseId, code);
      if (!result.ok) {
        setCodeError(result.error.fields?.code ?? result.error.message);
        return;
      }
      unlocked("Kode promo dipakai. Kursus ini sudah terbuka");
    });
  }

  function pay() {
    startTransition(async () => {
      const result = await simulatePurchase(courseId);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      unlocked("Pembayaran simulasi berhasil. Kursus ini sudah terbuka");
    });
  }

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-wash text-primary-hover">
          <Lock aria-hidden size={18} strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink-strong">
            Buka kursus ini
          </h2>
          <p className="text-sm text-ink-2">
            Bab pertama {courseTitle} gratis. Materi berikutnya terbuka setelah kamu membuka kursus.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-2xl text-ink-strong tabular-nums">
          {formatRupiah(price)}
        </span>
        <SimulatedBadge />
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!pending && code.trim()) applyCode();
        }}
      >
        <Field id={codeId} label="Kode promo" optional error={codeError ?? undefined}>
          <div className="flex gap-2">
            <Input
              id={codeId}
              value={code}
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={!!codeError}
              aria-describedby={fieldDescribedBy(codeId, undefined, codeError ?? undefined)}
              className="font-mono uppercase"
            />
            <Button
              type="submit"
              variant="accent"
              className="h-11 shrink-0 md:h-10"
              disabled={pending || !code.trim()}
            >
              Pakai kode
            </Button>
          </div>
        </Field>
      </form>

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <p className="flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-sm text-warning-ink">
          <TriangleAlert aria-hidden size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          Ini pembayaran simulasi. Tidak ada uang yang ditarik.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={pay}
          disabled={pending}
          aria-busy={pending}
          className="self-start"
        >
          {pending ? "Memproses…" : "Bayar (Simulasi)"}
        </Button>
      </div>
    </Card>
  );
}
