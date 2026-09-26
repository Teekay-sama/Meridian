import { PAIRS, type Pair, type Interval, type MarketSeries } from '../../../lib/forex';
import { parseTwelveData } from '../../../lib/twelve-data';
const cache = new Map<string, MarketSeries>();
const pending = new Map<string, Promise<MarketSeries>>();
let calls: number[] = [];
let dailyCalls = 0, day = '';
export async function GET(request: Request) {
  const url = new URL(request.url), pair = url.searchParams.get('pair') as Pair, interval = url.searchParams.get('interval') as Interval;
  const headers = {'Cache-Control':'no-store'};
  if (!PAIRS.includes(pair) || !['15m','4h'].includes(interval)) return Response.json({error:'Unsupported pair or interval.'}, {status:400, headers});
  const key = process.env.TWELVE_DATA_API_KEY as string | undefined;
  if (!key) return Response.json({error:'Twelve Data API key is not configured on the server.'}, {status:503, headers});
  const id = pair + interval, now = Date.now(), cached = cache.get(id);
  if (cached && now - cached.asOf < 300000) return Response.json(cached, {headers});
  try {
    let work = pending.get(id);
    if (!work) {
      calls = calls.filter(t => now-t < 60000);
      const today = new Date(now).toISOString().slice(0,10);
      if (day !== today) {day=today; dailyCalls=0;}
      if (calls.length >= 7 || dailyCalls >= 750) return Response.json({error:'Market data request limit reached. Please wait before refreshing.'}, {status:429, headers});
      calls.push(now); dailyCalls++;
      work = (async () => {
        const endpoint = new URL('https://api.twelvedata.com/time_series');
        endpoint.search = new URLSearchParams({symbol:pair, interval:interval === '15m' ? '15min' : '4h', outputsize:'500', timezone:'UTC', order:'desc'}).toString();
        const r = await fetch(endpoint, {headers:{Authorization:`apikey ${key}`}, signal:AbortSignal.timeout(15000)});
        const payload = await r.json() as {status?:string;code?:number};
        if (!r.ok || payload.status !== 'ok') throw new Error(r.status === 429 || payload.code === 429 ? 'Provider rate limit reached. Please try again later.' : 'Twelve Data could not supply candles. Check your key and plan permissions.');
        const result = parseTwelveData(payload, pair, interval, Date.now());
        cache.set(id,result);
        return result;
      })();
      pending.set(id,work);
    }
    try {return Response.json(await work, {headers});} finally {pending.delete(id);}
  } catch (e) {
    const message = e instanceof Error && /^(Provider|Invalid|Twelve Data)/.test(e.message) ? e.message : 'Market data request failed or timed out. Please retry.';
    return Response.json({error:message}, {status:502, headers});
  }
}
