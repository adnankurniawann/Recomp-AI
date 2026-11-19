import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  FileText,
  GraduationCap,
  ListOrdered,
  Send,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { HeroPreview } from "@/components/landing/hero-preview";
import { StepCard } from "@/components/landing/step-card";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionLabel } from "@/components/ui/section-label";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { loadViewer } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Recomp AI · Tim lomba yang pas" };

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";
const h2 =
  "text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-strong";

const steps = [
  {
    icon: Trophy,
    title: "Pilih lomba",
    body: "Cari lomba yang mau kamu ikuti, lalu buat tim untuk lomba itu.",
  },
  {
    icon: FileText,
    title: "AI baca guidebook",
    body: "AI membaca guidebook dan kriteria penilaian, lalu mengusulkan role. Kamu tetap bisa mengubahnya.",
  },
  {
    icon: ListOrdered,
    title: "Lihat ranking",
    body: "Kandidat tiap role diurutkan algoritma, lengkap dengan alasan skornya.",
  },
  {
    icon: Send,
    title: "Undang",
    body: "Undang kandidat yang cocok. Kontaknya baru terbuka setelah undangan diterima.",
  },
];

const features: { icon: typeof Users; title: string; body: string; preview: ReactNode }[] = [
  {
    icon: Users,
    title: "Matching per role",
    body: "Skor dihitung algoritma dari skill, level, waktu, dan pengalaman. Bukan AI.",
    preview: (
      <div className="flex flex-wrap gap-1.5">
        <Chip color="uiux">UI/UX</Chip>
        <Chip color="backend">Backend</Chip>
        <Chip color="product">Pitching</Chip>
      </div>
    ),
  },
  {
    icon: FileText,
    title: "Ringkasan guidebook",
    body: "Poin penting dan kriteria penilaian lomba dalam satu halaman.",
    preview: (
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge tone="primary">Dibuat AI</StatusBadge>
        <StatusBadge>Desain 20% · hal. 7</StatusBadge>
      </div>
    ),
  },
  {
    icon: BookOpen,
    title: "Modul belajar",
    body: "Kursus singkat dengan soal latihan untuk persiapan lomba.",
    preview: <ProgressBar value={3} max={8} label="Persiapan Hackathon · 3/8 materi" />,
  },
  {
    icon: GraduationCap,
    title: "Mentor",
    body: "Konsultasi dengan mentor sesuai role yang timmu butuhkan.",
    preview: (
      <div className="flex items-center gap-2">
        <Avatar name="Mentor UI/UX" colorKey="uiux" size={28} />
        <span className="text-sm text-ink-2">Mentor UI/UX</span>
        <SimulatedBadge />
      </div>
    ),
  },
];

export default async function LandingPage() {
  const viewer = await loadViewer();
  const startHref = viewer ? "/lomba" : "/masuk";

  return (
    <main>
      <section
        className={`${container} flex flex-col items-center gap-5 pt-16 pb-10 text-center sm:pt-20`}
      >
        <p className="inline-flex items-center gap-2 text-sm text-ink">
          <span aria-hidden className="size-3 rounded-xs bg-role-product" />
          Untuk hackathon dan lomba IT di kampus
        </p>
        <h1 className="max-w-[900px] text-[clamp(2.5rem,6vw,4rem)] leading-[1.05] font-semibold tracking-[-0.037em] text-balance text-ink-strong">
          Tim lomba yang <span className="text-primary">pas</span>, dibaca langsung dari guidebook
        </h1>
        <p className="max-w-[560px] text-lg leading-[1.6] text-ink-2">
          AI mengusulkan role dari kriteria penilaian. Kandidat diurutkan algoritma, lengkap dengan
          alasannya.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2.5">
          <Link href={startHref} className={buttonClasses("primary", "lg")}>
            Mulai cari tim
            <ArrowRight aria-hidden size={16} strokeWidth={1.75} />
          </Link>
          <Link href="/lomba" className={buttonClasses("secondary", "lg")}>
            Lihat lomba
          </Link>
        </div>
      </section>

      <div className={container}>
        <div className="rounded-t-2xl bg-linear-to-b from-wash to-bg px-3 pt-6 sm:px-12 sm:pt-10">
          <HeroPreview />
        </div>
      </div>

      <section id="cara-kerja" className={`${container} flex flex-col gap-6 py-16 sm:py-20`}>
        <div className="flex flex-col gap-2">
          <SectionLabel>Cara kerja</SectionLabel>
          <h2 className={h2}>Empat langkah menuju tim lengkap</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <StepCard key={s.title} number={i + 1} {...s} />
          ))}
        </div>
      </section>

      <section className={`${container} flex flex-col gap-6 pb-16 sm:pb-20`}>
        <div className="flex flex-col gap-2">
          <SectionLabel>Fitur</SectionLabel>
          <h2 className={h2}>Dari cari anggota sampai siap tanding</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body, preview }) => (
            <Card key={title} padding="lg" className="flex flex-col gap-3">
              <Icon aria-hidden size={18} strokeWidth={1.75} className="text-primary-hover" />
              <h3 className="text-lg leading-[1.35] font-semibold tracking-[-0.01em] text-ink-strong">
                {title}
              </h3>
              <p className="text-sm leading-[1.6] text-ink-2">{body}</p>
              <div className="mt-auto border-t border-line pt-4">{preview}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className={`${container} flex flex-col gap-6 pb-16 sm:pb-20`}>
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <SectionLabel>Lomba terdekat</SectionLabel>
            <h2 className={h2}>Segera ditutup</h2>
          </div>
          <Link
            href="/lomba"
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-primary hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
          >
            Lihat semua
            <ArrowRight aria-hidden size={16} strokeWidth={1.75} />
          </Link>
        </div>
        {/* shortcut: CompetitionCard (#16) and the seeded competitions (#8) replace this. */}
        <EmptyState
          icon={CalendarClock}
          title="Daftar lomba segera hadir"
          body="Lomba yang dibuka akan muncul di sini."
        />
      </section>

      <section className={`${container} pb-16 sm:pb-20`}>
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-wash px-6 py-14 text-center">
          <h2 className={`${h2} max-w-[640px] text-balance`}>
            Lombanya sudah ada. Timnya tinggal kamu lengkapi.
          </h2>
          {/* accent, not primary: the hero already has the page's filled button. */}
          <Link href={startHref} className={buttonClasses("accent", "lg")}>
            Mulai sekarang
          </Link>
        </div>
      </section>
    </main>
  );
}
