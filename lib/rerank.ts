import { Mistral } from "@mistralai/mistralai";
import { getRequiredEnv } from "@/lib/env";
import type { RerankedVideo, VibeIntent, YoutubeShort } from "@/lib/types";

const MISTRAL_MODEL = "mistral-small-latest";
const MAX_CANDIDATES = 30;
const DEFAULT_RESULT_LIMIT = 10;
const SYSTEM_PROMPT =
  "Return compact JSON only: {\"ranked\":[{\"videoId\":\"\",\"score\":0,\"reason\":\"\"}]}. Rank YouTube Shorts for the user's vibe. Prioritize tone, intellectual fit, pacing, sincerity, creator energy, depth over hype. Penalize generic productivity, bait, hype unless requested. Reasons: one sentence max.";

type RerankOptions = {
  vibe: string;
  intent: VibeIntent;
  videos: YoutubeShort[];
  maxResults?: number;
};

type RankedCandidate = {
  videoId: string;
  score: number;
  reason: string;
};

export class RerankError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RerankError";
  }
}

export async function rerankVideos({
  vibe,
  intent,
  videos,
  maxResults = DEFAULT_RESULT_LIMIT,
}: RerankOptions): Promise<RerankedVideo[]> {
  const normalizedVibe = vibe.trim();

  if (!normalizedVibe) {
    throw new RerankError("A non-empty vibe is required.");
  }

  const candidates = dedupeVideos(videos).slice(0, MAX_CANDIDATES);

  if (candidates.length === 0) {
    return [];
  }

  const resultLimit = clamp(Math.floor(maxResults), 1, candidates.length);
  const mistral = new Mistral({
    apiKey: getRequiredEnv("MISTRAL_API_KEY"),
  });

  const response = await mistral.chat.complete({
    model: MISTRAL_MODEL,
    temperature: 0.1,
    maxTokens: 640,
    responseFormat: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify({
          vibe: normalizedVibe,
          intent: compactIntent(intent),
          limit: resultLimit,
          videos: candidates.map(compactVideo),
        }),
      },
    ],
  });

  const ranked = parseRankedCandidates(getTextContent(response.choices?.[0]?.message?.content));
  const videosById = new Map(candidates.map((video) => [video.videoId, video]));

  return ranked
    .map((candidate) => {
      const video = videosById.get(candidate.videoId);

      if (!video) {
        return null;
      }

      return {
        ...video,
        matchScore: clamp(Math.round(candidate.score), 0, 100),
        reason: toOneSentence(candidate.reason),
      };
    })
    .filter((video): video is RerankedVideo => Boolean(video))
    .slice(0, resultLimit);
}

function compactIntent(intent: VibeIntent) {
  return {
    topics: intent.topics.slice(0, 5),
    tone: intent.tone.slice(0, 5),
    pacing: intent.pacing,
    energy: intent.emotionalEnergy,
    depth: intent.intellectualDepth,
    avoid: intent.antiSignals.slice(0, 5),
    guidance: intent.rerankGuidance.slice(0, 5),
  };
}

function compactVideo(video: YoutubeShort) {
  return {
    id: video.videoId,
    title: truncate(video.title, 110),
    channel: truncate(video.channel, 60),
    desc: truncate(video.description, 180),
  };
}

function parseRankedCandidates(content: string): RankedCandidate[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new RerankError("Mistral returned invalid JSON.");
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.ranked)) {
    throw new RerankError("Mistral returned an invalid rerank object.");
  }

  return parsed.ranked
    .filter(isRankedCandidate)
    .map((candidate) => ({
      videoId: candidate.videoId,
      score: candidate.score,
      reason: candidate.reason,
    }));
}

function isRankedCandidate(value: unknown): value is RankedCandidate {
  return (
    isRecord(value) &&
    typeof value.videoId === "string" &&
    typeof value.score === "number" &&
    Number.isFinite(value.score) &&
    typeof value.reason === "string"
  );
}

function getTextContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  throw new RerankError("Mistral returned an unsupported response format.");
}

function dedupeVideos(videos: YoutubeShort[]) {
  const seen = new Set<string>();
  const deduped: YoutubeShort[] = [];

  for (const video of videos) {
    if (!video.videoId || seen.has(video.videoId)) {
      continue;
    }

    seen.add(video.videoId);
    deduped.push(video);
  }

  return deduped;
}

function toOneSentence(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/);

  return match?.[0].trim() ?? trimmed;
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.replace(/\s+/g, " ").trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
