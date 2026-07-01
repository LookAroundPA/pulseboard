"use client";

import { useEffect, useState } from "react";
import TweetCard from "@/components/TweetCard";
import type { XTweet, XUser } from "@/lib/x-api";

export default function TimelinePage() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<XUser | null>(null);
  const [tweets, setTweets] = useState<XTweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCached() {
      try {
        const res = await fetch("/api/timeline");
        const data = await res.json();
        if (data.user) {
          setUsername(data.user.username);
          setUser(data.user);
          setTweets(data.tweets);
        }
      } catch {
        // ignore — cache is a nice-to-have, not required for the page to work
      }
    }
    loadCached();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setUser(null);
    setTweets([]);

    try {
      const res = await fetch(`/api/timeline?username=${encodeURIComponent(username.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setUser(data.user);
      setTweets(data.tweets);
    } catch {
      setError("网络请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">用户时间线</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="输入用户名，例如 elonmusk"
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? "加载中..." : "查询"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {user && (
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-foreground">{user.name}</span>
          <span>@{user.username}</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
        {!loading && tweets.length === 0 && !error && (
          <p className="text-sm text-zinc-500">输入用户名开始查询。</p>
        )}
      </div>
    </main>
  );
}
