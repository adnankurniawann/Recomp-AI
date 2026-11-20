"use server";

import { revalidatePath } from "next/cache";
import { fail, failFromDb, ok, type ActionResult } from "@/lib/action-result";
import { saveProfileStep, type SavedStep } from "@/lib/profile/save";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";
import { uuid } from "@/lib/validation/common";
import type { OnboardingStep } from "@/lib/validation/profile";
import { checkImage } from "@/lib/validation/upload";

/** Save one /profil tab. The tabs are the onboarding steps, so they share one validator and writer (F-PRF-07). */
export async function saveProfileSection(
  step: OnboardingStep,
  data: unknown,
): Promise<ActionResult<SavedStep>> {
  return saveProfileStep(step, data);
}

/** The student's own portfolio item, read under RLS. Null when it isn't theirs or doesn't exist. */
async function ownPortfolioItem(portfolioId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { failed: fail<never>("AUTH_REQUIRED") } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return { failed: fail<never>("NOT_FOUND") } as const;

  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id, cover_path")
    .eq("id", portfolioId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!item) return { failed: fail<never>("NOT_FOUND") } as const;

  return { failed: null, supabase, profileId: profile.id, item } as const;
}

/**
 * Upload or replace a portfolio cover (PRD F-PRF-04): JPG, PNG or WebP up to 2 MB, checked here
 * before Storage checks it again. Files go to `portfolio/<profile_id>/`, the folder the Storage
 * policy lets the owner write (migration 0003).
 */
export async function uploadPortfolioCover(
  formData: FormData,
): Promise<ActionResult<{ coverUrl: string | null }>> {
  const id = uuid.safeParse(formData.get("portfolioId"));
  const file = formData.get("file");
  if (!id.success || !(file instanceof File)) return fail("VALIDATION");

  const image = checkImage(file);
  if (!image.ok) return fail(image.code, image.message);

  const own = await ownPortfolioItem(id.data);
  if (own.failed) return own.failed;
  const { supabase, profileId, item } = own;

  const path = `${profileId}/${item.id}-${Date.now()}.${image.ext}`;
  const upload = await supabase.storage
    .from("portfolio")
    .upload(path, file, { contentType: image.type, upsert: false });
  if (upload.error) {
    console.error("[portfolio cover]", upload.error.message);
    return fail("UNKNOWN", "Gambar belum bisa diunggah. Coba lagi sebentar lagi.");
  }

  const { error } = await supabase
    .from("portfolio_items")
    .update({ cover_path: path })
    .eq("id", item.id);
  if (error) {
    await supabase.storage.from("portfolio").remove([path]);
    return failFromDb(error);
  }

  if (item.cover_path) await supabase.storage.from("portfolio").remove([item.cover_path]);
  revalidatePath("/profil");
  return ok({ coverUrl: publicStorageUrl("portfolio", path) });
}

/** Remove a portfolio cover; the card goes back to the coloured cover for its link. */
export async function removePortfolioCover(
  portfolioId: string,
): Promise<ActionResult<{ coverUrl: null }>> {
  const id = uuid.safeParse(portfolioId);
  if (!id.success) return fail("VALIDATION");

  const own = await ownPortfolioItem(id.data);
  if (own.failed) return own.failed;
  const { supabase, item } = own;
  if (!item.cover_path) return ok({ coverUrl: null });

  const { error } = await supabase
    .from("portfolio_items")
    .update({ cover_path: null })
    .eq("id", item.id);
  if (error) return failFromDb(error);

  await supabase.storage.from("portfolio").remove([item.cover_path]);
  revalidatePath("/profil");
  return ok({ coverUrl: null });
}
