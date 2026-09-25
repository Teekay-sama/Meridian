import test from 'node:test';
import assert from 'node:assert/strict';
import {STRATEGIES,teachingSeries,evaluateStrategy} from '../lib/strategies.ts';
import {PAIRS,parsePreferences,defaults,sampleProvider} from '../lib/forex.ts';
for(const strategy of STRATEGIES){
 for(const direction of ['bullish','bearish']){
  test(`${strategy.id}: ${direction} examples work for every pair and interval`,()=>{
   for(const pair of PAIRS)for(const interval of ['15m','4h']){
    const series=teachingSeries(pair,interval,strategy.id,direction),a=evaluateStrategy(series,strategy.id);
    assert.equal(a.status,direction==='bullish'?'Bullish setup':'Bearish setup',`${pair} ${interval}`);
    assert.ok(a[direction].every(c=>c.pass));
    assert.ok(a[direction==='bullish'?'bearish':'bullish'].some(c=>!c.pass));
    assert.deepEqual(series,teachingSeries(pair,interval,strategy.id,direction));
   }
  });
 }
 test(`${strategy.id}: insufficient and unfinished data are handled consistently`,()=>{
  const s=teachingSeries('EUR/USD','15m',strategy.id,'bullish'),expected=evaluateStrategy(s,strategy.id);
  const unfinished={time:s.asOf,open:2,high:9,low:1,close:8};
  assert.deepEqual(evaluateStrategy({...s,candles:[...s.candles,unfinished]},strategy.id),expected);
  assert.equal(evaluateStrategy({...s,candles:s.candles.slice(-199)},strategy.id).status,'Insufficient data');
  const invalid=structuredClone(s);invalid.candles[0].high=0;
  assert.throws(()=>evaluateStrategy(invalid,strategy.id),/Invalid/);
 });
}
test('strategy changes evaluate the same base candles without mutating them',()=>{
 const s=sampleProvider.getSeries('EUR/USD','15m'),original=structuredClone(s);
 for(const strategy of STRATEGIES)evaluateStrategy(s,strategy.id);
 assert.deepEqual(s,original);
});
test('old preferences migrate and unknown strategies fall back safely',()=>{
 const old={pair:'GBP/USD',interval:'4h',watchlist:['GBP/USD']};
 assert.deepEqual(parsePreferences(JSON.stringify(old)),{...old,strategy:'trend-pullback'});
 assert.equal(parsePreferences(JSON.stringify({...defaults,strategy:'bad'})).strategy,'trend-pullback');
 assert.equal(parsePreferences(JSON.stringify({...defaults,strategy:'smc-fvg'})).strategy,'smc-fvg');
 assert.throws(()=>evaluateStrategy(sampleProvider.getSeries('EUR/USD','15m'),'unknown'),/Unknown/);
});
test('breakout requires a close beyond the prior range, not a wick or equality',()=>{
 const s=teachingSeries('EUR/USD','15m','range-breakout','bullish');
 const level=evaluateStrategy(s,'range-breakout').levels.find(x=>x.label==='Resistance').value;
 s.candles.at(-1).close=level;
 assert.equal(evaluateStrategy(s,'range-breakout').bullish[1].pass,false);
 s.candles.at(-1).close=level-.0001;
 assert.equal(evaluateStrategy(s,'range-breakout').status,'No matching setup');
});
test('sweep must pierce and reclaim on the previous candle',()=>{
 const s=teachingSeries('EUR/USD','15m','smc-sweep','bullish');
 const support=evaluateStrategy(s,'smc-sweep').levels.find(x=>x.label==='Support').value;
 s.candles.at(-2).close=support;
 assert.equal(evaluateStrategy(s,'smc-sweep').bullish[1].pass,false);
 s.candles.at(-2).close=support+.0001;s.candles.at(-2).low=support;
 assert.equal(evaluateStrategy(s,'smc-sweep').bullish[1].pass,false);
});
test('bounce needs repeated reference touches and stays inside the range',()=>{
 const s=teachingSeries('EUR/USD','15m','support-resistance','bullish');
 const first=s.candles.length-22;const support=evaluateStrategy(s,'support-resistance').levels.find(x=>x.label==='Support').value;s.candles[first+1].low=support-.001;
 assert.equal(evaluateStrategy(s,'support-resistance').bullish[0].pass,false);
 const b=teachingSeries('EUR/USD','15m','support-resistance','bullish');b.candles.at(-1).close=2;b.candles.at(-1).high=2;
 assert.equal(evaluateStrategy(b,'support-resistance').bullish[2].pass,false);
});
test('crossover is new on the latest candle, not a continuing trend',()=>{
 const s=teachingSeries('EUR/USD','15m','ema-crossover','bullish');
 s.candles.at(-2).close=s.candles.at(-1).close;s.candles.at(-2).high=s.candles.at(-1).high;
 assert.equal(evaluateStrategy(s,'ema-crossover').bullish[0].pass,false);
});
for(const direction of ['bullish','bearish'])test(`FVG ${direction}: prior touch, far-edge invalidation, or lack of retest prevents match`,()=>{
 const s=teachingSeries('EUR/USD','15m','smc-fvg',direction),a=evaluateStrategy(s,'smc-fvg');
 const lower=a.levels.find(x=>x.label===`${direction==='bullish'?'Bull':'Bear'} FVG lower`).value;
 const upper=a.levels.find(x=>x.label===`${direction==='bullish'?'Bull':'Bear'} FVG upper`).value;
 const touched=structuredClone(s);if(direction==='bullish')touched.candles.at(-2).low=upper;else touched.candles.at(-2).high=lower;
 assert.equal(evaluateStrategy(touched,'smc-fvg')[direction][0].pass,false);
 const invalid=structuredClone(s);if(direction==='bullish')invalid.candles.at(-1).low=lower-.0001;else invalid.candles.at(-1).high=upper+.0001;
 assert.equal(evaluateStrategy(invalid,'smc-fvg')[direction][2].pass,false);
 const miss=structuredClone(s),last=miss.candles.at(-1);
 if(direction==='bullish'){last.low=upper+.0001;last.open=last.low;}else{last.high=lower-.0001;last.open=last.high;}
 assert.equal(evaluateStrategy(miss,'smc-fvg')[direction][1].pass,false);
});
