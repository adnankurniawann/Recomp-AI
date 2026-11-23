import type { StatusTone } from "@/components/ui/status-badge";
import type { Enums } from "@/lib/supabase/types";

/** The words and badge tone for each team status (PRD §5.1). */
export const TEAM_STATUS: Record<Enums<"team_status_t">, { label: string; tone: StatusTone }> = {
  forming: { label: "Sedang mencari", tone: "primary" },
  complete: { label: "Tim lengkap", tone: "success" },
  archived: { label: "Diarsipkan", tone: "neutral" },
};
