import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { GenerateJson } from "./guidebook";

/** Used when GEMINI_MODEL is empty: Google's alias for the newest Flash model. */
export const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";

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
    },
  };
}
