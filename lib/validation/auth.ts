import { z } from "zod";

/** Matches `auth.minimum_password_length` in supabase/config.toml. */
export const MIN_PASSWORD = 6;

const email = z.string().trim().toLowerCase().email("Masukkan email yang valid");
const password = z
  .string()
  .min(MIN_PASSWORD, `Password minimal ${MIN_PASSWORD} karakter`)
  .max(72, "Password maksimal 72 karakter");
const next = z.string().max(500).nullish();

export const signInInput = z.object({ email, password, next });
export type SignInInput = z.input<typeof signInInput>;

export const signUpInput = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter"),
  email,
  password,
  next,
});
export type SignUpInput = z.input<typeof signUpInput>;
