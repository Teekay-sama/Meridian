# Meridian: what to obtain for live data

## Get this first: one forex market-data API

This single service powers the candlestick chart, price/watchlist display, EMA overlays, and every strategy checklist. We calculate indicators, support/resistance, and the selected SMC patterns ourselves. Do not buy a separate signals or strategy API for the current features.

Required capabilities:

- EUR/USD, GBP/USD, USD/JPY.
- Historical AND latest OHLC candles (open, high, low, close), not merely a currency conversion rate.
- Native 15-minute and 4-hour bars; documentation of session and 4-hour alignment.
- At least 200 completed candles per pair/timeframe; preferably 500–1,000 available per request or through pagination.
- UTC timestamps with clear candle opening times and completion status, or documented close-time semantics.
- Recent completed bars during market hours, documented delay, request limits, and available historical depth.
- Permission to display charts to the intended small group, and permission for server caching/derived indicators. Access to an API is not automatically a license to redistribute its prices.

Useful but optional initially: current bid/ask quotes and spread, market-open status, WebSocket streaming. Closed-candle analysis does not require tick-by-tick streaming. A latest-price-only endpoint is not enough to seed the indicators.

Candidates to investigate:

- Twelve Data: https://twelvedata.com/docs and https://twelvedata.com/pricing. Supports forex time-series APIs. Its free Basic tier lists internal non-display usage; confirm the required chart-display/group-use rights rather than assuming the free tier permits them.
- OANDA v20: https://developer.oanda.com/rest-live-v20/introduction/ and https://developer.oanda.com/rest-live-v20/pricing-ep/. Offers real-time and historical market data. Requires an eligible v20 account; its documentation excludes some divisions. Confirm availability for your account/region and group display permissions. We only need market-data access, not trade execution.

Provider shortlist checked against official documentation on 25 September 2026; verify current terms when acquiring access.

## Where the API will connect

External provider -> server-only adapter/cache -> Meridian's internal candles endpoint -> chart + local strategy calculations.

The existing contract is MarketDataProvider/MarketSeries in lib/forex.ts. It currently returns deterministic samples synchronously. Live integration will add an asynchronous server-backed loader, normalized candles, loading/error/stale states, provider timestamps, and deduplicated cached requests. It must retain teaching samples as an explicitly labeled mode. No live integration is configured yet.

Keep the API token in server-only environment configuration, never in client-side NEXT_PUBLIC variables, browser storage, or a Git commit. Initially send the provider name, documentation URL, plan, request limits, and a redacted example candle response; the secret itself is not needed for evaluating compatibility.

## Optional later services

| Feature | Service needed | Needed for current live charts? |
| --- | --- | --- |
| Economic-event warnings (CPI, rates, jobs) | Economic-calendar API with event time, currency, importance, actual/forecast/previous | No |
| Private accounts and synced watchlists | Managed authentication plus a database | No; next multi-user milestone |
| Conversational AI tutor | Language-model API | No; existing lessons and rules need no AI calls |
| Email/SMS/push alerts | Notification delivery provider | No |
| Place or manage trades | Broker order/execution API | No; outside current research scope |

Provider enquiry you can copy:

> I am building a forex education/research web app for a small group. I need EUR/USD, GBP/USD and USD/JPY historical and recent OHLC candles at 15-minute and 4-hour intervals, with at least 500 bars per series, UTC timestamps and clear completed-bar semantics. Which plan allows displaying these charts to my users and caching data/calculating derived indicators on my server? Please confirm quote delay, request limits, historical depth, candle/session alignment and pricing. Live bid/ask quotes would be useful but streaming and trade execution are not required initially.
