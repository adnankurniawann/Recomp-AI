import type { StatusTone } from "@/components/ui/status-badge";
import type { Enums } from "@/lib/supabase/types";

/** The words and badge tone for each extraction status (PRD §5.2), in the admin pages. */
export const EXTRACTION_STATUS: Record<
  Enums<"extraction_status_t">,
  { label: string; tone: StatusTone }
> = {
  processing: { label: "Diproses", tone: "primary" },
  draft: { label: "Draf AI", tone: "warning" },
  reviewed: { label: "Sudah direview", tone: "success" },
  failed: { label: "Gagal", tone: "danger" },
};
