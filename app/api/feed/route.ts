import { MissingEnvError } from "@/lib/env";
import { searchYouTubeShorts, YouTubeApiErrorResponse } from "@/lib/youtube";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type FeedRequestBody = {
  query?: unknown;
  maxResults?: unknown;
};

export async function POST(request: Request) {
  let body: FeedRequestBody;

  try {
    body = (await request.json()) as FeedRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.query !== "string" || body.query.trim().length === 0) {
    return NextResponse.json({ error: "A non-empty query is required." }, { status: 400 });
  }

  const maxResults =
    typeof body.maxResults === "number" && Number.isFinite(body.maxResults)
      ? body.maxResults
      : undefined;

  try {
    const videos = await searchYouTubeShorts({
      query: body.query,
      maxResults,
    });

    return NextResponse.json({ videos });
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof YouTubeApiErrorResponse) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: "Unable to fetch YouTube Shorts." }, { status: 500 });
  }
}
