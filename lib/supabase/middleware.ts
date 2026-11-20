import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { needsOnboardingFlag, routeRedirect } from "@/lib/auth/redirects";
import type { Database } from "./types";

/**
 * Refresh the Supabase session cookie on every request, then apply the sign-in and onboarding
 * redirects (F-FND-02). Reads `profiles.onboarding_done` only when the redirect depends on it.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Before Supabase is configured the app still renders its public pages.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser, not getSession: it checks the token with Supabase Auth instead of trusting the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  let onboardingDone = false;
  if (user && needsOnboardingFlag(pathname, true)) {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_done")
      .eq("user_id", user.id)
      .maybeSingle();
    onboardingDone = data?.onboarding_done ?? false;
  }

  const target = routeRedirect({ pathname, search, signedIn: !!user, onboardingDone });
  if (!target) return response;

  const redirect = NextResponse.redirect(new URL(target, request.url));
  // Keep the refreshed session cookies on the redirect too.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}
