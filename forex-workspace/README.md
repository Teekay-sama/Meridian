# Meridian Trading Assistant

Local React/TypeScript forex workspace using Twelve Data candles. All six strategies run on the selected pair's completed market candles. No synthetic data or example modes are loaded by the application. Deterministic fixtures exist only under tests/.

## Local setup

Use Node.js 22.13+ and npm. From forex-workspace:

1. Run `npm ci`.
2. Create `.dev.vars` with `TWELVE_DATA_API_KEY=your_private_key` (already configured on this machine). This file is ignored by Git. Never use a public client environment variable for the key.
3. Run `npm run dev` and open http://localhost:5173. Restart after changing the key. On PowerShell use npm.cmd if npm.ps1 is blocked.

The local Cloudflare/Vinext runtime reads `.dev.vars`. Network access to api.twelvedata.com is required. No external accounts or deployment are configured by these commands.

## Data behavior

- EUR/USD, GBP/USD and USD/JPY; 15-minute and 4-hour intervals.
- Server requests 500 candles with explicit UTC and descending order, converts numeric strings, validates timestamps/OHLC/order, reverses into chronological order and excludes unfinished candles.
- No sample fallback: errors display a retry message and clear the old chart.
- Refresh is manual. Responses are cached for five minutes per pair/timeframe; refreshing within that window reuses the cache. Fetch time and latest completed candle time are shown separately. Quotes show the last completed candle close, not a streaming bid/ask price.
- Watchlist entries load on selection to conserve API credits. Switching strategies reuses the same candles.
- Requests share pending work and have a 15-second timeout. In-memory guards allow 7 upstream calls/minute and 750/day for this process. These guards reset on server restart; the provider's account limits remain authoritative. This is a single local workspace, not a multiuser server.
- Fewer than 200 completed candles produces Insufficient data; no setup is inferred.

## Workspace

Six illustrative strategies: trend pullback, support/resistance bounce, range breakout, EMA crossover, SMC liquidity sweep and SMC fair-value-gap retest. Lessons, price evidence, EMA overlays, and strategy levels use the selected market history. They do not establish profitability.

Watchlist, pair, timeframe and strategy persist in browser storage. Reset restores defaults. Chart supports pointer inspection and left/right arrow keys. Layout stacks on mobile.

## Verification

`npm test` runs strategy and provider parsing tests. `npm run typecheck` checks TypeScript. `npm run build` creates production artifacts; it does not deploy the app. The supported configured local preview command is `npm run dev`.

The API key stays in the server runtime and is sent to Twelve Data in an Authorization header. It is not returned to the browser. Rotate any key previously shared in chat or URLs and update `.dev.vars` locally.

Before group distribution, confirm Twelve Data display/redistribution permissions. Independent sign-in and private server workspaces remain a separate milestone.
