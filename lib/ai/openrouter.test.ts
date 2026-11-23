import { describe, expect, it, vi } from "vitest";
import { OPENROUTER_URL, OpenRouterError, openRouterGenerate, openRouterModel } from "./openrouter";

describe("openRouterModel", () => {
  it("prefixes a bare Gemini name with google/", () => {
    expect(openRouterModel("gemini-3.8-flash")).toBe("google/gemini-3.8-flash");
  });
  it("keeps a name that already has a provider", () => {
    expect(openRouterModel("google/gemini-3.8-flash")).toBe("google/gemini-3.8-flash");
  });
});

describe("openRouterGenerate", () => {
  const req = {
    system: "sys",
    turns: [
      { role: "user" as const, text: "a" },
      { role: "model" as const, text: "b" },
      { role: "user" as const, text: "c" },
    ],
    jsonSchema: { type: "object" },
    signal: new AbortController().signal,
  };

  it("sends the chat body and returns the message text", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ choices: [{ message: { content: '{"ok":true}' } }] }),
    );
    const generate = openRouterGenerate({ apiKey: "k", model: "google/x", fetch: fetchMock });
    await expect(generate(req)).resolves.toBe('{"ok":true}');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(OPENROUTER_URL);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer k");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("google/x");
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual([
      "system",
      "user",
      "assistant",
      "user",
    ]);
    expect(body.response_format.json_schema.schema).toEqual({ type: "object" });
  });

  it("throws OpenRouterError with the status on a non-2xx answer", async () => {
    const fetchMock = vi.fn(async () => new Response("busy", { status: 429 }));
    const generate = openRouterGenerate({ apiKey: "k", model: "m", fetch: fetchMock });
    await expect(generate(req)).rejects.toMatchObject({ status: 429 });
    await expect(generate(req)).rejects.toBeInstanceOf(OpenRouterError);
  });
});
