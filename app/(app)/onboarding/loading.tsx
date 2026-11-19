import { ProfileFormSkeleton } from "@/components/profile/profile-form-skeleton";

export default function OnboardingLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <ProfileFormSkeleton withSteps />
    </main>
  );
}
