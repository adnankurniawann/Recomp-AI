import { NextResponse, type NextRequest } from "next/server";
import { destinationAfterSignIn } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase sends the student here after Google sign-in or an email confirmation link. Swap the
 * code for a session, then go to /onboarding or `next` (F-FND-02).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const target = await destinationAfterSignIn(supabase, searchParams.get("next"));
      return NextResponse.redirect(new URL(target, request.url));
    }
    console.error("auth callback: exchange code", error.message);
  }

  return NextResponse.redirect(new URL("/masuk?error=callback", request.url));
}
