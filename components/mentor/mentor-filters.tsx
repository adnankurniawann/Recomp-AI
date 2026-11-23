"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import {
  COMP_CATEGORIES,
  COMP_CATEGORY_LABELS,
  PREFERRED_ROLE_KEYS,
  ROLE_LABELS,
} from "@/lib/constants";
import { MENTOR_SORTS, MENTOR_SORT_LABELS, PRICE_FILTERS, PRICE_LABELS } from "@/lib/mentors/list";

const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-line bg-surface px-3 text-sm md:h-10 sm:w-auto text-ink shadow-xs hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none";

/** Role chips, competition category, price range and sort. State lives in the URL. */
export function MentorFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const role = params.get("peran");
  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Filter role"
        className="flex flex-wrap items-center gap-x-2 gap-y-4 sm:gap-y-2"
      >
        <Chip selected={!role} onClick={() => set("peran", undefined)}>
          Semua
        </Chip>
        {PREFERRED_ROLE_KEYS.map((r) => (
          <Chip
            key={r}
            color={r}
            selected={role === r}
            onClick={() => set("peran", role === r ? undefined : r)}
          >
            {ROLE_LABELS[r]}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex">
        <select
          aria-label="Kategori lomba"
          value={params.get("kategori") ?? ""}
          onChange={(e) => set("kategori", e.target.value || undefined)}
          className={selectClass}
        >
          <option value="">Semua kategori lomba</option>
          {COMP_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {COMP_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          aria-label="Harga"
          value={params.get("harga") ?? ""}
          onChange={(e) => set("harga", e.target.value || undefined)}
          className={selectClass}
        >
          <option value="">Semua harga</option>
          {PRICE_FILTERS.map((p) => (
            <option key={p} value={p}>
              {PRICE_LABELS[p]}
            </option>
          ))}
        </select>
        <select
          aria-label="Urutkan"
          value={params.get("urut") ?? "rekomendasi"}
          onChange={(e) =>
            set("urut", e.target.value === "rekomendasi" ? undefined : e.target.value)
          }
          className={selectClass}
        >
          {MENTOR_SORTS.map((s) => (
            <option key={s} value={s}>
              Urut: {MENTOR_SORT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
