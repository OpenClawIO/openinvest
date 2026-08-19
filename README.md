# OpenInvest

**v0.3.0** — a public book for one personal Interactive Brokers account.

English | 中文 on the same page. Snapshot after the US cash close, not live quotes. Not investment advice, not an IBKR product.

个人盈透账户的公开投资账本。同页中英切换。美股收盘后的日终快照，非实时行情。不构成投资建议，非盈透官方产品。

Live / 线上: [https://openclawio.github.io/openinvest/](https://openclawio.github.io/openinvest/)

See [CHANGELOG.md](CHANGELOG.md) for what changed in each version.

## Presentation / 呈现

0.3.0 is the current public page. Each layer carries one kind of information:

| Layer | What it shows |
| --- | --- |
| Structure | Adjacent same-height volumes. Width = market weight. No ticker text in WebGL. |
| Relationship | Cost and market on one ruler from zero. The segment between marks is P/L. |
| Identity | Symbol, shares, cost, and mark in HTML. Hover or click a block to highlight its row. |
| Time | Statement date on the stage. Fills for the Flex window only. No live ticks, no invented history. |
| Language | `English` / `中文` on the same page. Numbers and layout stay put. |

净资产数字是静态的 `formatMoney(snapshot.nav)`，不会从 $0 往上跳。系统开启减少动态时，结构层改为等高二维条，映射与 3D 相同。

0.3.0 为当前公开呈现。结构用体块宽度表达仓位；成本与市值共用一把尺子；名称和价格只出现在文字里；时间只作为日终快照说明；中英同页切换。

## What is public / 公开范围

Published in `data/public.json` and on the site:

- Net asset value, cash, unrealized P/L
- Each holding: symbol, shares, average cost, mark, market value, weight
- Fills for the Flex query window (usually last business day)

Never published (keep out of git and the frontend):

- Account number
- Flex token and Query ID
- Raw Flex XML (`data/raw/`)
- Margin, buying power, stop orders

`.env.local` and `data/raw/` are gitignored. If a token was ever pasted into chat or a ticket, rotate it in Client Portal.

## Stack

- Next.js static export (`output: "export"`)
- Flex Web Service v3 → `data/public.json`
- Same-page locale: `?lang=en` | `?lang=zh`
- Three.js cyclorama for allocation structure. CI does not need Blender.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` (never commit it):

```
IBKR_FLEX_TOKEN=
IBKR_FLEX_QUERY_ID=
IBKR_FLEX_TOKEN_EXPIRES=
```

In Client Portal: **Performance & Reports → Flex Queries**. Use an Activity Flex Query (XML) that includes NAV, Open Positions, Trades, and Cash. Copy the **Query ID** (the number next to the saved query, not the token).

```bash
npm run sync
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Expected after a successful sync: NAV and holdings from the latest statement date (IBKR Flex can lag a session).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local site |
| `npm run sync` | Pull Flex, write `data/raw/*.xml` and `data/public.json` |
| `npm run rebuild` | Rebuild `data/public.json` from the latest raw XML |
| `npm run build` | Static export to `out/` |
| `npm run lint` | ESLint |

Daily update: run `npm run sync` after the US cash close, then rebuild/deploy the static site. Do not log URLs that contain the Flex token.

## GitHub Pages

The site is a static export. GitHub Pages serves `out/`. Flex credentials never go in the repo.

1. Push `main` to GitHub. The **Deploy GitHub Pages** workflow builds and publishes.
2. In the repo: **Settings → Secrets and variables → Actions**, add:
   - `IBKR_FLEX_TOKEN`
   - `IBKR_FLEX_QUERY_ID`
3. **Settings → Pages → Source** = GitHub Actions.
4. Public URL: [https://openclawio.github.io/openinvest/](https://openclawio.github.io/openinvest/)

The **Daily Flex sync** workflow runs 02:00 UTC Tuesday–Saturday (after the US close, with statement lag), commits only `data/public.json`, and redeploys. You can also run it from the Actions tab.

Local `npm run dev` has no `basePath`. The Pages build sets `GITHUB_PAGES=1` so assets load under `/openinvest/`.

## Versioning

`package.json` is the source of truth. User-Agent, README badge, and the site footer read that same number.

1. Write the change under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
2. Move it to a dated heading, e.g. `## [0.4.0] - 2026-08-20`.
3. Bump and tag:

```bash
npm version patch   # 0.3.0 → 0.3.1  (fixes)
npm version minor   # 0.3.0 → 0.4.0  (features)
npm version major   # 0.3.0 → 1.0.0  (breaking)
```

`npm version` runs `node scripts/check-changelog.mjs` first. It refuses to bump unless CHANGELOG already contains `## [new version]` and README already shows `**vX.Y.Z**`. Then push the commit and tag.

## Privacy reminder

Do not paste the Flex token into git, chat, or the browser bundle. Rotate it in Client Portal if it leaks.
