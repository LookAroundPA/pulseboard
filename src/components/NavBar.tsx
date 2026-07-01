import Link from "next/link";

export default function NavBar() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          Pulseboard
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/timeline">时间线</Link>
          <Link href="/search">搜索</Link>
          <Link href="/trends">趋势</Link>
        </nav>
      </div>
    </header>
  );
}
