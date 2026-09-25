'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { analyze, defaults, PAIRS, parsePreferences, price, sampleProvider, STORAGE_KEY, type Analysis, type Pair, type Preferences } from '../lib/forex';
function Chart({ analysis, pair, show20, show50 }: {
    analysis: Analysis;
    pair: Pair;
    show20: boolean;
    show50: boolean;
}) {
    const [focus, setFocus] = useState(79);
    const container = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(810);
    useEffect(() => { const element = container.current; if (!element)
        return; const observer = new ResizeObserver(entries => setWidth(Math.max(280, entries[0].contentRect.width))); observer.observe(element); return () => observer.disconnect(); }, []);
    const count = width < 500 ? 36 : 80, active = Math.min(focus, count - 1);
    const candles = analysis.candles.slice(-count);
    const slow = analysis.ema50.slice(-count).filter((v): v is number => v !== null);
    const low = Math.min(...candles.map(c => c.low), ...slow), high = Math.max(...candles.map(c => c.high), ...slow);
    const pad = (high - low) * .12 || 1, bottom = low - pad, top = high + pad;
    const x = (i: number) => 18 + i * (width - 112) / (count - 1), y = (v: number) => 24 + (top - v) / (top - bottom) * 320;
    const selected = candles[active];
    const line = (values: (number | null)[]) => values.slice(-count).map((v, i) => v === null ? '' : `${x(i)},${y(v)}`).join(' ');
    const stamp = (time: number) => new Date(time).toISOString().slice(5, 16).replace('T', ' ');
    return <div className="chart-area"><div ref={container}>
    <div className="ohlc" aria-live="polite"><span>{stamp(selected.time)} UTC</span>{(['open', 'high', 'low', 'close'] as const).map(k => <span key={k}>{k[0].toUpperCase()} <b>{price(selected[k], pair)}</b></span>)}</div>
    <svg className="chart" viewBox={`0 0 ${width} 390`} role="img" aria-label={`${pair} last ${count} sample candles. Use left and right arrow keys to inspect.`} tabIndex={0} onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocus(Math.max(0, Math.min(count - 1, active + (e.key === 'ArrowLeft' ? -1 : 1))));
    } }} onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); setFocus(Math.max(0, Math.min(count - 1, Math.round(((e.clientX - r.left) / r.width * width - 18) / ((width - 112) / (count - 1)))))); }}>
      <title>{`${pair} synthetic candlestick chart with moving averages`}</title>
      {Array.from({ length: 6 }, (_, i) => { const v = bottom + (top - bottom) * i / 5; return <g key={i}><line x1="8" x2={width - 88} y1={y(v)} y2={y(v)} stroke="#263342" strokeDasharray="3 5"/><text x={width - 77} y={y(v) + 5}>{price(v, pair)}</text></g>; })}
      {candles.map((c, i) => <g key={c.time} fill={c.close >= c.open ? '#62cbb2' : '#d67d88'} stroke={c.close >= c.open ? '#62cbb2' : '#d67d88'}><line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)}/><rect x={x(i) - 2.5} y={y(Math.max(c.open, c.close))} width="5" height={Math.max(1, Math.abs(y(c.open) - y(c.close)))}/></g>)}
      {show50 && <polyline data-testid="ema50" points={line(analysis.ema50)} fill="none" stroke="#a796ed" strokeWidth="1.8"/>}
      {show20 && <polyline data-testid="ema20" points={line(analysis.ema20)} fill="none" stroke="#efc576" strokeWidth="1.8"/>}
      <line x1={x(active)} x2={x(active)} y1="18" y2="350" stroke="#a9b7cb" opacity=".5" strokeDasharray="4 4"/>
      {[0, Math.floor(count / 3), Math.floor(count * 2 / 3)].map(i => <text key={i} x={x(i)} y="379">{stamp(candles[i].time)}</text>)}
    </svg></div>
    <div className="chart-footer"><span>{count} of {analysis.candles.length} completed candles</span><span>Hover or use ← → to inspect · UTC</span></div>
  </div>;
}
export default function Home() {
    const [prefs, setPrefs] = useState<Preferences>(defaults), [ready, setReady] = useState(false), [notice, setNotice] = useState('');
    const [show20, setShow20] = useState(true), [show50, setShow50] = useState(true), [side, setSide] = useState<'bullish' | 'bearish'>('bullish');
    useEffect(() => { try {
        setPrefs(parsePreferences(localStorage.getItem(STORAGE_KEY)));
    }
    catch {
        setNotice('Browser storage is unavailable. Preferences will last for this visit.');
    } setReady(true); }, []);
    useEffect(() => { if (ready) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        }
        catch {
            setNotice('Preferences could not be saved in this browser.');
        }
    } }, [prefs, ready]);
    const series = useMemo(() => sampleProvider.getSeries(prefs.pair, prefs.interval), [prefs.pair, prefs.interval]);
    const analysis = useMemo(() => analyze(series), [series]);
    useEffect(() => { setSide(analysis.status === 'Bearish setup' ? 'bearish' : 'bullish'); }, [analysis.status]);
    useEffect(() => {
        const context = (document as Document & {
            modelContext?: {
                registerTool: (tool: unknown, options: {
                    signal: AbortSignal;
                }) => void | Promise<void>;
            };
        }).modelContext;
        if (!context)
            return;
        const lifecycle = new AbortController();
        try {
            void Promise.resolve(context.registerTool({ name: 'read_forex_analysis', description: 'Read the currently displayed sample forex analysis and checklist.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: (input: unknown) => { if (!input || typeof input !== 'object' || Object.keys(input).length)
                    throw new Error('Expected empty input'); return { pair: prefs.pair, interval: prefs.interval, source: series.source, asOf: series.asOf, status: analysis.status, bullish: analysis.bullish, bearish: analysis.bearish }; } }, { signal: lifecycle.signal })).catch(() => { });
        }
        catch { /* Optional browser capability. */ }
        return () => lifecycle.abort();
    }, [prefs.pair, prefs.interval, series, analysis]);
    const latest = series.candles.at(-1)!, previous = series.candles.at(-2)!, change = (latest.close - previous.close) / previous.close * 100;
    const checks = analysis[side], passed = checks.filter(c => c.pass).length;
    const toggleWatch = (pair: Pair) => setPrefs(p => ({ ...p, watchlist: p.watchlist.includes(pair) ? p.watchlist.filter(x => x !== pair) : [...p.watchlist, pair] }));
    return <main>
    <header className="topbar"><a className="brand" href="/" aria-label="Meridian home"><span className="brand-icon">M<span>↗</span></span>meridian<span className="brand-tag">RESEARCH</span></a><div className="workspace-label">Personal workspace <span className="local">LOCAL</span></div><button className="quiet" onClick={() => { setPrefs(defaults); setShow20(true); setShow50(true); setSide('bullish'); setNotice('Workspace reset to defaults.'); }}>Reset workspace</button></header>
    <div className="sample-banner"><span className="sample-badge">SAMPLE DATA</span><span>Sample data — not live prices</span><span className="banner-note">A space to explore the rules, one candle at a time.</span></div>
    <div className="page-heading"><div><p className="eyebrow">FOREX / ANALYSIS WORKSPACE</p><h1>Read the setup.</h1><p>Price action, clear conditions, and the evidence behind them.</p></div><div className="snapshot"><span>Sample snapshot</span><strong>24 Sep 2026 · 16:00 UTC</strong></div></div>
    <div className="workspace-grid">
      <aside className="watchlist panel"><div className="panel-heading"><h2>Watchlist</h2><span className="count">{prefs.watchlist.length}</span></div><p className="section-note">Your currency pairs</p>
        {prefs.watchlist.length === 0 && <p className="empty">No saved pairs. Add one below to keep it close.</p>}
        {prefs.watchlist.map(pair => { const s = sampleProvider.getSeries(pair, prefs.interval), c = s.candles.at(-1)!, p = s.candles.at(-2)!, up = c.close >= p.close; return <button key={pair} className={`pair-button ${prefs.pair === pair ? 'selected' : ''}`} aria-pressed={prefs.pair === pair} onClick={() => setPrefs(p => ({ ...p, pair }))}><span className="pair-top"><strong>{pair}</strong><span>{pair === 'EUR/USD' ? 'EU / US' : pair === 'GBP/USD' ? 'UK / US' : 'US / JP'}</span></span><span className="pair-bottom"><span>{price(c.close, pair)}</span><span className={up ? 'positive' : 'negative'}>{up ? '+' : ''}{((c.close - p.close) / p.close * 100).toFixed(2)}%</span></span></button>; })}
        <details className="manage"><summary>Manage watchlist</summary>{PAIRS.map(pair => <label key={pair}><input type="checkbox" checked={prefs.watchlist.includes(pair)} onChange={() => toggleWatch(pair)}/>{pair}</label>)}</details>
        <div className="sidebar-bottom"><span className="eyebrow">YOUR WORKSPACE</span><p>Saved on this browser</p><small>Watchlist and preferences stay on this device. No account needed.</small></div>
      </aside>
      <section className="market-column"><div className="chart-panel panel"><div className="market-heading"><div><label className="eyebrow" htmlFor="pair">CURRENCY PAIR</label><select id="pair" value={prefs.pair} onChange={e => setPrefs(p => ({ ...p, pair: e.target.value as Pair }))}>{PAIRS.map(p => <option key={p}>{p}</option>)}</select><span className="instrument">{prefs.pair === 'EUR/USD' ? 'Euro / US Dollar' : prefs.pair === 'GBP/USD' ? 'British Pound / US Dollar' : 'US Dollar / Japanese Yen'}</span></div><div className="quote"><strong>{price(latest.close, prefs.pair)}</strong><span className={change >= 0 ? 'positive' : 'negative'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}% <span className="muted">last candle</span></span></div></div>
        <div className="chart-toolbar"><div className="segmented" aria-label="Analysis timeframe">{(['15m', '4h'] as const).map(interval => <button key={interval} aria-pressed={prefs.interval === interval} className={prefs.interval === interval ? 'active' : ''} onClick={() => setPrefs(p => ({ ...p, interval }))}>{interval === '15m' ? 'Intraday · 15m' : 'Swing · 4h'}</button>)}</div><div className="overlays"><label className="ema20"><input type="checkbox" checked={show20} onChange={e => setShow20(e.target.checked)}/>EMA 20</label><label className="ema50"><input type="checkbox" checked={show50} onChange={e => setShow50(e.target.checked)}/>EMA 50</label></div></div>
        <Chart key={`${prefs.pair}-${prefs.interval}`} analysis={analysis} pair={prefs.pair} show20={show20} show50={show50}/>
      </div><div className="below-chart"><div className="panel method-card"><span className="eyebrow">THE METHOD</span><h2>Trend. Pullback. Confirmation.</h2><p>Look for an established trend, a return to the 20-period moving average, and a completed candle that confirms direction.</p><div className="method-tags"><span>EMA 20 / 50</span><span>3-candle pullback window</span><span>Closed candles only</span></div></div><div className="panel data-card"><span className="eyebrow">DATA DETAILS</span><dl><div><dt>Source</dt><dd>Synthetic sample</dd></div><div><dt>Candles</dt><dd>{analysis.candles.length} completed</dd></div><div><dt>Interval</dt><dd>{prefs.interval === '15m' ? '15 minutes' : '4 hours'}</dd></div><div><dt>Timezone</dt><dd>UTC</dd></div></dl></div></div></section>
      <aside className="analysis-panel panel"><div className="panel-heading"><h2>Setup checklist</h2><span className="count">01</span></div><p className="section-note">Trend-pullback · starter rules</p><div className={`setup-status ${analysis.status === 'Bullish setup' ? 'bull' : analysis.status === 'Bearish setup' ? 'bear' : 'neutral'}`} aria-live="polite"><span className="eyebrow">LATEST COMPLETED CANDLE</span><h3>{analysis.status === 'Bullish setup' ? '↗ ' : analysis.status === 'Bearish setup' ? '↘ ' : '— '}{analysis.status}</h3><p>{analysis.status === 'No matching setup' ? 'Neither direction meets all three conditions.' : 'All three conditions align in this sample.'}</p></div>
        <div className="segmented direction">{(['bullish', 'bearish'] as const).map(s => <button key={s} className={side === s ? 'active' : ''} aria-pressed={side === s} onClick={() => setSide(s)}>{s === 'bullish' ? 'Bullish rules' : 'Bearish rules'}</button>)}</div><div className="progress-label"><span>Conditions met</span><strong>{passed} / 3</strong></div><div className="progress-track"><span style={{ width: `${passed / 3 * 100}%` }}/></div>
        <ol className="checks">{checks.map((check, i) => <li key={check.name}><div className={`check-icon ${check.pass ? 'pass' : ''}`}>{check.pass ? '✓' : '−'}</div><div><div className="check-title"><h3>{i + 1}. {check.name}</h3><span>{check.pass ? 'PASS' : 'FAIL'}</span></div><p>{check.detail}</p></div></li>)}</ol>
        <div className="analysis-time">Evaluated at sample close<br /><strong>{new Date(series.asOf).toISOString().slice(0, 16).replace('T', ' ')} UTC</strong></div><p className="strategy-note">An illustrative ruleset, not a validated trading strategy. A matching setup does not establish profitability.</p>
      </aside>
    </div><footer><span>MERIDIAN <span className="muted">/ Forex research prototype</span></span><span>Local workspace · Synthetic data · v0.1</span></footer>
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}
  </main>;
}
