import type { XTweet, XUser } from "@/lib/x-api";

export default function TweetCard({ tweet, author }: { tweet: XTweet; author?: XUser }) {
  return (
    <article className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      {author && (
        <div className="mb-2 flex items-center gap-2">
          {author.profile_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.profile_image_url}
              alt={author.name}
              className="h-8 w-8 rounded-full"
            />
          )}
          <div className="text-sm">
            <span className="font-semibold">{author.name}</span>{" "}
            <span className="text-zinc-500">@{author.username}</span>
          </div>
        </div>
      )}
      <p className="whitespace-pre-wrap text-sm leading-6">{tweet.text}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        {tweet.created_at && <span>{new Date(tweet.created_at).toLocaleString()}</span>}
        {tweet.public_metrics && (
          <>
            <span>❤ {tweet.public_metrics.like_count}</span>
            <span>🔁 {tweet.public_metrics.retweet_count}</span>
            <span>💬 {tweet.public_metrics.reply_count}</span>
          </>
        )}
      </div>
    </article>
  );
}
