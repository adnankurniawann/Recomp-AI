import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { formatRupiah } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

/**
 * A course's price (PRD F-LRN-01): "Gratis" for a free course; otherwise the price with "Gratis untuk
 * pengguna awal" and the "Simulasi" badge, since the promo and the payment are both simulated.
 */
export function CoursePrice({
  price,
  hasAccess = false,
  className,
}: {
  price: number;
  /** The student already opened the course. */
  hasAccess?: boolean;
  className?: string;
}) {
  if (price === 0 || hasAccess) {
    return (
      <span className={cn("text-sm font-medium text-success-ink", className)}>
        {price === 0 ? "Gratis" : "Sudah terbuka"}
      </span>
    );
  }
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span className="font-mono text-sm text-ink-strong tabular-nums">{formatRupiah(price)}</span>
      <span className="text-[13px] text-ink-2">Gratis untuk pengguna awal</span>
      <SimulatedBadge />
    </span>
  );
}
