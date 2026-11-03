import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const API_BASE = "https://api.replicate.com/v1";

// Use a known, documented text-to-video model by default.
// You only need to configure REPLICATE_API_TOKEN in .env.local.
// Override these values only if you deliberately choose another model.
const MODEL_OWNER = process.env.REPLICATE_MODEL_OWNER || "alibaba";
const MODEL_NAME = process.env.REPLICATE_MODEL_NAME || "wan-3-prime";

function getToken() {
  return process.env.REPLICATE_API_TOKEN?.trim();
}

function providerMessage(data: any, fallback: string) {
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.title === "string") return data.title;
  return fallback;
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken();

    if (!token || token === "your_replicate_api_token_here") {
      return NextResponse.json(
        {
          error:
            "Replicate API token is missing. Add REPLICATE_API_TOKEN=r8_... to .env.local in the project root, save the file, and restart npm run dev. Get a token from https://replicate.com/account/api-tokens."
        },
        { status: 500 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const duration = Number(body.duration ?? 5);
    const resolution = body.resolution ?? "720p";
    const aspectRatio = body.aspectRatio ?? "16:9";

    if (prompt.length < 5 || prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must contain between 5 and 2000 characters." },
        { status: 400 }
      );
    }

    // Wan 3.0 Prime supports 2–30 seconds.
    if (!Number.isInteger(duration) || duration < 2 || duration > 30) {
      return NextResponse.json({ error: "Duration must be from 2 to 30 seconds." }, { status: 400 });
    }

    if (!["480p", "720p", "1080p"].includes(resolution)) {
      return NextResponse.json({ error: "Choose 480p, 720p, or 1080p." }, { status: 400 });
    }

    if (!["16:9", "9:16", "1:1", "4:3", "3:4", "adaptive"].includes(aspectRatio)) {
      return NextResponse.json({ error: "Unsupported aspect ratio." }, { status: 400 });
    }

    const response = await fetch(
      `${API_BASE}/models/${encodeURIComponent(MODEL_OWNER)}/${encodeURIComponent(MODEL_NAME)}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait=1"
        },
        body: JSON.stringify({
          input: {
            prompt,
            duration,
            resolution,
            aspect_ratio: aspectRatio,
            negative_prompt: "",
            enable_prompt_expansion: true
          }
        }),
        cache: "no-store"
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerError = providerMessage(
        data,
        "Replicate could not start the video. Check your API token, model access, billing, and model input schema."
      );
      return NextResponse.json(
        {
          error:
            response.status === 401
              ? "Replicate rejected the API token. Check that REPLICATE_API_TOKEN is correct and active."
              : response.status === 402
                ? "Replicate reports a billing or payment issue. Check your Replicate account billing."
                : response.status === 429
                  ? "Replicate rate limit reached. Wait a little and try again."
                  : providerError
        },
        { status: response.status }
      );
    }

    if (!data.id) {
      return NextResponse.json(
        { error: "Replicate did not return a prediction ID. Check the model API response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ id: data.id, status: data.status }, { status: 202 });
  } catch (error) {
    console.error("Video generation start error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken();

    if (!token || token === "your_replicate_api_token_here") {
      return NextResponse.json(
        { error: "Replicate API token is missing. Configure .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "A valid prediction ID is required." }, { status: 400 });
    }

    const response = await fetch(`${API_BASE}/predictions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: providerMessage(data, "Unable to check the Replicate prediction status.") },
        { status: response.status }
      );
    }

    let videoUrl: string | null = null;
    if (data.status === "succeeded") {
      const output = data.output;
      if (typeof output === "string") {
        videoUrl = output;
      } else if (Array.isArray(output)) {
        const first = output[0];
        if (typeof first === "string") videoUrl = first;
        else if (first && typeof first.url === "string") videoUrl = first.url;
      } else if (output && typeof output.url === "string") {
        videoUrl = output.url;
      }
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      videoUrl,
      error:
        data.status === "failed" || data.status === "canceled"
          ? providerMessage(data, `Video generation ${data.status}.`)
          : null
    });
  } catch (error) {
    console.error("Video status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}
