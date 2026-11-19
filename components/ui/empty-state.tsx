import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: ReactNode;
  /** A button or link, usually one secondary Button. */
  action?: ReactNode;
  className?: string;
}

/** An icon in a `wash` circle, a title, a line of text and an optional action. No illustrations (PRD §9.7). */
export function EmptyState({ icon: Icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-wash text-primary-hover">
        <Icon aria-hidden size={22} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-medium text-ink-strong">{title}</p>
        {body && <div className="text-sm text-ink-3">{body}</div>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
