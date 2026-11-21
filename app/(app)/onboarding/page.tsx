import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/profile/onboarding-wizard";
import { resumeStep } from "@/lib/profile/progress";
import { loadOwnProfile, loadSkillCatalog } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Lengkapi profil · Recomp AI" };

export default async function OnboardingPage() {
  const own = await loadOwnProfile();
  if (!own) redirect("/masuk?next=/onboarding");
  if (own.profile.onboarding_done) redirect("/lomba");

  const catalog = await loadSkillCatalog();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">Onboarding</p>
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-strong">
          Lengkapi profilmu
        </h1>
        <p className="text-lg leading-relaxed text-ink-2">
          Profil ini dipakai untuk mencocokkanmu dengan role yang dibutuhkan tim. Isianmu tersimpan
          tiap langkah.
        </p>
      </header>
      <OnboardingWizard
        initialStep={resumeStep(own.saved)}
        initialValues={own.values}
        avatarUrl={own.profile.avatar_url}
        skills={catalog.skills}
        templates={catalog.templates}
      />
    </main>
  );
}
