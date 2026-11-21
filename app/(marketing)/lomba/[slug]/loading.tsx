export default function CompetitionLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="h-4 w-44 animate-pulse rounded-sm bg-surface-2" />
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="aspect-[4/5] w-full max-w-[280px] animate-pulse rounded-xl bg-surface-2" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-7 w-24 animate-pulse rounded-full bg-surface-2" />
          <div className="h-9 w-3/4 animate-pulse rounded-md bg-surface-2" />
          <div className="h-4 w-1/3 animate-pulse rounded-sm bg-surface-2" />
          <div className="h-10 w-40 animate-pulse rounded-md bg-surface-2" />
        </div>
      </div>
    </main>
  );
}
