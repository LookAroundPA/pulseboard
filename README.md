# Pulseboard

一个用 Next.js 构建的小型 Web 应用，展示从 X (Twitter) API 拉取的公开内容：
指定用户的时间线、关键词搜索结果、以及当前趋势。

使用 X API 的 **App-only Bearer Token** 只读认证，不需要用户登录授权，
也不需要配置回调地址（Callback URI）。

> 说明：官方 `docs.x.com/mcp` 里的 `xurl` + MCP Server 是给 Claude Desktop / Cursor
> 这类 AI 客户端使用的桥接工具，走的是 MCP (JSON-RPC) 协议。本项目是一个普通网页应用，
> 直接对接标准的 X API v2 REST 接口。由于时间线/搜索/趋势都是公开数据，
> 不需要走用户级 OAuth 授权，用 App-only Bearer Token 即可。

## 1. 获取 Bearer Token

1. 打开 https://developer.x.com/en/portal/dashboard，创建一个新 App（需要 Free/Basic 及以上开发者账号）。
2. 进入该 App 的 **Keys and tokens** 标签页。
3. 在 **Authentication Tokens** 部分找到 **Bearer Token**，生成并复制。

> 注意：`/2/trends/by/woeid/{woeid}` 接口需要账号具备相应的 API 访问级别，
> 如果你的开发者账号层级较低，趋势页可能会返回 403，这是 X API 侧的权限限制，非本项目 bug。

## 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入：

```bash
cp .env.example .env.local
```

```
X_BEARER_TOKEN=你的 Bearer Token
```

## 3. 运行

```bash
npm install
npm run dev
```

打开 http://localhost:19347 即可使用：

- **时间线**：输入用户名查看最新推文
- **搜索**：按关键词/话题搜索近期推文
- **趋势**：查看当前热门话题（可切换地区）

## 目录结构

```
src/
  app/
    api/
      timeline/route.ts   用户时间线接口
      search/route.ts     关键词搜索接口
      trends/route.ts     趋势接口
    timeline/page.tsx      时间线页面
    search/page.tsx        搜索页面
    trends/page.tsx        趋势页面
    page.tsx               首页
  components/
    NavBar.tsx             顶部导航
    TweetCard.tsx           推文卡片
  lib/
    x-bearer.ts              读取 Bearer Token
    x-api.ts                  X API v2 调用封装
```

## 安全提示

- `.env.local` 已被 `.gitignore` 忽略，不要提交到版本库。
- Bearer Token 是应用级凭证，请勿泄露或提交到公开仓库；如果泄露请到开发者后台重新生成。
