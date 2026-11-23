export default function MetricsLoading() {
  const block = "animate-pulse rounded-md bg-surface-2";
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <span className="sr-only">Memuat metrik…</span>
      <div className={`${block} h-8 w-56`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-20`} />
        ))}
      </div>
      <div className={`${block} h-80 w-full`} />
    </main>
  );
}
