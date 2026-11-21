import "server-only";
import { headers } from "next/headers";
import type { createClient } from "@/lib/supabase/server";
import { afterSignInPath } from "./redirects";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Where the signed-in student goes next: /onboarding until the profile is done (F-FND-02). */
export async function destinationAfterSignIn(
  supabase: Supabase,
  next: string | null | undefined,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/masuk";

  const { data } = await supabase
    .from("profiles")
    .select("onboarding_done")
    .eq("user_id", user.id)
    .maybeSingle();
  return afterSignInPath(data?.onboarding_done ?? false, next);
}

/** This site's origin, for OAuth and email links: the request's own, then NEXT_PUBLIC_APP_URL. */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
