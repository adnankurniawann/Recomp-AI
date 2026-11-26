import "server-only";
import { GoogleGenAI } from "@google/genai";
import { withFallback } from "./fallback";
import type { GenerateJson } from "./guidebook";
import { openRouterGenerate, openRouterModel } from "./openrouter";

/**
 * Used when GEMINI_MODEL is empty. Google often answers 503 or 429 for one Flash model while
 * another still works (checked 26 Nov 2026), so there are two. GEMINI_MODEL takes a
 * comma-separated list to override, tried in order.
 */
export const DEFAULT_GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];

/**
 * The Gemini client, or null when AI is off: no key, or DEMO_MODE=true (ADR 0006). With
 * OPENROUTER_API_KEY set, Gemini is called through OpenRouter; otherwise GEMINI_API_KEY calls
 * Google directly. Server only, so the key never reaches the browser (PRD §8.4).
 */
export function getGemini(): { model: string; generateJson: GenerateJson } | null {
  if (process.env.DEMO_MODE === "true") return null;
  const fromEnv = (process.env.GEMINI_MODEL ?? "").split(",").map((m) => m.trim());
  const names = fromEnv.some(Boolean) ? fromEnv.filter(Boolean) : DEFAULT_GEMINI_MODELS;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const models = names.map(openRouterModel);
    return {
      model: models[0]!,
      generateJson: withFallback(
        models.map((model) => openRouterGenerate({ apiKey: openRouterKey, model })),
      ),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const generate =
    (name: string): GenerateJson =>
    async ({ system, turns, jsonSchema, signal }) => {
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
    };

  return { model: names[0]!, generateJson: withFallback(names.map(generate)) };
}
