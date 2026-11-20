import { Inbox, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IncomingInviteCard, SentInviteCard } from "@/components/invite/invite-cards";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { loadInviteInbox } from "@/lib/invites/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Undangan" };

const TABS = [
  { key: "masuk", label: "Masuk" },
  { key: "terkirim", label: "Terkirim" },
] as const;

type Props = { searchParams: Promise<{ tab?: string }> };

/** Incoming and sent invites (PRD F-INV-02, §10.11). */
export default async function InvitesPage({ searchParams }: Props) {
  const inbox = await loadInviteInbox();
  if (!inbox) redirect("/masuk?next=/undangan");

  const tab = (await searchParams).tab === "terkirim" ? "terkirim" : "masuk";
  const list = tab === "masuk" ? inbox.incoming : inbox.sent;
  const waiting = {
    masuk: inbox.incoming.filter((i) => i.status === "pending").length,
    terkirim: inbox.sent.filter((i) => i.status === "pending").length,
  };
  const withTeam = new Set(inbox.competitionsWithTeam);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <SectionLabel>Undangan</SectionLabel>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">Undangan tim</h1>
      </header>

      <nav aria-label="Jenis undangan">
        <ul className="inline-flex gap-0.5 rounded-md bg-surface-2 p-[3px]">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <li key={t.key}>
                <Link
                  href={t.key === "masuk" ? "/undangan" : "/undangan?tab=terkirim"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:h-9",
                    active ? "bg-surface text-primary shadow-xs" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {t.label}
                  {waiting[t.key] > 0 && (
                    <span
                      className="font-mono text-xs tabular-nums"
                      aria-label={`${waiting[t.key]} menunggu`}
                    >
                      {waiting[t.key]}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {list.length === 0 ? (
        tab === "masuk" ? (
          <EmptyState
            icon={Inbox}
            title="Belum ada undangan masuk"
            body="Tandai lomba yang kamu minati supaya ketua tim bisa menemukanmu di daftar kandidat."
            action={
              <Link href="/lomba" className={buttonClasses("secondary")}>
                Lihat lomba
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={Send}
            title="Belum ada undangan terkirim"
            body="Undang kandidat dari tab role kosong di halaman timmu."
          />
        )
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((invite) => (
            <li key={invite.id}>
              {tab === "masuk" ? (
                <IncomingInviteCard
                  invite={invite}
                  hasTeam={!!invite.competition && withTeam.has(invite.competition.id)}
                />
              ) : (
                <SentInviteCard invite={invite} />
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
