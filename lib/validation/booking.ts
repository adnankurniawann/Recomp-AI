import { z } from "zod";
import { uuid } from "./common";

/** `createBooking` input (PRD §13.1, F-MNT-03). */
export const createBookingSchema = z.object({ teamId: uuid, serviceId: uuid, slotId: uuid });
export type CreateBookingInput = z.input<typeof createBookingSchema>;
