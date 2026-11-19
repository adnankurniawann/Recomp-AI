"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}

/** The error card every data page shows: a message and "Coba lagi" (PRD §9.7). */
export function ErrorState({
  title = "Data belum bisa dimuat",
  body = "Periksa koneksimu, lalu coba lagi.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-ink">
        <AlertTriangle aria-hidden size={22} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-medium text-ink-strong">{title}</p>
        <p className="text-sm text-ink-3">{body}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} icon={<RotateCw aria-hidden size={16} strokeWidth={1.75} />}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
