export default function MentorLoading() {
  const block = "animate-pulse rounded-md bg-surface-2";
  return (
    <main
      aria-busy="true"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12"
    >
      <span className="sr-only">Memuat mentor…</span>
      <div className={`${block} h-5 w-32`} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="size-40 animate-pulse rounded-xl bg-surface-2 sm:size-[200px]" />
        <div className="flex flex-col gap-3">
          <div className={`${block} h-9 w-64`} />
          <div className={`${block} h-7 w-40`} />
          <div className={`${block} h-5 w-72 max-w-full`} />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className={`${block} h-48 w-full`} />
        <div className="h-80 animate-pulse rounded-xl border border-line bg-surface" />
      </div>
    </main>
  );
}
