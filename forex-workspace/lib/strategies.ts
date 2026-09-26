import { analyze, ema, price, STRATEGY_IDS, type Analysis, type Check, type MarketSeries, type Pair, type Interval, type StrategyId } from './forex.ts';
type Strategy = {
    id: StrategyId;
    name: string;
    level: string;
    idea: string;
    steps: string[];
    rules: string;
    limitation: string;
    glossary: [
        string,
        string
    ][];
    source: {
        label: string;
        url: string;
    };
};
const supportSource = { label: 'IG: Support and resistance', url: 'https://www.ig.com/au/trading-strategies/support-and-resistance-levels-explained-181219' };
const indicatorSource = { label: 'OANDA: Technical indicators', url: 'https://www.oanda.com/us-en/skills-and-insights/education/technical-analysis/indicators-and-oscillators/how-to-integrate-forex-indicators/' };
export const STRATEGIES: Strategy[] = [
    { id: 'trend-pullback', name: 'Trend pullback', level: 'Start here', idea: 'Follow an existing direction, wait for a small move against it, then look for the original direction to resume.', steps: ['Check the direction of the two moving-average lines.', 'Look for a recent candle touching the faster line.', 'Wait for a completed candle to confirm the original direction.'], rules: 'EMA 20 above EMA 50 and close above EMA 50 for bullish; one of the previous 3 candle ranges spans its EMA 20 and closes above its EMA 50; latest close above its open, previous high and EMA 20. Bearish mirrors these conditions.', limitation: 'A trend can end just as a pullback appears. Moving averages react after prices change.', glossary: [['EMA', 'Exponential moving average: a smoothed price line that gives newer closes more weight.'], ['Pullback', 'A temporary move against the direction of a trend.']], source: indicatorSource },
    { id: 'support-resistance', name: 'Support & resistance bounce', level: 'Beginner', idea: 'Imagine a floor and a ceiling. Look for price to test one of these boundaries and move back into the range.', steps: ['Find a floor or ceiling that has been tested at least twice.', 'Check whether the previous candle touched that boundary and closed back inside.', 'Look for the latest candle to move away from the boundary.'], rules: 'Reference range: 20 candles before the previous candle. Support is its lowest low; resistance its highest high. A touch is within 10% of the mean candle range. At least 2 reference touches are required at the relevant boundary. Previous candle must intersect the boundary band and close inside the range. Latest candle must close beyond the previous high (bullish) or low (bearish), with a matching body direction, while remaining inside the range.', limitation: 'These are mechanical local levels, not hand-picked major levels. A price boundary can break instead of holding.', glossary: [['Support', 'A price area where downward moves previously paused.'], ['Resistance', 'A price area where upward moves previously paused.'], ['Rejection', 'Price reaches an area and closes back away from it.']], source: supportSource },
    { id: 'range-breakout', name: 'Range breakout', level: 'Beginner', idea: 'Look for price to leave a recent range, instead of bouncing between its floor and ceiling.', steps: ['Mark the highest and lowest prices of the previous 20 completed candles.', 'Check that the previous close was still inside this range.', 'Look for a directional candle closing beyond the boundary.'], rules: 'Range uses the 20 candles immediately before the latest. Previous close must be inside that range. Bullish: latest close strictly above its highest high and above latest open. Bearish: latest close strictly below its lowest low and below latest open. This detects a first closing breakout, not a retest or a volume-confirmed breakout.', limitation: 'A close outside a range can still reverse. There is no volume filter or future confirmation in this version.', glossary: [['Range', 'The recent high-to-low price interval.'], ['Breakout', 'A close beyond a previously defined price boundary.'], ['False breakout', 'Price leaves a range but then returns rather than continuing.']], source: { label: 'IG: Breakout trading', url: 'https://www.ig.com/au/learn-to-trade/ig-academy/shorts/how-to-trade-breakouts' } },
    { id: 'ema-crossover', name: 'Moving-average crossover', level: 'Beginner', idea: 'Watch a faster price line cross a slower one. The change can help illustrate a shift in recent price direction.', steps: ['Compare the two lines on the previous candle.', 'Check whether EMA 20 has just crossed EMA 50.', 'Look for the latest close on the new side of both lines.'], rules: 'Bullish: previous EMA 20 <= previous EMA 50, latest EMA 20 > latest EMA 50, latest close > both lines. Bearish mirrors these comparisons. A crossover must occur on the latest completed candle; an old crossover does not count.', limitation: 'Sideways markets can produce repeated crosses that quickly reverse. A cross alone is not evidence of a profitable trade.', glossary: [['Fast average', 'EMA 20, which responds to changes more quickly.'], ['Slow average', 'EMA 50, which smooths prices over a longer period.'], ['Crossover', 'The fast line moves from one side of the slow line to the other.']], source: indicatorSource },
    { id: 'smc-sweep', name: 'SMC · Liquidity sweep', level: 'Intermediate', idea: 'Watch price briefly move beyond a repeatedly tested boundary, return inside, and then move in the opposite direction.', steps: ['Find at least two similar lows or highs in the reference range.', 'Look for the previous candle to pierce that boundary and close back inside.', 'Wait for the latest candle to confirm movement away from the sweep.'], rules: 'Uses the same 20-candle reference range and 10%-of-mean-range touch band as the bounce strategy. Bullish: at least 2 low touches, previous low strictly below support and previous close above support, latest bullish close above previous high. Bearish: repeated highs, previous high strictly above resistance and close below it, latest bearish close below previous low. The reclaim must occur on the previous candle.', limitation: 'SMC means Smart Money Concepts. This simplified sweep-and-rejection pattern does not prove stop orders were triggered or reveal who traded. It does not implement the full SMC framework or a break-of-structure model.', glossary: [['Liquidity', 'The ability to transact; SMC discussions often focus on possible orders near highs and lows.'], ['Sweep', 'Here: a wick moves beyond a reference level but its candle closes back inside.'], ['Reclaim', 'A close back across the level after briefly passing it.']], source: { label: 'FXOpen: Liquidity sweep concepts', url: 'https://fxopen.com/blog/en/trading-strategies-for-different-liquidity-conditions/' } },
    { id: 'smc-fvg', name: 'SMC · Fair-value-gap retest', level: 'Intermediate', idea: 'Find a three-candle price gap after a strong move, then check whether price revisits that area and closes back out in the original direction.', steps: ['Locate a qualifying three-candle gap after a large middle candle.', 'Wait for the latest candle to revisit the untouched gap.', 'Look for a close back beyond the gap in the original direction.'], rules: 'Search gap-ending candles 2–20 bars before the latest, newest first. Bullish gap: first high < third low; middle candle bullish with body >= 1.5 times the average body of its prior 20 candles. Bearish mirrors this. Reject gaps touched by any intervening candle after formation. Choose the newest eligible gap per direction. Latest candle must intersect the gap and close strictly beyond its near edge with matching body direction. Invalidation: bullish low below the far edge, or bearish high above the far edge, on the retest candle.', limitation: 'A fair value gap is a chart pattern, not a measured fair price. This is one explicit FVG variant; it does not establish institutional intent or promise that gaps will be revisited.', glossary: [['FVG', 'Fair value gap: a price band between the first and third candle ranges of a three-candle move.'], ['Displacement', 'Here: a middle candle whose body is at least 1.5 times the recent average body.'], ['Retest', 'Price returns to a previously identified area.']], source: { label: 'HowToTrade: Fair value gaps', url: 'https://howtotrade.com/wp-content/uploads/2023/08/Fair-Value-Gap-Trading.pdf' } },
];
export const strategyById = (id: StrategyId) => STRATEGIES.find(s => s.id === id)!;
export type Level = {
    label: string;
    value: number;
    color: string;
    from: number;
};
export type StrategyAnalysis = Analysis & {
    strategy: StrategyId;
    levels: Level[];
};
export function evaluateStrategy(series: MarketSeries, strategy: StrategyId): StrategyAnalysis {
    if (!STRATEGY_IDS.includes(strategy))
        throw new Error('Unknown strategy');
    const base = analyze(series), levels: Level[] = [];
    if (strategy === 'trend-pullback' || base.status === 'Insufficient data')
        return { ...base, strategy, levels };
    const c = base.candles, n = c.length - 1, last = c[n], prev = c[n - 1], p = (v: number) => price(v, series.pair);
    const range = c.slice(strategy === 'range-breakout' ? n - 20 : n - 21, strategy === 'range-breakout' ? n : n - 1);
    const support = Math.min(...range.map(x => x.low)), resistance = Math.max(...range.map(x => x.high));
    const tolerance = range.reduce((sum, x) => sum + x.high - x.low, 0) / range.length * .1;
    if (['support-resistance', 'range-breakout', 'smc-sweep'].includes(strategy))
        levels.push({ label: 'Support', value: support, color: '#70cfba', from: range[0].time }, { label: 'Resistance', value: resistance, color: '#e6a0ad', from: range[0].time });
    function checks(bull: boolean): Check[] {
        const beyond = (a: number, b: number) => bull ? a > b : a < b, body = beyond(last.close, last.open), boundary = bull ? support : resistance;
        const confirms = body && beyond(last.close, bull ? prev.high : prev.low);
        const touches = range.filter(x => Math.abs((bull ? x.low : x.high) - boundary) <= tolerance).length;
        const inside = (close: number) => close > support && close < resistance;
        if (strategy === 'support-resistance')
            return [
                { name: 'A repeatedly tested boundary', pass: touches >= 2, detail: `${touches} touches near ${bull ? 'support' : 'resistance'} ${p(boundary)}; need at least 2, within ${p(tolerance)}.` },
                { name: 'Previous candle rejects the level', pass: prev.low <= boundary + tolerance && prev.high >= boundary - tolerance && inside(prev.close), detail: `Previous range ${p(prev.low)}–${p(prev.high)} must touch the boundary band; close ${p(prev.close)} must be inside ${p(support)}–${p(resistance)}.` },
                { name: 'Price moves back into the range', pass: confirms && inside(last.close), detail: `Latest close ${p(last.close)} must be ${bull ? 'above' : 'below'} previous ${bull ? 'high' : 'low'} ${p(bull ? prev.high : prev.low)}, with a ${bull ? 'bullish' : 'bearish'} body, and remain inside the range.` },
            ];
        if (strategy === 'range-breakout')
            return [
                { name: 'Previous close inside the range', pass: prev.close >= support && prev.close <= resistance, detail: `Previous close ${p(prev.close)}; 20-candle range ${p(support)}–${p(resistance)}.` },
                { name: 'Latest close breaks the boundary', pass: beyond(last.close, bull ? resistance : support), detail: `Close ${p(last.close)} must be ${bull ? 'above resistance' : 'below support'} ${p(bull ? resistance : support)}. A wick alone does not count.` },
                { name: 'Candle body agrees', pass: body, detail: `Close ${p(last.close)} must be ${bull ? 'above' : 'below'} open ${p(last.open)}.` },
            ];
        if (strategy === 'ema-crossover')
            return [
                { name: 'Fast line starts on the old side', pass: bull ? base.ema20[n - 1]! <= base.ema50[n - 1]! : base.ema20[n - 1]! >= base.ema50[n - 1]!, detail: `Previous EMA 20 ${p(base.ema20[n - 1]!)} must be ${bull ? 'at or below' : 'at or above'} EMA 50 ${p(base.ema50[n - 1]!)}.` },
                { name: 'Fast line crosses on this candle', pass: beyond(base.ema20[n]!, base.ema50[n]!), detail: `Latest EMA 20 ${p(base.ema20[n]!)} must be ${bull ? 'above' : 'below'} EMA 50 ${p(base.ema50[n]!)}.` },
                { name: 'Close supports the new direction', pass: beyond(last.close, base.ema20[n]!) && beyond(last.close, base.ema50[n]!), detail: `Close ${p(last.close)} must be ${bull ? 'above' : 'below'} both moving averages.` },
            ];
        if (strategy === 'smc-sweep')
            return [
                { name: 'A repeatedly tested boundary', pass: touches >= 2, detail: `${touches} touches near ${p(boundary)}; need at least 2 within ${p(tolerance)}. This is a price pattern, not observed orders.` },
                { name: 'Previous candle sweeps and reclaims', pass: (bull ? prev.low < support : prev.high > resistance) && beyond(prev.close, boundary), detail: `Previous ${bull ? 'low' : 'high'} ${p(bull ? prev.low : prev.high)} must pierce ${p(boundary)}; close ${p(prev.close)} must return ${bull ? 'above' : 'below'} it.` },
                { name: 'Latest candle confirms the rejection', pass: confirms, detail: `Close ${p(last.close)} must be ${bull ? 'above previous high' : 'below previous low'} ${p(bull ? prev.high : prev.low)} with a ${bull ? 'bullish' : 'bearish'} body.` },
            ];
        let gap: {
            lower: number;
            upper: number;
            index: number;
        } | undefined;
        for (let k = n - 2; k >= n - 20; k--) {
            const first = c[k - 2], middle = c[k - 1], third = c[k];
            const lower = bull ? first.high : third.high, upper = bull ? third.low : first.low;
            const average = c.slice(k - 21, k - 1).reduce((sum, x) => sum + Math.abs(x.close - x.open), 0) / 20;
            const impulse = beyond(middle.close, middle.open) && Math.abs(middle.close - middle.open) >= 1.5 * average;
            const untouched = c.slice(k + 1, n).every(x => bull ? x.low > upper : x.high < lower);
            if (lower < upper && impulse && untouched) {
                gap = { lower, upper, index: k };
                break;
            }
        }
        if (gap)
            levels.push({ label: `${bull ? 'Bull' : 'Bear'} FVG lower`, value: gap.lower, color: '#d3b8ff', from: c[gap.index].time }, { label: `${bull ? 'Bull' : 'Bear'} FVG upper`, value: gap.upper, color: '#d3b8ff', from: c[gap.index].time });
        const intersects = !!gap && last.low <= gap.upper && last.high >= gap.lower;
        const holds = !!gap && (bull ? last.low >= gap.lower : last.high <= gap.upper);
        return [
            { name: 'An untouched gap follows a strong move', pass: !!gap, detail: gap ? `Eligible ${bull ? 'bullish' : 'bearish'} gap ${p(gap.lower)}–${p(gap.upper)}, formed ${n - gap.index} candles ago.` : 'No eligible untouched gap from 2–20 candles ago meets the displacement rule.' },
            { name: 'Latest candle revisits the gap', pass: intersects, detail: `Latest range ${p(last.low)}–${p(last.high)} must intersect the highlighted gap.` },
            { name: 'Gap holds and price closes away', pass: !!gap && holds && body && beyond(last.close, bull ? gap.upper : gap.lower), detail: gap ? `Close ${p(last.close)} must be ${bull ? 'above' : 'below'} ${p(bull ? gap.upper : gap.lower)} with a matching body; wick must not pass the far edge ${p(bull ? gap.lower : gap.upper)}.` : 'A qualifying gap is needed before rejection can be checked.' },
        ];
    }
    const bullish = checks(true), bearish = checks(false);
    return { ...base, strategy, levels, bullish, bearish, status: bullish.every(x => x.pass) ? 'Bullish setup' : bearish.every(x => x.pass) ? 'Bearish setup' : 'No matching setup' };
}
