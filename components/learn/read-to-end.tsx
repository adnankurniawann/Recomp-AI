"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { markLessonRead } from "@/app/(app)/belajar/actions";

/**
 * Placed at the end of a lesson without questions: once it scrolls into view, the lesson counts as
 * done (PRD F-LRN-03). Sent once per page view.
 */
export function ReadToEnd({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting || sent.current) return;
      sent.current = true;
      observer.disconnect();
      const r = await markLessonRead(lessonId);
      if (r.ok) {
        toast.success("Materi ini selesai");
        router.refresh();
      } else {
        sent.current = false;
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [lessonId, router]);

  return <div ref={ref} aria-hidden className="h-px" />;
}
