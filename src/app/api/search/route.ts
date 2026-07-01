import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/lib/x-bearer";
import { searchRecentTweets, XApiError } from "@/lib/x-api";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing 'q' query param" }, { status: 400 });
  }

  try {
    const accessToken = getBearerToken();
    const result = await searchRecentTweets(accessToken, query);
    return NextResponse.json(result);
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
