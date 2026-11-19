import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import type { GenerateJson } from "./guidebook";

/**
 * Used when GEMINI_MODEL is empty: the newest Flash model Google offers new keys (checked
 * 19 Nov 2026; older Flash models are closed to new users). Set GEMINI_MODEL to override.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/** Waits before retrying a busy model (503) or a rate limit (429). */
const RETRY_DELAYS_MS = [1_500, 4_000];

/**
 * The Gemini client, or null when AI is off: no GEMINI_API_KEY, or DEMO_MODE=true (ADR 0006).
 * Server only, so the key never reaches the browser (PRD §8.4).
 */
export function getGemini(): { model: string; generateJson: GenerateJson } | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.DEMO_MODE === "true") return null;

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  return {
    model,
    generateJson: async ({ system, turns, jsonSchema, signal }) => {
      for (let attempt = 0; ; attempt++) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
            config: {
              systemInstruction: system,
              responseMimeType: "application/json",
              responseJsonSchema: jsonSchema,
              temperature: 0.2,
              abortSignal: signal,
            },
          });
          return res.text ?? "";
        } catch (err) {
          const busy = err instanceof ApiError && (err.status === 503 || err.status === 429);
          const delay = RETRY_DELAYS_MS[attempt];
          if (!busy || delay === undefined || signal.aborted) throw err;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    },
  };
}
