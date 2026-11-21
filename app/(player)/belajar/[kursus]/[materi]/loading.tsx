/** Skeleton of the lesson player: both bars and the two panels. */
export default function LessonLoading() {
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
        <div className="h-10 w-56 animate-pulse rounded-full bg-surface-2" />
        <div className="ml-auto h-8 w-24 animate-pulse rounded-full bg-surface-2" />
      </div>
      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-2 lg:p-6">
        <div className="flex flex-col gap-4">
          <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
          <div className="h-80 animate-pulse rounded-xl bg-surface-2" />
        </div>
        <div className="hidden flex-col gap-4 lg:flex">
          <div className="h-96 animate-pulse rounded-xl bg-surface-2" />
        </div>
      </div>
      <div className="h-14 shrink-0 bg-primary" />
    </div>
  );
}
