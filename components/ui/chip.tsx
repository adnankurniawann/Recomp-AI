import { X } from "lucide-react";
import type { ReactNode } from "react";
import { ROLE_COLORS, type RoleKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChipProps {
  children: ReactNode;
  /** Role colour key. */
  color?: RoleKey;
  /**
   * Leave undefined for a plain role chip (role `ink` on `soft`).
   * Pass a boolean to make it a toggle: `false` is white and outlined, `true` is the role colours.
   */
  selected?: boolean;
  /** Makes the chip a toggle button. */
  onClick?: () => void;
  /** Shows an × button that calls this. */
  onRemove?: () => void;
  className?: string;
}

/** A 28 px pill with a 6 px role dot (PRD §9.7). */
export function Chip({
  children,
  color = "other",
  selected,
  onClick,
  onRemove,
  className,
}: ChipProps) {
  const role = ROLE_COLORS[color];
  const colored = selected !== false;
  const classes = cn(
    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium whitespace-nowrap transition-[color,background-color,border-color] duration-150 ease-out",
    colored ? cn("border-transparent", role.soft, role.ink) : "border-line bg-surface text-ink-2",
    onClick &&
      "cursor-pointer hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none",
    onRemove && "pr-1",
    className,
  );
  const dot = <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", role.solid)} />;

  if (onClick) {
    return (
      <button type="button" aria-pressed={selected ?? false} onClick={onClick} className={classes}>
        {dot}
        {children}
      </button>
    );
  }

  return (
    <span className={classes}>
      {dot}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus ${typeof children === "string" ? children : ""}`.trim()}
          className="inline-flex size-5 items-center justify-center rounded-full hover:bg-surface focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
        >
          <X aria-hidden size={12} strokeWidth={1.75} />
        </button>
      )}
    </span>
  );
}
