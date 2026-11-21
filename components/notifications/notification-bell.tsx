"use client";

import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { markNotificationsRead } from "@/app/(app)/notifikasi/actions";
import { formatRelativeTime } from "@/lib/format/date";
import { unreadBadge, type NotificationView } from "@/lib/notifications/format";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  items: NotificationView[];
  unreadCount: number;
  className?: string;
}

/**
 * The bell in both navbars (PRD F-NTF-01): the unread count on a pill, and a dropdown with the 10
 * newest. Opening it marks everything read; items that were new keep their dot until it closes.
 */
export function NotificationBell({ items, unreadCount, className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(unreadCount);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // A new server render (after an action or a refresh) brings a fresh count.
  useEffect(() => setCount(unreadCount), [unreadCount]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && count > 0) {
      setCount(0);
      startTransition(async () => {
        const result = await markNotificationsRead();
        // Put the badge back so the student sees them again next time.
        if (!result.ok) setCount(unreadCount);
      });
    }
  }

  const badge = unreadBadge(count);
  const label = count > 0 ? `Notifikasi, ${count} belum dibaca` : "Notifikasi";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title="Notifikasi"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-2 shadow-xs transition-[color,border-color] duration-150 ease-out hover:border-line-strong hover:text-ink focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none active:bg-surface-2 md:size-10"
      >
        <Bell aria-hidden size={18} strokeWidth={1.75} />
        {badge && (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-medium text-white tabular-nums ring-2 ring-bg"
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Notifikasi terbaru"
          className="fixed inset-x-4 top-16 z-40 flex max-h-[min(480px,calc(100dvh-5rem))] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:top-[calc(100%+8px)] sm:right-0 sm:w-[360px]"
        >
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-strong">Notifikasi</h2>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-wash text-primary-hover">
                <BellOff aria-hidden size={18} strokeWidth={1.75} />
              </span>
              <p className="text-sm font-medium text-ink-strong">Belum ada notifikasi</p>
              <p className="text-sm text-ink-3">Undangan tim dan booking mentor muncul di sini.</p>
            </div>
          ) : (
            <ul className="flex flex-col overflow-y-auto py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 transition-colors duration-150 ease-out hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.unread ? "bg-primary" : "bg-transparent",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        className={cn(
                          "text-sm text-ink-strong",
                          n.unread ? "font-semibold" : "font-medium",
                        )}
                      >
                        {n.unread && <span className="sr-only">Baru: </span>}
                        {n.title}
                      </span>
                      {n.body && <span className="truncate text-sm text-ink-2">{n.body}</span>}
                      <time dateTime={n.createdAt} className="text-xs text-ink-3">
                        {formatRelativeTime(n.createdAt)}
                      </time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
