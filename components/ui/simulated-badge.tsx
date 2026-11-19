import { cn } from "@/lib/utils";

/** The "Simulasi" pill every simulated profile, mentor and payment carries (ADR 0005). */
export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      title="Data ini simulasi, bukan pengguna atau transaksi asli"
      className={cn(
        "inline-flex h-[22px] items-center rounded-full border border-dashed border-warning bg-warning-50 px-2 text-xs font-medium whitespace-nowrap text-warning-ink",
        className,
      )}
    >
      Simulasi
    </span>
  );
}
