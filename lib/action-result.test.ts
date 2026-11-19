import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ERROR_MESSAGES, fail, failFromDb, failValidation, ok } from "./action-result";

describe("ActionResult helpers", () => {
  it("wraps data", () => {
    expect(ok({ step: 2 })).toEqual({ ok: true, data: { step: 2 } });
  });

  it("uses the default Indonesian message for a code", () => {
    expect(fail("USERNAME_TAKEN")).toEqual({
      ok: false,
      error: { code: "USERNAME_TAKEN", message: ERROR_MESSAGES.USERNAME_TAKEN },
    });
  });

  it("maps Zod issues to one message per field", () => {
    const result = z
      .object({
        name: z.string().min(2, "Terlalu pendek"),
        tags: z.array(z.string().min(1, "Kosong")),
      })
      .safeParse({ name: "a", tags: ["ok", ""] });
    const failed = failValidation(result.error!.issues);
    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.error.code).toBe("VALIDATION");
      expect(failed.error.fields).toEqual({ name: "Terlalu pendek", "tags.1": "Kosong" });
    }
  });
});

describe("failFromDb", () => {
  const code = (r: ReturnType<typeof failFromDb>) => (r.ok ? null : r.error.code);

  it("passes through a known code raised by a SQL function", () => {
    expect(code(failFromDb({ code: "P0001", message: "MIN_SKILLS" }))).toBe("MIN_SKILLS");
  });

  it("hides an unknown raise message behind UNKNOWN", () => {
    expect(code(failFromDb({ code: "P0001", message: "something internal" }))).toBe("UNKNOWN");
    expect(code(failFromDb({ code: "P0001", message: "toString" }))).toBe("UNKNOWN");
  });

  it("maps constraint and permission errors", () => {
    expect(code(failFromDb({ code: "23514", message: "check" }))).toBe("VALIDATION");
    expect(code(failFromDb({ code: "23503", message: "fk" }))).toBe("VALIDATION");
    expect(code(failFromDb({ code: "42501", message: "rls" }))).toBe("FORBIDDEN");
    expect(code(failFromDb({ message: "network" }))).toBe("UNKNOWN");
  });
});
