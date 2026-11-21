export default function CourseLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="h-4 w-44 animate-pulse rounded-sm bg-surface-2" />
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="aspect-video w-full animate-pulse rounded-xl bg-surface-2 md:w-[340px]" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-7 w-24 animate-pulse rounded-full bg-surface-2" />
          <div className="h-9 w-3/4 animate-pulse rounded-md bg-surface-2" />
          <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface-2" />
          <div className="h-11 w-40 animate-pulse rounded-md bg-surface-2" />
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:w-2/3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />
        ))}
      </div>
    </main>
  );
}
