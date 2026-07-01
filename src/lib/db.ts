import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { XTweet, XUser } from "@/lib/x-api";

const MAX_TWEETS_PER_QUERY = 50;

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "pulseboard.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    keyword TEXT NOT NULL,
    meta TEXT,
    updated_at TEXT NOT NULL,
    UNIQUE(type, keyword)
  );

  CREATE TABLE IF NOT EXISTS tweets (
    id TEXT PRIMARY KEY,
    created_at TEXT,
    raw TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    raw TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS query_tweets (
    query_id INTEGER NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
    tweet_id TEXT NOT NULL REFERENCES tweets(id),
    fetched_at TEXT NOT NULL,
    PRIMARY KEY (query_id, tweet_id)
  );
`);

type QueryType = "search" | "timeline";

function upsertQuery(type: QueryType, keyword: string, meta?: unknown): number {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO queries (type, keyword, meta, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(type, keyword) DO UPDATE SET meta = excluded.meta, updated_at = excluded.updated_at`,
  ).run(type, keyword, meta ? JSON.stringify(meta) : null, now);

  const row = db
    .prepare(`SELECT id FROM queries WHERE type = ? AND keyword = ?`)
    .get(type, keyword) as { id: number };
  return row.id;
}

function upsertTweets(tweets: XTweet[]) {
  const stmt = db.prepare(
    `INSERT INTO tweets (id, created_at, raw) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET created_at = excluded.created_at, raw = excluded.raw`,
  );
  for (const tweet of tweets) {
    stmt.run(tweet.id, tweet.created_at ?? null, JSON.stringify(tweet));
  }
}

function upsertUsers(users: XUser[]) {
  const stmt = db.prepare(
    `INSERT INTO users (id, raw) VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET raw = excluded.raw`,
  );
  for (const user of users) {
    stmt.run(user.id, JSON.stringify(user));
  }
}

function linkQueryTweets(queryId: number, tweetIds: string[]) {
  const now = new Date().toISOString();
  const link = db.prepare(
    `INSERT INTO query_tweets (query_id, tweet_id, fetched_at) VALUES (?, ?, ?)
     ON CONFLICT(query_id, tweet_id) DO UPDATE SET fetched_at = excluded.fetched_at`,
  );
  for (const tweetId of tweetIds) {
    link.run(queryId, tweetId, now);
  }

  // Keep only the MAX_TWEETS_PER_QUERY most recent tweets (by tweet created_at,
  // falling back to fetch time) linked to this query so storage stays bounded.
  db.prepare(
    `DELETE FROM query_tweets
     WHERE query_id = ?
     AND tweet_id NOT IN (
       SELECT qt.tweet_id FROM query_tweets qt
       JOIN tweets t ON t.id = qt.tweet_id
       WHERE qt.query_id = ?
       ORDER BY COALESCE(t.created_at, qt.fetched_at) DESC
       LIMIT ?
     )`,
  ).run(queryId, queryId, MAX_TWEETS_PER_QUERY);
}

function getQueryTweets(queryId: number): XTweet[] {
  const rows = db
    .prepare(
      `SELECT t.raw FROM query_tweets qt
       JOIN tweets t ON t.id = qt.tweet_id
       WHERE qt.query_id = ?
       ORDER BY COALESCE(t.created_at, qt.fetched_at) DESC`,
    )
    .all(queryId) as { raw: string }[];
  return rows.map((row) => JSON.parse(row.raw) as XTweet);
}

export function saveSearchResult(keyword: string, tweets: XTweet[], users: Record<string, XUser>) {
  const queryId = upsertQuery("search", keyword);
  upsertTweets(tweets);
  upsertUsers(Object.values(users));
  linkQueryTweets(
    queryId,
    tweets.map((tweet) => tweet.id),
  );
}

export function getLatestSearch(): { keyword: string; tweets: XTweet[]; users: Record<string, XUser> } | null {
  const row = db
    .prepare(`SELECT id, keyword FROM queries WHERE type = 'search' ORDER BY updated_at DESC LIMIT 1`)
    .get() as { id: number; keyword: string } | undefined;
  if (!row) return null;

  const tweets = getQueryTweets(row.id);
  const users: Record<string, XUser> = {};
  const authorIds = [...new Set(tweets.map((t) => t.author_id).filter(Boolean))] as string[];
  if (authorIds.length > 0) {
    const placeholders = authorIds.map(() => "?").join(",");
    const userRows = db
      .prepare(`SELECT raw FROM users WHERE id IN (${placeholders})`)
      .all(...authorIds) as { raw: string }[];
    for (const userRow of userRows) {
      const user = JSON.parse(userRow.raw) as XUser;
      users[user.id] = user;
    }
  }

  return { keyword: row.keyword, tweets, users };
}

export function saveTimelineResult(username: string, user: XUser, tweets: XTweet[]) {
  const queryId = upsertQuery("timeline", username, user);
  upsertTweets(tweets);
  upsertUsers([user]);
  linkQueryTweets(
    queryId,
    tweets.map((tweet) => tweet.id),
  );
}

export function getLatestTimeline(): { username: string; user: XUser; tweets: XTweet[] } | null {
  const row = db
    .prepare(`SELECT id, keyword, meta FROM queries WHERE type = 'timeline' ORDER BY updated_at DESC LIMIT 1`)
    .get() as { id: number; keyword: string; meta: string | null } | undefined;
  if (!row || !row.meta) return null;

  const tweets = getQueryTweets(row.id);
  const user = JSON.parse(row.meta) as XUser;
  return { username: row.keyword, user, tweets };
}
