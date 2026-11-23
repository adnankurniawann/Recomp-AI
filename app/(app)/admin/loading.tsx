export default function AdminLoading() {
  const block = "animate-pulse rounded-md bg-surface-2";
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <span className="sr-only">Memuat…</span>
      <div className={`${block} h-8 w-64`} />
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-10 w-full`} />
        ))}
      </div>
    </main>
  );
}
