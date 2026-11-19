import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StepCardProps {
  number: number;
  icon: LucideIcon;
  title: string;
  body: string;
}

/** One step of "Cara kerja": icon, title, a line of text and a small mono number (PRD §9.7). */
export function StepCard({ number, icon: Icon, title, body }: StepCardProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex size-10 items-center justify-center rounded-md bg-wash text-primary-hover">
          <Icon aria-hidden size={18} strokeWidth={1.75} />
        </span>
        <span className="font-mono text-xs text-ink-3 tabular-nums">
          {String(number).padStart(2, "0")}
        </span>
      </div>
      <h3 className="text-lg leading-[1.35] font-semibold tracking-[-0.01em] text-ink-strong">
        {title}
      </h3>
      <p className="text-sm leading-[1.6] text-ink-2">{body}</p>
    </Card>
  );
}
