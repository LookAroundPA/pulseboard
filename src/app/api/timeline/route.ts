import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/lib/x-bearer";
import { getUserByUsername, getUserTimeline, XApiError } from "@/lib/x-api";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Missing 'username' query param" }, { status: 400 });
  }

  try {
    const accessToken = getBearerToken();
    const user = await getUserByUsername(accessToken, username);
    const tweets = await getUserTimeline(accessToken, user.id);
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
