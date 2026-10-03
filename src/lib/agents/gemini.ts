import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
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
