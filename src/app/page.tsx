import Link from "next/link";

const features = [
  {
    href: "/timeline",
    title: "用户时间线",
    description: "输入一个 X 用户名，查看其最新推文。",
  },
  {
    href: "/search",
    title: "关键词搜索",
    description: "按关键词或话题搜索近期推文。",
  },
  {
    href: "/trends",
    title: "趋势",
    description: "查看当前热门话题趋势。",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Pulseboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          一个从 X (Twitter) 拉取并展示公开内容的小工具，使用只读的 App-only
          Bearer Token，无需登录授权。
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="rounded-xl border border-black/10 p-5 transition-colors hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.05]"
          >
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{feature.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
