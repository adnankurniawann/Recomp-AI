import type { GenerateJson } from "./guidebook";

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** OpenRouter names models `provider/model`; a bare Gemini name gets the `google/` prefix. */
export function openRouterModel(name: string): string {
  return name.includes("/") ? name : `google/${name}`;
}

/** Thrown for a non-2xx answer so the caller can retry 429 and 503. */
export class OpenRouterError extends Error {
  constructor(
    readonly status: number,
    body: string,
  ) {
    super(`OpenRouter ${status}: ${body.slice(0, 300)}`);
    this.name = "OpenRouterError";
  }
}

/**
 * A GenerateJson that calls Gemini through OpenRouter's OpenAI-style chat API. The JSON schema
 * goes in `response_format`, so the model answers in the same shape as the direct Gemini call.
 */
export function openRouterGenerate(opts: {
  apiKey: string;
  model: string;
  fetch?: typeof fetch;
}): GenerateJson {
  const doFetch = opts.fetch ?? fetch;
  return async ({ system, turns, jsonSchema, signal }) => {
    const res = await doFetch(OPENROUTER_URL, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Recomp AI",
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          ...turns.map((t) => ({
            role: t.role === "model" ? "assistant" : "user",
            content: t.text,
          })),
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "result", strict: true, schema: jsonSchema },
        },
      }),
    });
    if (!res.ok) throw new OpenRouterError(res.status, await res.text());
    const data = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  };
}
