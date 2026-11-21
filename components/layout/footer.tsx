import Link from "next/link";
import { Logo } from "./logo";

/** Footer of public pages (PRD §10.1). */
export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:gap-8 sm:px-6">
        <Logo />
        <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link
            href="/privasi"
            className="tap-target rounded-sm text-ink-2 hover:text-ink focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
          >
            Kebijakan privasi
          </Link>
        </nav>
        <p className="text-sm text-ink-3 sm:ml-auto">
          © <span className="font-mono tabular-nums">2026</span> Tim Cumlaude
        </p>
      </div>
    </footer>
  );
}
