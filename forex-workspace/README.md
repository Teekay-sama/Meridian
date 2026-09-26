# Meridian Trading Assistant

Local React/TypeScript forex workspace using Twelve Data candles. All six strategies run on the selected pair's completed market candles. No synthetic data or example modes are loaded by the application. Deterministic fixtures exist only under tests/.

## Local setup

Use Node.js 22.13+ and npm. From forex-workspace:

1. Run `npm ci`.
2. Create `.dev.vars` with `TWELVE_DATA_API_KEY=your_private_key` (already configured on this machine). This file is ignored by Git. Never use a public client environment variable for the key.
3. Run `npm run dev` and open http://localhost:5173. Restart after changing the key. On PowerShell use npm.cmd if npm.ps1 is blocked.

The Node launcher reads `.dev.vars` locally. Network access to api.twelvedata.com is required. No external accounts or deployment are configured by these commands.

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

`npm test` runs strategy and provider parsing tests. `npm run typecheck` checks TypeScript. `npm run build` creates production artifacts; it does not deploy the app. Use `npm run dev` for development and `npm start` for production after building.

The API key stays in the server runtime and is sent to Twelve Data in an Authorization header. It is not returned to the browser. Rotate any key previously shared in chat or URLs and update `.dev.vars` locally.

Before group distribution, confirm Twelve Data display/redistribution permissions. Independent sign-in and private server workspaces remain a separate milestone.

## Bring your own chart / Groq

The screenshot panel accepts PNG, JPEG and WebP up to 5 MB. Choose or drop a file, preview it, optionally identify the pair/timeframe/capture time, then click Analyze with Groq. Only that action sends the image and context to Groq; the app does not persist either. Groq's own data policies apply to submitted images. Remove account details before submitting.

To enable actual analysis, add a separate Groq API key to the ignored `.dev.vars` file, preserving the Twelve Data key:

```text
GROQ_API_KEY=your_private_groq_key
GROQ_VISION_MODEL=qwen/qwen3.8-27b
```

Restart `npm run dev`. A Groq API account with access to the configured vision model is required; account rate and usage limits apply. Never paste the key into the UI, client code, or Git. The default model accepts images through the Chat Completions API; GROQ_VISION_MODEL can select another compatible image-input model.

Results describe up to two conditional scenarios with entry, TP, SL, evidence, confirmation and invalidation. Prices must be readable, and the model can return no setup. Server validation rejects malformed results and incorrect long/short level ordering; it cannot prove the model read the chart accurately. Reward/risk is calculated from the returned price distances, excluding costs. Verify levels and current conditions before making decisions. No trades are executed.

Requests are same-origin, bounded in size, limited to one in flight / three per minute per server process, and time out after 60 seconds. This remains a local prototype: authentication and durable per-user spend limits are required before hosting for a group. Cancelling discards the result in the UI; upstream processing may already have incurred a charge.

Validation: 47 tests pass, including unreadable/no-setup responses, invalid TP/SL geometry and image signatures. Real Groq image inference remains untested until a key is configured. Official image API documentation: https://console.groq.com/docs/vision

## Render deployment

Use a Node Web Service with root directory `forex-workspace`, build command `npm ci --include=dev && npm run build`, and start command `npm start`. Do not use `npm run dev` on Render. The production server binds to `0.0.0.0` and Render's PORT. `/api/health` is the health endpoint. `render.yaml` provides the same settings for new Blueprint deployments; existing services must have their commands updated in the dashboard.

Set TWELVE_DATA_API_KEY and GROQ_API_KEY as secret environment variables in Render. Optional GROQ_VISION_MODEL defaults to qwen/qwen3.8-27b. Never upload .dev.vars. The application uses process.env on the Node server, with no Cloudflare runtime required. Screenshot origin validation uses Render's external hostname behind its HTTPS proxy. For custom domains, update the allowed origin before use.

This version has no user authentication: anyone with the public URL can consume the shared API allowance. The in-memory limits are per process and reset on restart. Private workspaces and provider group-display permissions are not implemented by deploying it.
