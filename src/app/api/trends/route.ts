import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/lib/x-bearer";
import { getTrendsByWoeid, XApiError } from "@/lib/x-api";

export async function GET(request: NextRequest) {
  const woeidParam = request.nextUrl.searchParams.get("woeid");
  const woeid = woeidParam ? Number(woeidParam) : 1;

  try {
    const accessToken = getBearerToken();
    const trends = await getTrendsByWoeid(accessToken, woeid);
    return NextResponse.json({ trends });
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
