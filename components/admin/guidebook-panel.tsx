"use client";

import { FileText, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { setGuidebook } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { EXTRACTION_STATUS } from "@/lib/ai/extraction-status";
import { formatRelativeTime } from "@/lib/format/date";
import type { Enums } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { checkPdf } from "@/lib/validation/upload";

type ExtractionStatus = Enums<"extraction_status_t">;

interface GuidebookPanelProps {
  competitionId: string;
  guidebook: { path: string; url: string | null } | null;
  extractions: {
    id: string;
    status: ExtractionStatus;
    createdAt: string;
    error: string | null;
    current: boolean;
  }[];
}

/** Upload the guidebook PDF, run the guidebook agent, open a result to review (F-CMP-04). */
export function GuidebookPanel({ competitionId, guidebook, extractions }: GuidebookPanelProps) {
  const router = useRouter();
  const fileId = useId();
  const [uploading, setUploading] = useState(false);
  const [running, startRun] = useTransition();

  async function upload(file: File | undefined) {
    if (!file) return;
    const check = checkPdf(file);
    if (!check.ok) return void toast.error(check.message);

    setUploading(true);
    const path = `${competitionId}/${Date.now()}.pdf`;
    const { error } = await createClient()
      .storage.from("guidebooks")
      .upload(path, file, { contentType: "application/pdf", upsert: false });
    if (error) {
      setUploading(false);
      return void toast.error("Guidebook belum bisa diunggah. Coba lagi.");
    }
    const res = await setGuidebook(competitionId, path);
    setUploading(false);
    if (!res.ok) return void toast.error(res.error.message);
    toast.success("Guidebook sudah diunggah. Jalankan ekstraksi untuk membacanya.");
    router.refresh();
  }

  function run() {
    startRun(async () => {
      const res = await fetch("/api/ai/guidebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, force: true }),
      });
      const body = (await res.json().catch(() => null)) as {
        extractionId?: string;
        status?: ExtractionStatus;
        error?: { message?: string } | string | null;
      } | null;
      if (!res.ok || !body?.extractionId) {
        const message = typeof body?.error === "object" ? body.error?.message : null;
        toast.error(message ?? "Ekstraksi belum bisa dijalankan. Coba lagi.");
        return;
      }
      if (body.status === "failed") {
        toast.error("AI belum bisa membaca guidebook ini. Cek file PDF-nya, lalu coba lagi.");
        router.refresh();
        return;
      }
      toast.success("Ekstraksi selesai. Periksa hasilnya sebelum disetujui.");
      router.push(`/admin/lomba/${competitionId}/ekstraksi/${body.extractionId}`);
    });
  }

  return (
    <Card padding="lg" className="flex flex-col gap-5 max-sm:px-4">
      <SectionLabel>Guidebook</SectionLabel>

      <div className="flex flex-wrap items-center gap-3">
        {guidebook ? (
          <a
            href={guidebook.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm text-primary hover:underline"
          >
            <FileText aria-hidden size={16} strokeWidth={1.75} className="shrink-0" />
            <span className="truncate font-mono">{guidebook.path}</span>
          </a>
        ) : (
          <p className="text-sm text-ink-3">Belum ada guidebook.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={fileId}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink shadow-xs hover:border-line-strong has-focus-visible:ring-3 has-focus-visible:ring-primary-200 md:h-10"
        >
          <Upload aria-hidden size={16} strokeWidth={1.75} />
          {uploading ? "Mengunggah…" : guidebook ? "Ganti PDF" : "Unggah PDF"}
          <input
            id={fileId}
            type="file"
            accept="application/pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <Button
          variant="secondary"
          onClick={run}
          disabled={!guidebook || running || uploading}
          aria-busy={running}
          icon={<Sparkles aria-hidden size={16} strokeWidth={1.75} />}
        >
          {running ? "Membaca guidebook…" : "Jalankan ekstraksi"}
        </Button>
      </div>
      <p className="text-xs text-ink-3">
        PDF saja, maksimal 20 MB. Ekstraksi bisa memakan waktu sampai 1 menit.
      </p>

      {extractions.length > 0 && (
        <ul className="flex flex-col border-t border-line pt-4">
          {extractions.map((x) => (
            <li
              key={x.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2 text-sm first:border-t-0 first:pt-0"
            >
              <span className="flex items-center gap-2 text-ink-2">
                <StatusBadge tone={EXTRACTION_STATUS[x.status].tone}>
                  {EXTRACTION_STATUS[x.status].label}
                </StatusBadge>
                {formatRelativeTime(x.createdAt)}
                {!x.current && <span className="text-ink-3">· guidebook lama</span>}
              </span>
              {x.status === "draft" || x.status === "reviewed" ? (
                <Link
                  href={`/admin/lomba/${competitionId}/ekstraksi/${x.id}`}
                  className="text-primary hover:underline"
                >
                  {x.status === "draft" ? "Review hasil" : "Lihat dan edit"}
                </Link>
              ) : (
                x.error && <span className="text-xs text-danger-ink">{x.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
