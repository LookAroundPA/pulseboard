"use client";

import { useEffect, useState } from "react";
import type { XTrend } from "@/lib/x-api";

const WOEID_OPTIONS = [
  { label: "全球", value: 1 },
  { label: "美国", value: 23424977 },
  { label: "日本", value: 23424856 },
];

function TrendsList({ woeid }: { woeid: number }) {
  const [trends, setTrends] = useState<XTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trends?woeid=${woeid}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "加载失败");
        }
        if (!cancelled) setTrends(data.trends);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [woeid]);

  return (
    <>
      {loading && <p className="text-sm text-zinc-500">加载中...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ol className="flex flex-col gap-2">
        {trends.map((trend, i) => (
          <li
            key={`${trend.trend_name}-${i}`}
            className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-sm dark:border-white/10"
          >
            <span className="font-medium">
              {i + 1}. {trend.trend_name}
            </span>
            {trend.tweet_count != null && (
              <span className="text-zinc-500">{trend.tweet_count.toLocaleString()} 条推文</span>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

export default function TrendsPage() {
  const [woeid, setWoeid] = useState(1);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">趋势</h1>

      <div className="flex gap-2">
        {WOEID_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setWoeid(option.value)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              woeid === option.value
                ? "border-foreground bg-foreground text-background"
                : "border-black/10 dark:border-white/20"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <TrendsList key={woeid} woeid={woeid} />
    </main>
  );
}
