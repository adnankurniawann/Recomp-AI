import { ROLE_COLORS, type RoleKey } from "@/lib/constants";
import { initials } from "@/lib/format/initials";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  /** Diameter in px, 28 to 120. */
  size?: number;
  /** Role colour for the initials circle. Without one the avatar is neutral. */
  colorKey?: RoleKey | null;
  className?: string;
}

/**
 * A round photo, or the initials in `ink` on the role's `soft` colour when there's no photo
 * (PRD §9.7: never white text on a solid colour).
 */
export function Avatar({ name, src, size = 40, colorKey, className }: AvatarProps) {
  const px = Math.min(120, Math.max(28, size));
  const style = { width: px, height: px, fontSize: Math.round(px * 0.38) };

  if (src) {
    return (
      // Avatars come from Google or Storage; a plain img avoids listing every host for next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={px}
        height={px}
        style={style}
        className={cn(
          "shrink-0 rounded-full border border-line bg-surface-2 object-cover",
          className,
        )}
        referrerPolicy="no-referrer"
      />
    );
  }

  const color = ROLE_COLORS[colorKey ?? "other"];
  return (
    <span
      role="img"
      aria-label={name}
      style={style}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none",
        color.soft,
        color.ink,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
