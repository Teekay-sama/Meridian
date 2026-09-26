import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTwelveData} from '../lib/twelve-data.ts';
import {sampleProvider} from './fixtures.ts';
const s=sampleProvider.getSeries('EUR/USD','15m');
const payload=()=>({status:'ok',meta:{symbol:s.pair,interval:'15min'},values:[...s.candles].reverse().map(c=>({datetime:new Date(c.time).toISOString().slice(0,19).replace('T',' '),open:String(c.open),high:String(c.high),low:String(c.low),close:String(c.close)}))});
test('provider parses UTC, numeric strings and descending data',()=>{assert.deepEqual(parseTwelveData(payload(),s.pair,s.interval,s.asOf).candles,s.candles);});
test('provider removes unfinished candle',()=>{assert.equal(parseTwelveData(payload(),s.pair,s.interval,s.asOf-1).candles.length,239);});
test('provider rejects errors, mismatches, duplicates, malformed prices and future timestamps',()=>{
 const variants=[p=>p.status='error',p=>p.meta.symbol='GBP/USD',p=>p.values.reverse(),p=>p.values[0].high='bad',p=>p.values[0].datetime='2030-01-01 00:00:00',p=>p.values[0]=p.values[1]];
 for(const mutate of variants){const p=payload();mutate(p);assert.throws(()=>parseTwelveData(p,s.pair,s.interval,s.asOf));}
});
