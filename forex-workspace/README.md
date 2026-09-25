# Meridian — Forex research prototype

A local React + TypeScript workspace for inspecting synthetic forex candles and an explicit trend-pullback checklist. No accounts, credentials, live feeds, or order execution are used.

## Run locally

Use Node.js 22.13 or newer (Node 24 LTS recommended) and npm. From this directory:

```powershell
npm ci
npm run dev
```

Open http://localhost:5173. Keep that terminal running while using the app. If Windows PowerShell blocks npm.ps1, use `npm.cmd` instead of `npm`.

```powershell
npm test
npm run typecheck
npm run build
npm start
```

Stop the development server before `npm start`, which uses the same port. Production output is local; no deployment is performed.

## Workspace

- Select EUR/USD (bullish fixture), GBP/USD (bearish fixture), or USD/JPY (no match).
- Switch between 15-minute intraday and 4-hour swing samples.
- Toggle EMA 20 and EMA 50 independently. Focus the chart and press left/right to inspect candles; pointer inspection also works.
- Desktop charts show the latest 80 candles; narrow charts show 36 to preserve readable labels. Calculations use all 240 completed candles.
- Compare bullish and bearish checklists. Every condition includes the relevant prices.
- Manage watchlist entries, including an empty watchlist. The pair selector always offers all three instruments.
- Watchlist, selected pair, and interval are saved in browser localStorage under `meridian.preferences.v1`. Overlay visibility is session-only. Reset workspace restores defaults. No other browser data is cleared.

## Sample data and exact rules

All six datasets are generated deterministically from fixed formulas, anchored to 24 September 2026 at 16:00 UTC. These are synthetic sequences, not historical market prices, and intentionally include continuous timestamps rather than forex session calendars. The same price sequence appears at each interval to isolate rule behavior. Nothing refreshes against current time.

Candles use positive finite OHLC prices, integer UTC opening timestamps in milliseconds, and strictly increasing timestamps. High/low must contain open and close. Invalid input is rejected before evaluation. A candle is completed only when its opening time plus its interval is no later than the dataset's `asOf` timestamp. At least 200 completed candles are required.

EMAs use a period-length simple average as the first value, then `previous + (close - previous) * 2 / (period + 1)`.

Bullish conditions:

1. Latest EMA 20 is strictly above EMA 50, and latest close is strictly above EMA 50.
2. At least one of the three candles immediately before the latest has `low <= its EMA 20 <= high`, and its close is strictly above its EMA 50. Touching is inclusive; only actual candle ranges count.
3. Latest close is strictly above its open, the previous high, and its EMA 20.

Bearish conditions mirror these comparisons, with previous low for confirmation. All three must pass. An unmatched condition does not predict price direction. This illustrative ruleset has no performance validation.

## Structure and next milestone

- `lib/forex.ts`: typed provider contract, deterministic fixtures, pure EMA/rules engine, preference validation.
- `app/page.tsx`: local workspace, responsive SVG chart, controls, optional read-only WebMCP analysis tool.
- `app/globals.css`: responsive dark interface.
- `tests/forex.test.mjs`: fixed-fixture outcomes and input/indicator boundary cases.

The React app uses the provided Vinext/Vite starter. Its unused backend scaffolding is not connected to this prototype. A future live provider should normalize OHLC data and UTC timestamps into `MarketSeries`, preserve explicit source/as-of metadata, and handle network/rate-limit failures before invoking the rules engine. Independent authentication and server-enforced private workspaces remain a separate milestone; localStorage is not account isolation.

## Verification

13 automated tests cover both intervals and all outcomes, EMA seeding, minimum history, unfinished candles, malformed/unordered data, strict confirmation, pullback window, and corrupt preferences. TypeScript checking and the production build pass. Browser checks covered pair/preset changes, overlays, keyboard inspection, reload persistence, watchlist removal, reset, desktop/mobile layouts, and valid/invalid WebMCP calls.

This milestone is committed locally. It is **not backed up to GitHub** until a remote repository is connected and pushed.
