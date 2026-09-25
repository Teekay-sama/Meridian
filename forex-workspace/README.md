# Meridian — Forex research prototype

A local React + TypeScript workspace for inspecting synthetic forex candles and six explicit strategy checklists with beginner lessons. No accounts, credentials, live feeds, or order execution are used.

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

- Select EUR/USD, GBP/USD, or USD/JPY. Base-sample trend-pullback outcomes are bullish, bearish, and no match respectively.
- Switch between 15-minute intraday and 4-hour swing samples.
- Toggle EMA 20 and EMA 50 independently. Focus the chart and press left/right to inspect candles; pointer inspection also works.
- Desktop charts show the latest 80 candles; narrow charts show 36 to preserve readable labels. Calculations use all 240 completed candles.
- Choose trend pullback, support/resistance bounce, range breakout, EMA crossover, SMC liquidity sweep, or SMC fair-value-gap retest.
- Each strategy includes a plain-language lesson, a glossary, exact mechanical rules, limitations, and an external learning reference. These are transparent teaching variants, not replicas of a named trader's proprietary system.
- Compare bullish and bearish checklists. Expand Show price evidence for the actual values. The first unmet condition is explained above the checklist.
- Load Bullish example or Bearish example to replace the chart with a deterministic teaching fixture for that strategy. These constructed examples demonstrate matching geometry, not historical performance. Base sample restores the shared dataset so different strategies can be compared on identical candles.
- Support/resistance and gap boundaries appear as chart lines and labeled prices. EMA overlays default on for the two EMA strategies and off for the others; users can still toggle them.
- Manage watchlist entries, including an empty watchlist. The pair selector always offers all three instruments.
- Watchlist, selected pair, interval, and strategy are saved in browser localStorage under `meridian.preferences.v1`. Overlay visibility and example mode are session-only. Reloading returns to Base sample. Old preferences without a strategy migrate to trend pullback. Reset workspace restores defaults. No other browser data is cleared.

## Sample data and exact rules

All six datasets are generated deterministically from fixed formulas, anchored to 24 September 2026 at 16:00 UTC. These are synthetic sequences, not historical market prices, and intentionally include continuous timestamps rather than forex session calendars. The same price sequence appears at each interval to isolate rule behavior. Nothing refreshes against current time.

Candles use positive finite OHLC prices, integer UTC opening timestamps in milliseconds, and strictly increasing timestamps. High/low must contain open and close. Invalid input is rejected before evaluation. A candle is completed only when its opening time plus its interval is no later than the dataset's `asOf` timestamp. At least 200 completed candles are required.

EMAs use a period-length simple average as the first value, then `previous + (close - previous) * 2 / (period + 1)`.

Bullish conditions:

1. Latest EMA 20 is strictly above EMA 50, and latest close is strictly above EMA 50.
2. At least one of the three candles immediately before the latest has `low <= its EMA 20 <= high`, and its close is strictly above its EMA 50. Touching is inclusive; only actual candle ranges count.
3. Latest close is strictly above its open, the previous high, and its EMA 20.

Bearish conditions mirror these comparisons, with previous low for confirmation. All three must pass. An unmatched condition does not predict price direction. This illustrative ruleset has no performance validation.

## Additional strategy definitions

The strategy catalog in lib/strategies.ts and the in-app Exact rules section are the source of truth for each variant. All six reuse the completed-candle validation and 200-candle minimum. Bullish and bearish comparisons are mirrored.

- **Support/resistance bounce:** min/max of the 20 candles before the previous candle; at least two reference touches within 10% of mean candle range; previous candle rejects the band; latest candle confirms while remaining inside the range.
- **Range breakout:** previous 20-candle range excluding the latest candle; latest close must break a boundary, not merely wick through it; body must agree.
- **EMA crossover:** a new EMA 20/50 cross on the latest candle and a close beyond both lines. A continuing trend is not a new cross.
- **SMC sweep:** repeated local highs/lows, previous-candle wick strictly through the boundary with a close back across it, then a directional latest close beyond the previous candle.
- **SMC FVG retest:** newest qualifying untouched gap per direction, formed 2–20 candles ago; three-candle geometry plus a middle body at least 1.5 times its prior 20-body average; latest range intersects the gap, does not wick past its far edge, and closes beyond the near edge with matching body direction. Previously touched gaps are excluded.

SMC is represented by two specific patterns, not a complete institutional-order model. No order blocks, break-of-structure classifier, measured liquidity, backtested profitability, or live trade recommendations are claimed.

## Structure and next milestone

- `lib/forex.ts`: typed provider contract, deterministic fixtures, pure EMA/rules engine, preference validation.
- `lib/strategies.ts`: strategy catalog, independent evaluators, chart levels, deterministic teaching examples.
- `app/page.tsx`: local workspace, responsive SVG chart, controls, optional read-only WebMCP analysis tool.
- `app/globals.css`: responsive dark interface.
- `tests/forex.test.mjs`: fixed-fixture outcomes and input/indicator boundary cases.

The React app uses the provided Vinext/Vite starter. Its unused backend scaffolding is not connected to this prototype. A future live provider should normalize OHLC data and UTC timestamps into `MarketSeries`, preserve explicit source/as-of metadata, and handle network/rate-limit failures before invoking the rules engine. Independent authentication and server-enforced private workspaces remain a separate milestone; localStorage is not account isolation.

## Verification

40 automated tests cover the original rules plus all 72 strategy/direction/pair/interval teaching combinations, source immutability, preference migration, flat-price numerical stability, wick-only breakouts, stale crossovers, failed reclaims, prior gap touches, missed retests, and gap invalidation. TypeScript checking and the production build pass. Browser checks covered pair/preset changes, overlays, keyboard inspection, reload persistence, watchlist removal, reset, desktop/mobile layouts, and valid/invalid WebMCP calls.

This milestone is committed locally. It is **not backed up to GitHub** until a remote repository is connected and pushed.
