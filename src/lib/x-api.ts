import { ProxyAgent } from "undici";

const API_BASE = "https://api.x.com/2";

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export class XApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "XApiError";
  }
}

async function xFetch(accessToken: string, path: string, params: Record<string, string>) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    // @ts-expect-error -- `dispatcher` is a Node/undici-specific fetch extension, not in the DOM lib types.
    dispatcher,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new XApiError(res.status, text || res.statusText);
  }

  return res.json();
}

export interface XUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

export interface XTweet {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

export interface XTrend {
  trend_name: string;
  tweet_count?: number;
}

export async function getUserByUsername(accessToken: string, username: string): Promise<XUser> {
  const json = await xFetch(accessToken, `/users/by/username/${encodeURIComponent(username)}`, {
    "user.fields": "profile_image_url,name,username",
  });
  return json.data as XUser;
}

export async function getUserTimeline(
  accessToken: string,
  userId: string,
  maxResults = 10,
): Promise<XTweet[]> {
  const json = await xFetch(accessToken, `/users/${userId}/tweets`, {
    max_results: String(maxResults),
    "tweet.fields": "created_at,public_metrics",
    exclude: "retweets,replies",
  });
  return (json.data as XTweet[]) ?? [];
}

export interface SearchResult {
  tweets: XTweet[];
  users: Record<string, XUser>;
}

export async function searchRecentTweets(
  accessToken: string,
  query: string,
  maxResults = 10,
): Promise<SearchResult> {
  const json = await xFetch(accessToken, "/tweets/search/recent", {
    query,
    max_results: String(maxResults),
    "tweet.fields": "created_at,public_metrics,author_id",
    expansions: "author_id",
    "user.fields": "name,username,profile_image_url",
  });

  const users: Record<string, XUser> = {};
  for (const user of (json.includes?.users as XUser[]) ?? []) {
    users[user.id] = user;
  }

  return { tweets: (json.data as XTweet[]) ?? [], users };
}

export async function getTrendsByWoeid(accessToken: string, woeid = 1): Promise<XTrend[]> {
  const json = await xFetch(accessToken, `/trends/by/woeid/${woeid}`, {});
  return (json.data as XTrend[]) ?? [];
}
