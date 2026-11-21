"use server";

import { redirect } from "next/navigation";
import { fail, failValidation, ok, type ActionResult } from "@/lib/action-result";
import { safeNext } from "@/lib/auth/redirects";
import { destinationAfterSignIn, siteOrigin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { signInInput, signUpInput } from "@/lib/validation/auth";

function callbackUrl(origin: string, next: string | null | undefined) {
  const url = new URL("/auth/callback", origin);
  if (next) url.searchParams.set("next", safeNext(next));
  return url.toString();
}

/** Start Google sign-in. The browser goes to the returned URL; Supabase brings it back to /auth/callback. */
export async function signInWithGoogle(
  next?: string | null,
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(await siteOrigin(), next) },
  });
  if (error || !data.url) {
    console.error("sign in google", error?.message);
    return fail("PROVIDER_DISABLED");
  }
  return ok({ url: data.url });
}

/** Email and password sign-in, for students without Google and the demo accounts (PRD §15). */
export async function signInWithEmail(input: unknown): Promise<ActionResult<{ redirect: string }>> {
  const parsed = signInInput.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if (error.code === "invalid_credentials") return fail("INVALID_CREDENTIALS");
    if (error.code === "email_not_confirmed") {
      return fail("AUTH_REQUIRED", "Konfirmasi emailmu dulu lewat tautan yang kami kirim.");
    }
    console.error("sign in email", error.message);
    return fail("UNKNOWN");
  }

  return ok({ redirect: await destinationAfterSignIn(supabase, parsed.data.next) });
}

/**
 * Create an account with email and password. `handle_new_user` makes the profile row. When the
 * project asks for email confirmation, there is no session yet and the student checks their inbox.
 */
export async function signUpWithEmail(
  input: unknown,
): Promise<ActionResult<{ redirect: string | null }>> {
  const parsed = signUpInput.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: callbackUrl(await siteOrigin(), parsed.data.next),
    },
  });
  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return fail("EMAIL_TAKEN");
    }
    if (error.code === "weak_password") {
      return fail("VALIDATION", "Password terlalu lemah. Coba yang lebih panjang.", {
        password: "Password terlalu lemah",
      });
    }
    console.error("sign up email", error.message);
    return fail("UNKNOWN");
  }

  // With confirmation on, an existing email comes back with no identities instead of an error.
  if (data.user && data.user.identities?.length === 0) return fail("EMAIL_TAKEN");

  return ok({ redirect: data.session ? "/onboarding" : null });
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
