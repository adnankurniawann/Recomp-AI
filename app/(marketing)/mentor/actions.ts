"use server";

import { revalidatePath } from "next/cache";
import { fail, failFromDb, failValidation, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/common";
import { createBookingSchema, type CreateBookingInput } from "@/lib/validation/booking";

// Mentor booking and the simulated payment (PRD §13.1, F-MNT-03). The rules live in the SQL
// functions of migration 0011; these validate input, call them as the student and map the error.

/** Books a slot for the team; the booking waits for payment (`create_booking`). */
export async function createBooking(
  input: CreateBookingInput,
): Promise<ActionResult<{ bookingId: string }>> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_team: parsed.data.teamId,
    p_service: parsed.data.serviceId,
    p_slot: parsed.data.slotId,
  });
  if (error) {
    if (error.code !== "P0001") console.error("[booking]", error.code, error.message);
    return failFromDb(error);
  }
  return ok({ bookingId: data });
}

/** Pays the booking, simulated: no money moves (`simulate_booking_payment`, ADR 0005). */
export async function simulatePayment(
  bookingId: string,
): Promise<ActionResult<{ status: "paid"; teamId: string }>> {
  const parsed = uuid.safeParse(bookingId);
  if (!parsed.success) return fail("VALIDATION");

  const supabase = await createClient();
  const { error } = await supabase.rpc("simulate_booking_payment", { p_booking: parsed.data });
  if (error) {
    if (error.code !== "P0001") console.error("[booking payment]", error.code, error.message);
    return failFromDb(error);
  }
  const { data: booking } = await supabase
    .from("bookings")
    .select("team_id, mentor_id")
    .eq("id", parsed.data)
    .single();
  if (booking) {
    revalidatePath(`/tim/${booking.team_id}`);
    revalidatePath(`/mentor/${booking.mentor_id}`);
  }
  return ok({ status: "paid", teamId: booking?.team_id ?? "" });
}
