import { Footer } from "@/components/layout/footer";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { loadViewer } from "@/lib/profile/queries";

/** Public pages: `PublicNavbar` and footer (PRD §10.0). */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const viewer = await loadViewer();
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicNavbar viewer={viewer} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
