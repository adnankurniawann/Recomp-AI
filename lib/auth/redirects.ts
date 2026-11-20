/**
 * Where a request may go, given the session (F-FND-02, PRD §11.4). Pure, so the middleware, the
 * sign-in actions and the OAuth callback share one set of rules and the rules have unit tests.
 */

/** Pages anyone can open (PRD §10.0, §11.4). Everything else needs a session. */
const PUBLIC_PATHS: RegExp[] = [
  /^\/$/,
  /^\/masuk$/,
  /^\/privasi$/,
  /^\/lomba$/,
  /^\/lomba\/[^/]+$/,
  /^\/u\/[^/]+$/,
  /^\/belajar$/,
  /^\/belajar\/[^/]+$/,
  /^\/mentor$/,
  /^\/mentor\/[^/]+$/,
];

/** Paths the middleware never redirects: route handlers answer for themselves with 401 or 403. */
const PASSTHROUGH_PATHS: RegExp[] = [/^\/api\//, /^\/auth\//];

export const SIGN_IN_PATH = "/masuk";
export const ONBOARDING_PATH = "/onboarding";
export const HOME_PATH = "/lomba";

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((re) => re.test(pathname));
}

export function isPassthroughPath(pathname: string): boolean {
  return PASSTHROUGH_PATHS.some((re) => re.test(pathname));
}

/**
 * A `next` value that is safe to redirect to: a path on this site, never another origin
 * (`//evil.com`, `/\evil.com`) and never the sign-in page itself. Anything else gives `fallback`.
 */
export function safeNext(next: string | null | undefined, fallback: string = HOME_PATH): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  const path = next.split(/[?#]/)[0];
  if (path === SIGN_IN_PATH) return fallback;
  return next;
}

/** After signing in: unfinished onboarding always wins, then `next`, then `/lomba`. */
export function afterSignInPath(onboardingDone: boolean, next?: string | null): string {
  return onboardingDone ? safeNext(next) : ONBOARDING_PATH;
}

/** `/masuk?next=/tim/baru%3Flomba%3Dx` for a request that needs a session. */
export function signInUrl(pathname: string, search: string = ""): string {
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(pathname + search)}`;
}

/** Whether the middleware has to read `profiles.onboarding_done` to decide this request. */
export function needsOnboardingFlag(pathname: string, signedIn: boolean): boolean {
  if (!signedIn || isPassthroughPath(pathname)) return false;
  return pathname === SIGN_IN_PATH || !isPublicPath(pathname);
}

export interface RouteInput {
  pathname: string;
  /** The query string with its `?`, or empty. */
  search: string;
  signedIn: boolean;
  /** Only read when `needsOnboardingFlag` is true. */
  onboardingDone: boolean;
}

/** The path to redirect to, or null to let the request through. */
export function routeRedirect({
  pathname,
  search,
  signedIn,
  onboardingDone,
}: RouteInput): string | null {
  if (isPassthroughPath(pathname)) return null;

  if (!signedIn) {
    return isPublicPath(pathname) ? null : signInUrl(pathname, search);
  }

  if (pathname === SIGN_IN_PATH) {
    return afterSignInPath(onboardingDone, new URLSearchParams(search).get("next"));
  }

  if (pathname === ONBOARDING_PATH) return onboardingDone ? HOME_PATH : null;

  // Signed in without a finished profile: app pages wait until onboarding is done (PRD §11.4).
  if (!onboardingDone && !isPublicPath(pathname)) return ONBOARDING_PATH;

  return null;
}
