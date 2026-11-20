export default function PublicProfileLoading() {
  const block = "animate-pulse rounded-md bg-surface-2";
  return (
    <main
      aria-busy="true"
      className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[340px_1fr]"
    >
      <span className="sr-only">Memuat profil…</span>
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
        <div className="size-[120px] animate-pulse rounded-full bg-surface-2" />
        <div className={`${block} h-7 w-48`} />
        <div className={`${block} h-4 w-56`} />
        <div className="flex gap-2">
          <div className="h-7 w-20 animate-pulse rounded-full bg-surface-2" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-surface-2" />
        </div>
        <div className={`${block} h-16 w-full`} />
      </div>
      <div className="flex flex-col gap-6">
        <div className={`${block} h-40 w-full rounded-xl`} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${block} aspect-[4/3] rounded-xl`} />
          ))}
        </div>
      </div>
    </main>
  );
}
