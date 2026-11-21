import { ProfileFormSkeleton } from "@/components/profile/profile-form-skeleton";

export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl">
      <ProfileFormSkeleton />
    </main>
  );
}
