"use client";

import { useState } from "react";
import TweetCard from "@/components/TweetCard";
import type { XTweet, XUser } from "@/lib/x-api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tweets, setTweets] = useState<XTweet[]>([]);
  const [users, setUsers] = useState<Record<string, XUser>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setTweets([]);
    setUsers({});

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setTweets(data.tweets);
      setUsers(data.users);
    } catch {
      setError("网络请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">关键词搜索</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键词或话题"
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? "搜索中..." : "搜索"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-4">
        {tweets.map((tweet) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            author={tweet.author_id ? users[tweet.author_id] : undefined}
          />
        ))}
        {!loading && tweets.length === 0 && !error && (
          <p className="text-sm text-zinc-500">输入关键词开始搜索。</p>
        )}
      </div>
    </main>
  );
}
