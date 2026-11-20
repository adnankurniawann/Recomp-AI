export default function InvitesLoading() {
  const block = "animate-pulse rounded-md bg-surface-2";
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <span className="sr-only">Memuat undangan…</span>
      <div className={`${block} h-8 w-48`} />
      <div className={`${block} h-10 w-56`} />
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
          <div className={`${block} h-4 w-64`} />
          <div className={`${block} h-6 w-80 max-w-full`} />
          <div className="flex gap-2">
            <div className="h-7 w-28 animate-pulse rounded-full bg-surface-2" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-surface-2" />
          </div>
          <div className={`${block} h-16 w-full`} />
          <div className="flex gap-2">
            <div className={`${block} h-10 w-24`} />
            <div className={`${block} h-10 w-24`} />
          </div>
        </div>
      ))}
    </main>
  );
}
