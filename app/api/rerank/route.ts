import { MissingEnvError } from "@/lib/env";
import { rerankVideos, RerankError } from "@/lib/rerank";
import type { VibeIntent, YoutubeShort } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RerankRequestBody = {
  vibe?: unknown;
  intent?: unknown;
  videos?: unknown;
  maxResults?: unknown;
};

export async function POST(request: Request) {
  let body: RerankRequestBody;

  try {
    body = (await request.json()) as RerankRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.vibe !== "string" || body.vibe.trim().length === 0) {
    return NextResponse.json({ error: "A non-empty vibe is required." }, { status: 400 });
  }

  if (!isVibeIntent(body.intent)) {
    return NextResponse.json({ error: "A valid interpreted intent is required." }, { status: 400 });
  }

  if (!Array.isArray(body.videos)) {
    return NextResponse.json({ error: "A videos array is required." }, { status: 400 });
  }

  const videos = body.videos.filter(isYoutubeShort);
  const maxResults =
    typeof body.maxResults === "number" && Number.isFinite(body.maxResults)
      ? body.maxResults
      : undefined;

  try {
    const rankedVideos = await rerankVideos({
      vibe: body.vibe,
      intent: body.intent,
      videos,
      maxResults,
    });

    return NextResponse.json({ videos: rankedVideos });
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof RerankError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: "Unable to rerank videos." }, { status: 500 });
  }
}

function isVibeIntent(value: unknown): value is VibeIntent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.topics) &&
    Array.isArray(value.tone) &&
    typeof value.pacing === "string" &&
    typeof value.emotionalEnergy === "string" &&
    typeof value.intellectualDepth === "string" &&
    Array.isArray(value.antiSignals) &&
    Array.isArray(value.searchQueries) &&
    Array.isArray(value.rerankGuidance)
  );
}

function isYoutubeShort(value: unknown): value is YoutubeShort {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.channel === "string" &&
    typeof value.thumbnail === "string" &&
    typeof value.videoId === "string" &&
    typeof value.description === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
