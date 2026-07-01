import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/lib/x-bearer";
import { getUserByUsername, getUserTimeline, XApiError } from "@/lib/x-api";
import { getLatestTimeline, saveTimelineResult } from "@/lib/db";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!username) {
    const cached = getLatestTimeline();
    if (!cached) {
      return NextResponse.json({ user: null, tweets: [] });
    }
    return NextResponse.json({ user: cached.user, tweets: cached.tweets });
  }

  try {
    const accessToken = getBearerToken();
    const user = await getUserByUsername(accessToken, username);
    const tweets = await getUserTimeline(accessToken, user.id);
    saveTimelineResult(username, user, tweets);
    return NextResponse.json({ user, tweets });
  } catch (err) {
    if (err instanceof XApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
