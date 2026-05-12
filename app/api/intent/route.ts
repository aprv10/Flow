import { MissingEnvError } from "@/lib/env";
import { interpretVibe, VibeInterpretationError } from "@/lib/intent";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type IntentRequestBody = {
  vibe?: unknown;
};

export async function POST(request: Request) {
  let body: IntentRequestBody;

  try {
    body = (await request.json()) as IntentRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.vibe !== "string" || body.vibe.trim().length === 0) {
    return NextResponse.json({ error: "A non-empty vibe is required." }, { status: 400 });
  }

  try {
    const intent = await interpretVibe(body.vibe);

    return NextResponse.json(intent);
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof VibeInterpretationError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: "Unable to interpret vibe." }, { status: 500 });
  }
}
