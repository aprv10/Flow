import { Mistral } from "@mistralai/mistralai";
import { getRequiredEnv } from "@/lib/env";
import type { VibeIntent } from "@/lib/types";

const MISTRAL_MODEL = "mistral-small-latest";

const SYSTEM_PROMPT =
  "Return compact JSON only. Interpret a YouTube Shorts feed request into retrieval intent. Keys: topics,tone,pacing,emotionalEnergy,intellectualDepth,antiSignals,searchQueries,rerankGuidance. Arrays max 6; searchQueries max 5, concise YouTube queries.";

export class VibeInterpretationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VibeInterpretationError";
  }
}

export async function interpretVibe(vibe: string): Promise<VibeIntent> {
  const normalizedVibe = vibe.trim();

  if (!normalizedVibe) {
    throw new VibeInterpretationError("A non-empty vibe is required.");
  }

  const mistral = new Mistral({
    apiKey: getRequiredEnv("MISTRAL_API_KEY"),
  });

  const response = await mistral.chat.complete({
    model: MISTRAL_MODEL,
    temperature: 0.2,
    maxTokens: 360,
    responseFormat: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Request: ${normalizedVibe}`,
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;

  return parseIntent(getTextContent(content));
}

function getTextContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  throw new VibeInterpretationError("Mistral returned an unsupported response format.");
}

function parseIntent(content: string): VibeIntent {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new VibeInterpretationError("Mistral returned invalid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new VibeInterpretationError("Mistral returned an invalid intent object.");
  }

  return {
    topics: toStringArray(parsed.topics),
    tone: toStringArray(parsed.tone),
    pacing: toStringValue(parsed.pacing),
    emotionalEnergy: toStringValue(parsed.emotionalEnergy),
    intellectualDepth: toStringValue(parsed.intellectualDepth),
    antiSignals: toStringArray(parsed.antiSignals),
    searchQueries: toStringArray(parsed.searchQueries),
    rerankGuidance: toStringArray(parsed.rerankGuidance),
  };
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").slice(0, 6);
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
