import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { Avatar } from "@/components/ui/avatar";
import { SearchInput } from "@/components/ui/search-input";
import { loadViewer } from "@/lib/profile/queries";

/** Logged-in pages: `AppShell` with the sidebar (PRD §10.0). Each page still guards its own access. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await loadViewer();

  // Search sends `?q=` to /lomba, which reads it (#16). The bell joins with #46.
  const topbar = (
    <>
      <form action="/lomba" role="search" className="ml-auto hidden w-full max-w-60 sm:block">
        <SearchInput name="q" label="Cari lomba" placeholder="Cari lomba..." shortcut />
      </form>
      {viewer && (
        <Link
          href="/profil"
          aria-label="Profil"
          className="ml-auto shrink-0 rounded-full focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none sm:ml-0"
        >
          <Avatar name={viewer.name} src={viewer.avatarUrl} colorKey={viewer.colorKey} size={32} />
        </Link>
      )}
    </>
  );

  return (
    <AppShell sidebar={<Sidebar isAdmin={viewer?.isAdmin} />} topbar={topbar}>
      {children}
    </AppShell>
  );
}
