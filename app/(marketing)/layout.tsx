import { Footer } from "@/components/layout/footer";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { loadNotificationFeed } from "@/lib/notifications/queries";
import { loadViewer } from "@/lib/profile/queries";

/** Public pages: `PublicNavbar` and footer (PRD §10.0). */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [viewer, feed] = await Promise.all([loadViewer(), loadNotificationFeed()]);
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicNavbar viewer={viewer} feed={feed} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
