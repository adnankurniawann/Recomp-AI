import { describe, expect, it, vi } from "vitest";
import { withFallback } from "./fallback";
import type { GenerateJson } from "./guidebook";

const req = (extra: object = {}) => ({
  system: "s",
  turns: [],
  jsonSchema: {},
  signal: new AbortController().signal,
  ...extra,
});
const busy = () => Object.assign(new Error("busy"), { status: 503 });
const noSleep = async () => {};

describe("withFallback", () => {
  it("moves to the next model when one is busy", async () => {
    const a: GenerateJson = vi.fn().mockRejectedValue(busy());
    const b: GenerateJson = vi.fn().mockResolvedValue("ok-b");
    await expect(withFallback([a, b], noSleep)(req())).resolves.toBe("ok-b");
    expect(a).toHaveBeenCalledTimes(1);
  });

  it("goes round the models twice, then throws the last error", async () => {
    const a: GenerateJson = vi.fn().mockRejectedValue(busy());
    const b: GenerateJson = vi.fn().mockRejectedValue(busy());
    await expect(withFallback([a, b], noSleep)(req())).rejects.toThrow("busy");
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it("stops at once on other errors", async () => {
    const a: GenerateJson = vi.fn().mockRejectedValue(new Error("bad request"));
    const b: GenerateJson = vi.fn().mockResolvedValue("ok-b");
    await expect(withFallback([a, b], noSleep)(req())).rejects.toThrow("bad request");
    expect(b).not.toHaveBeenCalled();
  });

  it("moves on when a call stalls past attemptTimeoutMs", async () => {
    const stall: GenerateJson = ({ signal }) =>
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
    const b: GenerateJson = vi.fn().mockResolvedValue("ok-b");
    await expect(withFallback([stall, b], noSleep)(req({ attemptTimeoutMs: 20 }))).resolves.toBe(
      "ok-b",
    );
  });
});
