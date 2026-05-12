import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Feed generation is not implemented yet.",
      requiredEnv: ["YOUTUBE_API_KEY", "LLM_API_KEY", "LLM_MODEL"],
    },
    { status: 501 },
  );
}
