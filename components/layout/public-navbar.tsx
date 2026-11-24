"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { NotificationFeed } from "@/lib/notifications/queries";
import type { Viewer } from "@/lib/profile/queries";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { isActive, PUBLIC_LINKS } from "./nav";

const linkClasses =
  "rounded-sm px-1 text-[15px] font-medium transition-colors duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none";

/**
 * Top bar of public pages (PRD §10.0, §10.1). Signed-in viewers get "Tim saya", the notification
 * bell and their avatar.
 */
export function PublicNavbar({
  viewer,
  feed = null,
}: {
  viewer: Viewer | null;
  feed?: NotificationFeed | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = PUBLIC_LINKS.map(({ href, label }) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen(false)}
        className={cn(linkClasses, active ? "text-primary" : "text-ink hover:text-primary")}
      >
        {label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Menu utama" className="hidden flex-1 justify-center gap-6 md:flex">
          {links}
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          {viewer ? (
            <>
              <Link
                href="/tim"
                className={buttonClasses("secondary", "sm", "hidden sm:inline-flex")}
              >
                Tim saya
              </Link>
              {feed && <NotificationBell items={feed.items} unreadCount={feed.unreadCount} />}
              <Link
                href="/profil"
                aria-label="Profil"
                className="tap-target rounded-full focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
              >
                <Avatar
                  name={viewer.name}
                  src={viewer.avatarUrl}
                  colorKey={viewer.colorKey}
                  size={32}
                />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/masuk"
                className={cn(linkClasses, "hidden text-sm text-ink hover:text-primary md:inline")}
              >
                Masuk
              </Link>
              <Link
                href="/masuk"
                className={buttonClasses("primary", "md", "h-11 px-3.5 md:h-[38px]")}
              >
                Mulai gratis
              </Link>
            </>
          )}
          <IconButton
            label={open ? "Tutup menu" : "Buka menu"}
            icon={
              open ? (
                <X aria-hidden size={18} strokeWidth={1.75} />
              ) : (
                <Menu aria-hidden size={18} strokeWidth={1.75} />
              )
            }
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="size-11 md:hidden"
          />
        </div>
      </div>
      {open && (
        <nav
          aria-label="Menu utama"
          className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden [&>a]:flex [&>a]:h-11 [&>a]:items-center"
        >
          {links}
          {viewer ? (
            <Link
              href="/tim"
              onClick={() => setOpen(false)}
              className={cn(linkClasses, "text-ink")}
            >
              Tim saya
            </Link>
          ) : (
            <Link
              href="/masuk"
              onClick={() => setOpen(false)}
              className={cn(linkClasses, "text-ink")}
            >
              Masuk
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
