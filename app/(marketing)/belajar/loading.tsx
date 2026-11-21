export default function CoursesLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-16 animate-pulse rounded-sm bg-surface-2" />
        <div className="h-7 w-80 max-w-full animate-pulse rounded-md bg-surface-2" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-sm bg-surface-2" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <div className="aspect-video animate-pulse rounded-lg bg-surface-2" />
            <div className="h-4 w-3/4 animate-pulse rounded-sm bg-surface-2" />
            <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface-2" />
          </li>
        ))}
      </ul>
    </main>
  );
}
