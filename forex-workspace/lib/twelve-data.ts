import { analyze, PAIRS, type Pair, type Interval, type MarketSeries } from './forex.ts';
export function parseTwelveData(payload: unknown, pair: Pair, interval: Interval, asOf: number): MarketSeries {
  const p = payload as {status?: string; meta?: {symbol?: string; interval?: string}; values?: Record<string, string>[]};
  if (p?.status !== 'ok' || p.meta?.symbol !== pair || p.meta?.interval !== (interval === '15m' ? '15min' : '4h') || !Array.isArray(p.values) || !p.values.length) throw new Error('Provider returned an unexpected data response.');
  const candles = p.values.map(c => {
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(c.datetime)) throw new Error('Invalid provider timestamp.');
    const time = Date.parse(c.datetime.replace(' ', 'T') + 'Z');
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,19).replace('T',' ') !== c.datetime || time > asOf) throw new Error('Invalid or future provider timestamp.');
    const prices = ['open','high','low','close'].map(k => typeof c[k] === 'string' && c[k].trim() ? Number(c[k]) : NaN);
    return {time, open:prices[0], high:prices[1], low:prices[2], close:prices[3]};
  });
  for (let i=1;i<candles.length;i++) if (candles[i].time >= candles[i-1].time) throw new Error('Provider candles are unordered or duplicated.');
  const series = {pair, interval, source:'Twelve Data', asOf, candles:candles.reverse()};
  const checked = analyze(series);
  return {...series, candles:checked.candles};
}
