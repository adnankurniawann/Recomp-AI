import type { BrowserContext } from "@playwright/test";
import type { Student } from "../integration/supabase";

export { hasLocalDb } from "../integration/supabase";

const CHUNK = 3180; // @supabase/ssr splits longer cookies the same way

/**
 * Put a student's real Supabase session in the browser, as the auth cookie @supabase/ssr reads.
 * Tests sign in this way so they don't depend on Google; the email form on /masuk has its own test.
 */
export async function signIn(context: BrowserContext, student: Student, baseURL: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const name = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const value = `base64-${Buffer.from(JSON.stringify(student.session)).toString("base64url")}`;
  const parts =
    value.length <= CHUNK
      ? [{ name, value }]
      : (value.match(new RegExp(`.{1,${CHUNK}}`, "g")) ?? []).map((v, i) => ({
          name: `${name}.${i}`,
          value: v,
        }));

  const { hostname } = new URL(baseURL);
  await context.addCookies(
    parts.map((p) => ({ ...p, domain: hostname, path: "/", sameSite: "Lax" as const })),
  );
}
