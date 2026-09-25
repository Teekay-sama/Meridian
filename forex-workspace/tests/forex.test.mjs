import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, sampleProvider, PAIRS, ema, duration, parsePreferences, defaults } from '../lib/forex.ts';
for (const interval of ['15m', '4h']) {
  for (const [i,pair] of PAIRS.entries()) {
    test(`${pair} ${interval} fixed sample outcome`,()=>{
      const series=sampleProvider.getSeries(pair,interval);
      assert.deepEqual(series,sampleProvider.getSeries(pair,interval));
      const result=analyze(series);
      assert.equal(result.candles.length,240);
      assert.equal(result.status,['Bullish setup','Bearish setup','No matching setup'][i]);
      if(i<2) assert.ok(result[i===0?'bullish':'bearish'].every(c=>c.pass));
    });
  }
}
test('EMA uses SMA seed and recursive smoothing',()=>assert.deepEqual(ema([1,2,3,4,5],3),[null,null,2,3,4]));
test('199 completed candles is insufficient; 200 is accepted',()=>{
  const s=sampleProvider.getSeries('EUR/USD','15m');
  assert.equal(analyze({...s,candles:s.candles.slice(-199)}).status,'Insufficient data');
  assert.notEqual(analyze({...s,candles:s.candles.slice(-200)}).status,'Insufficient data');
});
test('unfinished and future candles cannot alter a setup',()=>{
  const s=sampleProvider.getSeries('EUR/USD','15m'),expected=analyze(s);
  const extra={time:s.asOf,open:1,close:2,high:2,low:1};
  assert.deepEqual(analyze({...s,candles:[...s.candles,extra]}),expected);
  const reduced=analyze({...s,asOf:s.asOf-1});
  assert.equal(reduced.candles.length,239);
  assert.equal(analyze({...s,asOf:s.asOf-duration(s.interval)}).candles.length,239);
});
test('reject malformed OHLC, non-finite prices, duplicates and reversed data',()=>{
  const s=sampleProvider.getSeries('EUR/USD','15m');
  for(const patch of [{high:0},{low:9},{close:NaN},{time:-1},{open:Infinity}]){
    assert.throws(()=>analyze({...s,candles:[{...s.candles[0],...patch},...s.candles.slice(1)]}),/Invalid/);
  }
  assert.throws(()=>analyze({...s,candles:[...s.candles].reverse()}),/unordered/);
  assert.throws(()=>analyze({...s,candles:[s.candles[0],...s.candles]}),/unordered/);
});
test('strict confirmation rejects doji and equality to prior high',()=>{
  const s=sampleProvider.getSeries('EUR/USD','15m');
  const last=s.candles.at(-1),prior=s.candles.at(-2);
  last.close=prior.high;
  assert.equal(analyze(s).bullish[2].pass,false);
  last.open=last.close;
  assert.equal(analyze(s).bullish[2].pass,false);
});
test('pullback must come from previous three candles, not latest',()=>{
  const s=sampleProvider.getSeries('EUR/USD','15m');
  for(let i=236;i<=238;i++)s.candles[i].low=Math.min(s.candles[i].open,s.candles[i].close);
  s.candles[239].low=1;
  assert.equal(analyze(s).bullish[1].pass,false);
});
test('preferences handle corruption, invalid values, duplicates and empty watchlist',()=>{
  for(const raw of [null,'bad','{}',JSON.stringify({...defaults,pair:'INVALID'})])assert.deepEqual(parsePreferences(raw),defaults);
  assert.deepEqual(parsePreferences(JSON.stringify({...defaults,watchlist:[]})).watchlist,[]);
  assert.deepEqual(parsePreferences(JSON.stringify({...defaults,watchlist:['EUR/USD','EUR/USD']})).watchlist,['EUR/USD']);
});
test('flat prices seed both averages identically, avoiding phantom crossovers',()=>{
 const data=Array(240).fill(1.105);
 assert.equal(ema(data,20).at(-1),ema(data,50).at(-1));
 assert.equal(ema(data,20).at(-1),1.105);
});
