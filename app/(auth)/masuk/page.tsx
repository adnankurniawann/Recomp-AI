import type { Metadata } from "next";
import { SignInCard } from "@/components/auth/sign-in-card";

export const metadata: Metadata = { title: "Masuk · Recomp AI" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:py-20">
      <SignInCard next={next} callbackFailed={params.error === "callback"} />
    </main>
  );
}
