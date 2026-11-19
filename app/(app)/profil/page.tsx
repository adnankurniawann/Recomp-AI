import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { loadOwnProfile, loadSkillCatalog } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Profil · Recomp AI" };

export default async function ProfilePage() {
  const own = await loadOwnProfile();
  if (!own) redirect("/masuk?next=/profil");
  if (!own.profile.onboarding_done) redirect("/onboarding");

  const catalog = await loadSkillCatalog();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">Akun</p>
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-strong">
          Profil
        </h1>
        <p className="text-ink-2">
          Ubah data yang dilihat ketua tim. Simpan tiap bagian secara terpisah.
        </p>
      </header>
      <ProfileEditor
        initialValues={own.values}
        avatarUrl={own.profile.avatar_url}
        loginEmail={own.loginEmail}
        skills={catalog.skills}
        templates={catalog.templates}
      />
    </main>
  );
}
