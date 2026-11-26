import type { GenerateJson } from "./guidebook";

/** Waits before the next try after a busy model (503), a rate limit (429) or a stalled call. */
export const FALLBACK_DELAYS_MS = [1_000, 3_000, 3_000];

/** 503 and 429 from Google or OpenRouter: the model is busy, so another model may answer. */
export function isBusy(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  return status === 503 || status === 429;
}

/**
 * Tries each model in turn, twice round, moving on when one is busy or (with
 * `attemptTimeoutMs`) stalls. Any other error, or the caller's own timeout, stops at once.
 */
export function withFallback(
  generators: GenerateJson[],
  sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
): GenerateJson {
  const order = [...generators, ...generators];
  return async (req) => {
    for (let i = 0; ; i++) {
      const attempt = req.attemptTimeoutMs
        ? AbortSignal.any([req.signal, AbortSignal.timeout(req.attemptTimeoutMs)])
        : req.signal;
      try {
        return await order[i]!({ ...req, signal: attempt });
      } catch (err) {
        const stalled = attempt.aborted && !req.signal.aborted;
        if (req.signal.aborted || !(isBusy(err) || stalled) || i === order.length - 1) throw err;
        await sleep(FALLBACK_DELAYS_MS[Math.min(i, FALLBACK_DELAYS_MS.length - 1)]!);
      }
    }
  };
}
