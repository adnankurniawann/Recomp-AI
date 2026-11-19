/** Loading shape of the onboarding card and the /profil form. */
export function ProfileFormSkeleton({ withSteps = false }: { withSteps?: boolean }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6"
    >
      <span className="sr-only">Memuat profil…</span>
      {withSteps && (
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className="size-7 animate-pulse rounded-full bg-surface-2" />
              <div className="h-px flex-1 bg-line" />
            </div>
          ))}
        </div>
      )}
      <div className="h-7 w-48 animate-pulse rounded-md bg-surface-2" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4 w-28 animate-pulse rounded-sm bg-surface-2" />
          <div className="h-10 w-full animate-pulse rounded-md bg-surface-2" />
        </div>
      ))}
      <div className="flex justify-end">
        <div className="h-11 w-32 animate-pulse rounded-md bg-surface-2" />
      </div>
    </div>
  );
}
