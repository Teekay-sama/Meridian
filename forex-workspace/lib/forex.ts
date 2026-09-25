export const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY'] as const;
export type Pair = typeof PAIRS[number];
export type Interval = '15m' | '4h';
export type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
};
export type MarketSeries = {
    pair: Pair;
    interval: Interval;
    source: string;
    asOf: number;
    candles: Candle[];
};
export interface MarketDataProvider {
    getSeries(pair: Pair, interval: Interval): MarketSeries;
}
export const duration = (interval: Interval) => interval === '15m' ? 900000 : 14400000;
export type Check = {
    name: string;
    pass: boolean;
    detail: string;
};
export type Analysis = {
    status: 'Bullish setup' | 'Bearish setup' | 'No matching setup' | 'Insufficient data';
    bullish: Check[];
    bearish: Check[];
    candles: Candle[];
    ema20: (number | null)[];
    ema50: (number | null)[];
};
export const price = (value: number, pair: Pair) => value.toFixed(pair === 'USD/JPY' ? 3 : 5);
export function ema(values: number[], period: number): (number | null)[] {
    if (!Number.isInteger(period) || period < 1)
        throw new Error('Invalid EMA period');
    const result: (number | null)[] = values.map(() => null);
    if (values.length < period)
        return result;
    const origin = values[0];
    let current = origin + values.slice(0, period).reduce((sum, value) => sum + (value - origin), 0) / period;
    result[period - 1] = current;
    for (let i = period; i < values.length; i++) {
        current += (values[i] - current) * 2 / (period + 1);
        result[i] = current;
    }
    return result;
}
export function analyze(series: MarketSeries): Analysis {
    if (!Number.isFinite(series.asOf) || !['15m', '4h'].includes(series.interval) || !PAIRS.includes(series.pair))
        throw new Error('Invalid series metadata');
    series.candles.forEach((c, i) => {
        if (![c.time, c.open, c.high, c.low, c.close].every(Number.isFinite) || !Number.isInteger(c.time) || c.time < 0 || Math.min(c.open, c.high, c.low, c.close) <= 0 || c.high < Math.max(c.open, c.close) || c.low > Math.min(c.open, c.close) || (i > 0 && c.time <= series.candles[i - 1].time))
            throw new Error('Invalid or unordered candle data');
    });
    const candles = series.candles.filter(c => c.time + duration(series.interval) <= series.asOf);
    const ema20 = ema(candles.map(c => c.close), 20), ema50 = ema(candles.map(c => c.close), 50);
    const base = { candles, ema20, ema50 };
    if (candles.length < 200)
        return { ...base, status: 'Insufficient data', bullish: [], bearish: [] };
    const n = candles.length - 1, last = candles[n], previous = candles[n - 1], fast = ema20[n]!, slow = ema50[n]!;
    const p = (x: number) => price(x, series.pair);
    function checks(bull: boolean): Check[] {
        const relation = bull ? '>' : '<', compare = (a: number, b: number) => bull ? a > b : a < b;
        const pullback = [n - 1, n - 2, n - 3].find(i => candles[i].low <= ema20[i]! && candles[i].high >= ema20[i]! && compare(candles[i].close, ema50[i]!));
        return [
            { name: 'Trend direction', pass: compare(fast, slow) && compare(last.close, slow), detail: `Requires EMA 20 ${p(fast)} ${relation} EMA 50 ${p(slow)}; close ${p(last.close)} ${relation} EMA 50.` },
            { name: 'Pullback to EMA 20', pass: pullback !== undefined, detail: pullback === undefined ? `None of the previous 3 candles spans its EMA 20 with close ${relation} EMA 50.` : `Candle −${n - pullback}: range ${p(candles[pullback].low)}–${p(candles[pullback].high)} touches EMA 20 ${p(ema20[pullback]!)}; close ${p(candles[pullback].close)} ${relation} EMA 50 ${p(ema50[pullback]!)}.` },
            { name: 'Candle confirmation', pass: compare(last.close, last.open) && compare(last.close, bull ? previous.high : previous.low) && compare(last.close, fast), detail: `Close ${p(last.close)} must be ${relation} open ${p(last.open)}, previous ${bull ? 'high' : 'low'} ${p(bull ? previous.high : previous.low)}, and EMA 20 ${p(fast)}.` },
        ];
    }
    const bullish = checks(true), bearish = checks(false);
    return { ...base, bullish, bearish, status: bullish.every(c => c.pass) ? 'Bullish setup' : bearish.every(c => c.pass) ? 'Bearish setup' : 'No matching setup' };
}
// Fixed synthetic fixtures: no randomness, network requests, or wall-clock dependence.
export const sampleProvider: MarketDataProvider = { getSeries(pair, interval) {
        const asOf = Date.UTC(2026, 8, 24, 16), step = duration(interval);
        const base = pair === 'USD/JPY' ? 148 : pair === 'GBP/USD' ? 1.28 : 1.08, unit = pair === 'USD/JPY' ? .03 : .00022, direction = pair === 'GBP/USD' ? -1 : 1;
        const candles: Candle[] = [];
        for (let i = 0; i < 240; i++) {
            const close = base + direction * unit * (i * .32 + Math.sin(i * .44) * 1.5 + Math.sin(i * .11) * 3), open = i ? candles[i - 1].close : close - unit;
            candles.push({ time: asOf - (240 - i) * step, open, close, high: Math.max(open, close) + unit * .7, low: Math.min(open, close) - unit * .7 });
        }
        const fast = ema(candles.map(c => c.close), 20);
        if (pair !== 'USD/JPY') {
            const pull = candles[238];
            if (direction > 0)
                pull.low = fast[238]! - unit * .1;
            else
                pull.high = fast[238]! + unit * .1;
            const last = candles[239];
            last.open = pull.close;
            last.close = direction > 0 ? pull.high + unit * 2 : pull.low - unit * 2;
            last.high = Math.max(last.open, last.close) + unit * .6;
            last.low = Math.min(last.open, last.close) - unit * .6;
        }
        else {
            const last = candles[239];
            last.close = last.open;
            last.high = last.open + unit;
            last.low = last.open - unit;
        }
        return { pair, interval, asOf, source: 'Deterministic synthetic sample', candles };
    } };
export const STRATEGY_IDS = ['trend-pullback', 'support-resistance', 'range-breakout', 'ema-crossover', 'smc-sweep', 'smc-fvg'] as const;
export type StrategyId = typeof STRATEGY_IDS[number];
export type Preferences = {
    strategy: StrategyId;
    pair: Pair;
    interval: Interval;
    watchlist: Pair[];
};
export const defaults: Preferences = { pair: 'EUR/USD', interval: '15m', watchlist: [...PAIRS], strategy: 'trend-pullback' };
export const STORAGE_KEY = 'meridian.preferences.v1';
export function parsePreferences(raw: string | null): Preferences {
    try {
        const p = JSON.parse(raw ?? 'null');
        if (!p || !PAIRS.includes(p.pair) || !['15m', '4h'].includes(p.interval) || !Array.isArray(p.watchlist) || !p.watchlist.every((x: Pair) => PAIRS.includes(x)))
            return defaults;
        return { strategy: STRATEGY_IDS.includes(p.strategy) ? p.strategy : 'trend-pullback', pair: p.pair, interval: p.interval, watchlist: [...new Set<Pair>(p.watchlist)] };
    }
    catch {
        return defaults;
    }
}
