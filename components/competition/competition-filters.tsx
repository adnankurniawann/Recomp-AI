"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { SearchInput } from "@/components/ui/search-input";
import { COMP_CATEGORIES, COMP_CATEGORY_LABELS } from "@/lib/constants";
import { DEADLINE_FILTERS, DEADLINE_LABELS, TEAM_SIZES } from "@/lib/competitions/filter";

const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-line bg-surface px-3 text-sm md:h-10 sm:w-auto text-ink shadow-xs hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none";

/** Keyword, category chips, deadline and team size. State lives in the URL so links can be shared. */
export function CompetitionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function set(key: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Debounce typing so each keystroke does not refetch the page.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => set("q", q.trim() || undefined), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const category = params.get("kategori");
  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        label="Cari lomba"
        placeholder="Cari lomba atau penyelenggara..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-4 sm:gap-y-2">
        <Chip selected={!category} onClick={() => set("kategori", undefined)}>
          Semua
        </Chip>
        {COMP_CATEGORIES.map((c) => (
          <Chip
            key={c}
            selected={category === c}
            onClick={() => set("kategori", category === c ? undefined : c)}
          >
            {COMP_CATEGORY_LABELS[c]}
          </Chip>
        ))}
        <div className="grid w-full grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:ml-auto sm:flex sm:w-auto">
          <select
            aria-label="Status deadline"
            value={params.get("deadline") ?? ""}
            onChange={(e) => set("deadline", e.target.value || undefined)}
            className={selectClass}
          >
            <option value="">Semua deadline</option>
            {DEADLINE_FILTERS.map((d) => (
              <option key={d} value={d}>
                {d === "closing" ? "Segera tutup (7 hari)" : DEADLINE_LABELS[d]}
              </option>
            ))}
          </select>
          <select
            aria-label="Ukuran tim"
            value={params.get("tim") ?? ""}
            onChange={(e) => set("tim", e.target.value || undefined)}
            className={selectClass}
          >
            <option value="">Semua ukuran tim</option>
            {TEAM_SIZES.map((n) => (
              <option key={n} value={n}>
                Tim {n} orang
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
