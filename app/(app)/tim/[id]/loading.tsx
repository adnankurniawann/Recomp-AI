export default function TeamLoading() {
  const block = "animate-pulse rounded-md bg-surface-2";
  const card = "flex flex-col gap-4 rounded-xl border border-line bg-surface p-6";
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <span className="sr-only">Memuat tim…</span>
      <div className={`${block} h-8 w-64`} />
      <div className={`${block} h-4 w-80 max-w-full`} />
      <div className={`${block} h-28 w-full rounded-xl`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={card}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${block} h-12 w-full`} />
          ))}
        </div>
        <div className={card}>
          {[0, 1].map((i) => (
            <div key={i} className={`${block} h-10 w-full`} />
          ))}
        </div>
      </div>
    </main>
  );
}
