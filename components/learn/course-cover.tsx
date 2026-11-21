import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/** A course cover from Storage, or a `wash` tile with a book when there is none yet. */
export function CourseCover({
  src,
  className,
  iconSize = 28,
}: {
  src: string | null;
  className?: string;
  iconSize?: number;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-wash", className)}>
      {src ? (
        // Covers come from Supabase Storage at any size, so a plain img avoids remote config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-primary-hover">
          <BookOpen aria-hidden size={iconSize} strokeWidth={1.5} />
        </span>
      )}
    </div>
  );
}
