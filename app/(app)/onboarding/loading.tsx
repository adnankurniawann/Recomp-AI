import { ProfileFormSkeleton } from "@/components/profile/profile-form-skeleton";

export default function OnboardingLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl">
      <ProfileFormSkeleton withSteps />
    </main>
  );
}
