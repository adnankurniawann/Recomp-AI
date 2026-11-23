import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import type { GenerateJson } from "./guidebook";
import { OpenRouterError, openRouterGenerate, openRouterModel } from "./openrouter";

/**
 * Used when GEMINI_MODEL is empty: the newest Flash model Google offers new keys (checked
 * 19 Nov 2026; older Flash models are closed to new users). Set GEMINI_MODEL to override.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/** Waits before retrying a busy model (503) or a rate limit (429). */
const RETRY_DELAYS_MS = [1_500, 4_000];

function isBusy(err: unknown): boolean {
  const status = err instanceof ApiError || err instanceof OpenRouterError ? err.status : undefined;
  return status === 503 || status === 429;
}

function withRetry(generate: GenerateJson): GenerateJson {
  return async (req) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await generate(req);
      } catch (err) {
        const delay = RETRY_DELAYS_MS[attempt];
        if (!isBusy(err) || delay === undefined || req.signal.aborted) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };
}

/**
 * The Gemini client, or null when AI is off: no key, or DEMO_MODE=true (ADR 0006). With
 * OPENROUTER_API_KEY set, Gemini is called through OpenRouter; otherwise GEMINI_API_KEY calls
 * Google directly. Server only, so the key never reaches the browser (PRD §8.4).
 */
export function getGemini(): { model: string; generateJson: GenerateJson } | null {
  if (process.env.DEMO_MODE === "true") return null;
  const name = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const model = openRouterModel(name);
    return {
      model,
      generateJson: withRetry(openRouterGenerate({ apiKey: openRouterKey, model })),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });

  return {
    model: name,
    generateJson: withRetry(async ({ system, turns, jsonSchema, signal }) => {
      const res = await ai.models.generateContent({
        model: name,
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
    }),
  };
}
