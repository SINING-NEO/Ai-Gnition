import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

/**
 * LLM calls are OFF by default to avoid surprise API spend.
 * Enable only when both are set:
 *   USE_GEMINI=1
 *   GEMINI_API_KEY=...
 */
export function geminiEnabled() {
  const flag = (process.env.USE_GEMINI ?? "").trim().toLowerCase();
  const on = flag === "1" || flag === "true" || flag === "yes";
  return on && Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function hasGeminiKey() {
  return geminiEnabled();
}

export function getGemini() {
  if (!geminiEnabled()) return null;
  const apiKey = process.env.GEMINI_API_KEY!.trim();
  return new GoogleGenAI({ apiKey });
}

export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  model?: string;
}): Promise<T | null> {
  const ai = getGemini();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: opts.model ?? DEFAULT_MODEL,
      contents: opts.prompt,
      config: {
        systemInstruction: opts.system,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("[gemini]", err);
    return null;
  }
}

export async function generateText(opts: {
  system: string;
  prompt: string;
  model?: string;
}): Promise<string | null> {
  const ai = getGemini();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: opts.model ?? DEFAULT_MODEL,
      contents: opts.prompt,
      config: {
        systemInstruction: opts.system,
        temperature: 0.4,
      },
    });
    return response.text ?? null;
  } catch (err) {
    console.error("[gemini]", err);
    return null;
  }
}
