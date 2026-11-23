import { describe, expect, it } from "vitest";
import { createBookingSchema } from "./booking";

const id = "00000000-0000-4000-8000-000000000101";

describe("createBookingSchema", () => {
  it("takes three uuids", () => {
    expect(createBookingSchema.safeParse({ teamId: id, serviceId: id, slotId: id }).success).toBe(
      true,
    );
  });

  it("refuses a missing or malformed id", () => {
    expect(createBookingSchema.safeParse({ teamId: id, serviceId: "x", slotId: id }).success).toBe(
      false,
    );
    expect(createBookingSchema.safeParse({ teamId: id, serviceId: id }).success).toBe(false);
  });
});
