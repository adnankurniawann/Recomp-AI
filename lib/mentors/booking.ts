import type { StatusTone } from "@/components/ui/status-badge";
import type { Enums } from "@/lib/supabase/types";

/** The words and badge tone for each booking status (PRD F-MNT-03..04). */
export const BOOKING_STATUS: Record<
  Enums<"booking_status_t">,
  { label: string; tone: StatusTone }
> = {
  pending_payment: { label: "Menunggu pembayaran", tone: "warning" },
  paid: { label: "Dibayar (Simulasi)", tone: "success" },
  done: { label: "Selesai", tone: "neutral" },
  cancelled: { label: "Dibatalkan", tone: "neutral" },
};
