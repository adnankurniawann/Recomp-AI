"use client";

import { ImageUp, Trash2 } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { removePortfolioCover, uploadPortfolioCover } from "@/app/(app)/profil/actions";
import { Button } from "@/components/ui/button";
import { checkImage, IMAGE_ACCEPT } from "@/lib/validation/upload";

interface PortfolioCoverProps {
  portfolioId: string;
  coverUrl: string | null | undefined;
  onChange: (coverUrl: string | null) => void;
}

/** Upload, replace or remove one portfolio item's cover (PRD F-PRF-04). */
export function PortfolioCover({ portfolioId, coverUrl, onChange }: PortfolioCoverProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(file: File) {
    const check = checkImage(file);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError(null);
    const form = new FormData();
    form.set("portfolioId", portfolioId);
    form.set("file", file);
    startTransition(async () => {
      const result = await uploadPortfolioCover(form);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onChange(result.data.coverUrl);
      toast.success("Sampul tersimpan");
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removePortfolioCover(portfolioId);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      onChange(null);
      toast.success("Sampul dihapus");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-2">
        Gambar sampul <span className="font-normal text-ink-3">(opsional)</span>
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <div className="aspect-video w-36 shrink-0 overflow-hidden rounded-lg border border-line bg-wash">
          {coverUrl && (
            // Covers come from the public `portfolio` bucket.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Sampul saat ini" className="size-full object-cover" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-describedby={`${inputId}-msg`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload(file);
            }}
          />
          <Button
            size="sm"
            className="h-11 md:h-8"
            disabled={pending}
            aria-busy={pending}
            onClick={() => inputRef.current?.click()}
            icon={<ImageUp aria-hidden size={16} strokeWidth={1.75} />}
          >
            {pending ? "Memproses…" : coverUrl ? "Ganti sampul" : "Unggah sampul"}
          </Button>
          {coverUrl && (
            <Button
              size="sm"
              variant="ghost"
              className="h-11 md:h-8"
              disabled={pending}
              onClick={remove}
              icon={<Trash2 aria-hidden size={16} strokeWidth={1.75} />}
            >
              Hapus sampul
            </Button>
          )}
        </div>
      </div>
      <p id={`${inputId}-msg`} className={error ? "text-xs text-danger-ink" : "text-xs text-ink-3"}>
        {error ??
          "JPG, PNG, atau WebP, maksimal 2 MB. Tanpa sampul, kartu memakai ikon sesuai tautan."}
      </p>
    </div>
  );
}
