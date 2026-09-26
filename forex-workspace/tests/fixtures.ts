import {duration, ema, type Pair, type Interval, type StrategyId, type Candle, type MarketSeries} from '../lib/forex.ts';
// Fixed synthetic fixtures: no randomness, network requests, or wall-clock dependence.
export const sampleProvider: { getSeries(pair: Pair, interval: Interval): MarketSeries } = { getSeries(pair, interval) {
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
// Purpose-built teaching examples are explicit alternatives to the shared sample.
export function teachingSeries(pair: Pair, interval: Interval, strategy: StrategyId, direction: 'bullish' | 'bearish'): MarketSeries {
    if (strategy === 'trend-pullback') {
        const s = sampleProvider.getSeries(direction === 'bullish' ? 'EUR/USD' : 'GBP/USD', interval);
        const scale = pair === 'USD/JPY' ? 130 : 1;
        return { ...s, pair, source: `Teaching example · ${direction}`, candles: s.candles.map(c => ({ ...c, open: c.open * scale, high: c.high * scale, low: c.low * scale, close: c.close * scale })) };
    }
    const s = sampleProvider.getSeries(pair, interval), n = s.candles.length - 1;
    const base = pair === 'USD/JPY' ? 150 : 1.1, unit = pair === 'USD/JPY' ? .05 : .0005;
    const data = Array.from({ length: 240 }, (_, i) => {
        const close = 10 + Math.sin(i * .55), open = 10 + Math.sin((i - 1) * .55);
        return { time: s.candles[i].time, open, close, low: i % 10 === 0 ? 8 : Math.min(open, close) - .3, high: i % 10 === 5 ? 12 : Math.max(open, close) + .3 };
    });
    const set = (i: number, open: number, close: number, low: number, high: number) => { data[i] = { ...data[i], open, close, low, high }; };
    if (strategy === 'support-resistance') {
        set(n - 1, 9, 8.6, 8, 9.2);
        set(n, 8.6, 10, 8.5, 10.2);
    }
    if (strategy === 'range-breakout') {
        set(n, 10, 13, 9.8, 13.2);
    }
    if (strategy === 'ema-crossover') {
        for (let i = 0; i < n; i++) {
            const close = 12 - i * .01;
            set(i, close + .008, close, close - .02, close + .025);
        }
        const closes = data.slice(0, n).map(c => c.close), fast = ema(closes, 20).at(-1)!, slow = ema(closes, 50).at(-1)!;
        const a = 2 / 21, b = 2 / 51, threshold = ((1 - b) * slow - (1 - a) * fast) / (a - b);
        const close = threshold + .08, open = data[n - 1].close;
        set(n, open, close, Math.min(open, close) - .02, Math.max(open, close) + .02);
    }
    if (strategy === 'smc-sweep') {
        set(n - 1, 9, 8.7, 7, 9.3);
        set(n, 8.7, 10, 8.5, 10.2);
    }
    if (strategy === 'smc-fvg') {
        // Gap: first high 10, third low 12; latest retests at 11 then closes 13.
        set(n - 5, 9, 9.5, 8.8, 10);
        set(n - 4, 9.5, 12.5, 9.4, 12.8);
        set(n - 3, 12.5, 13, 12, 13.2);
        set(n - 2, 13, 13.5, 12.8, 13.8);
        set(n - 1, 13.5, 13.6, 13, 13.9);
        set(n, 11.5, 13, 11, 13.2);
    }
    const transform = (v: number) => base + unit * (direction === 'bullish' ? v : 20 - v);
    return { ...s, source: `Teaching example · ${direction}`, candles: data.map(c => ({ ...c, open: transform(c.open), close: transform(c.close), low: transform(direction === 'bullish' ? c.low : c.high), high: transform(direction === 'bullish' ? c.high : c.low) })) };
}
