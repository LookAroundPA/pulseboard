import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/lib/x-bearer";
import { searchRecentTweets, XApiError } from "@/lib/x-api";
import { getLatestSearch, saveSearchResult } from "@/lib/db";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    const cached = getLatestSearch();
    if (!cached) {
      return NextResponse.json({ tweets: [], users: {}, keyword: null });
    }
    return NextResponse.json({ tweets: cached.tweets, users: cached.users, keyword: cached.keyword });
  }

  try {
    const accessToken = getBearerToken();
    const result = await searchRecentTweets(accessToken, query);
    saveSearchResult(query, result.tweets, result.users);
    return NextResponse.json({ ...result, keyword: query });
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
