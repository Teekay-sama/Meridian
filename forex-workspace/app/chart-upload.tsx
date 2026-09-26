'use client';
import {useEffect,useRef,useState} from 'react';
import type {ChartAnalysis} from '../lib/chart-analysis';
export default function ChartUpload(){
 const [image,setImage]=useState<{file:File;url:string}|null>(null),[context,setContext]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[configured,setConfigured]=useState<boolean|null>(null);
 const [result,setResult]=useState<{analysis:ChartAnalysis;analyzedAt:string}|null>(null);
 const abort=useRef<AbortController|null>(null);const version=useRef(0);const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{fetch('/api/chart-analysis').then(r=>r.json()).then((x:unknown)=>setConfigured(!!(x as {configured:boolean}).configured)).catch(()=>setConfigured(false));return()=>abort.current?.abort();},[]);
 useEffect(()=>()=>{if(image)URL.revokeObjectURL(image.url);},[image]);
 function clear(){version.current++;abort.current?.abort();setBusy(false);setImage(null);setResult(null);setError('');if(input.current)input.current.value='';}
 async function choose(file?:File){clear();if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024||!file.size){setError('Choose a PNG, JPEG or WebP image under 5 MB.');return;}
  const id=version.current;const url=URL.createObjectURL(file);const img=new Image();img.src=url;
  try{await img.decode();if(img.width<200||img.height<150||img.width*img.height>25000000)throw new Error();if(id!==version.current){URL.revokeObjectURL(url);return;}setImage({file,url});}catch{URL.revokeObjectURL(url);if(id===version.current)setError('Image could not be read. Use a clear chart between 200 × 150 pixels and 25 megapixels.');}
 }
 async function analyze(){if(!image||busy)return;setBusy(true);setResult(null);setError('');const id=++version.current;const controller=new AbortController();abort.current=controller;
  const form=new FormData();form.set('image',image.file);form.set('context',context);
  try{const r=await fetch('/api/chart-analysis',{method:'POST',body:form,signal:controller.signal});const data=await r.json() as {error?:string;analysis:ChartAnalysis;analyzedAt:string};if(!r.ok)throw new Error(data.error||'Analysis failed.');if(id===version.current)setResult(data);}catch(e){if(id===version.current&&!controller.signal.aborted)setError(e instanceof Error?e.message:'Analysis failed.');}finally{if(id===version.current)setBusy(false);}
 }
 return <section className="chart-upload panel" aria-labelledby="upload-title">
  <div className="upload-heading"><div><p className="eyebrow">BRING YOUR OWN CHART</p><h2 id="upload-title">A second look at your setup.</h2><p>Upload a chart screenshot to explore conditional entries, take-profit (TP) and stop-loss (SL) levels.</p></div><span className="sample-badge">MERIDIAN AI</span></div>
  <div className="upload-grid"><div>
   <label className="upload-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void choose(e.dataTransfer.files[0]);}}><strong>Choose or drop a chart screenshot</strong><span>PNG, JPEG or WebP · up to 5 MB</span><input ref={input} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Chart screenshot" onChange={e=>void choose(e.target.files?.[0])}/></label>
   {image&&<div className="upload-preview"><img src={image.url} alt="Your selected chart screenshot"/><div><span>{image.file.name}</span><button className="quiet" onClick={clear}>Remove screenshot</button></div></div>}
   <label className="upload-context">Pair, timeframe and screenshot time (optional)<textarea maxLength={500} value={context} placeholder="e.g. EUR/USD, 15m, captured today at 10:30 UTC" disabled={busy} onChange={e=>{setContext(e.target.value);setResult(null);}}/></label>
   <p className="section-note">Include the price axis and timeframe. Crop out account details. Clicking Analyze sends this screenshot and your context to our AI provider. Meridian does not save the image or analysis.</p>
   {configured===false&&<p className="upload-message" role="status">Meridian AI is not connected yet. Contact the workspace administrator to enable analysis.</p>}
   <div className="upload-actions"><button className="quiet" disabled={!image||busy||configured!==true} onClick={analyze}>{busy?'Meridian is analyzing…':'Analyze with Meridian'}</button>{busy&&<button className="quiet" onClick={()=>{version.current++;abort.current?.abort();setBusy(false);}}>Cancel</button>}</div>
   {busy&&<p role="status">Reading visible structure and checking possible levels…</p>}{error&&<p role="alert" className="upload-message">{error}</p>}
  </div><div className="upload-results" aria-live="polite">
   {!result?<div className="upload-empty"><h3>Evidence before an entry.</h3><p>Meridian AI will explain visible structure, possible confirmation triggers, and why a TP or SL level fits the chart. If prices are unclear or no setup stands out, it will say so.</p><p>A screenshot cannot establish current prices or whether a trade is still valid. Meridian AI can misread charts; verify every level on your platform.</p></div>:<><p className="eyebrow">MERIDIAN AI REVIEW · {new Date(result.analyzedAt).toLocaleString()}</p><h3>{result.analysis.setups.length?'Conditional trade scenarios':'No clear trade setup'}</h3><p>{result.analysis.summary}</p><ul>{result.analysis.observations.map((x,i)=><li key={i}>{x}</li>)}</ul>{result.analysis.setups.map((s,i)=><article className="trade-scenario" key={i}><h3>{s.direction==='long'?'Potential long':'Potential short'} · {s.strategy}</h3><dl className="trade-levels"><div><dt>Conditional entry</dt><dd>{s.entry}</dd></div><div><dt>Stop loss (SL)</dt><dd>{s.stopLoss}</dd></div><div><dt>Take profit (TP)</dt><dd>{s.takeProfit}</dd></div><div><dt>Reward / risk*</dt><dd>{(Math.abs(s.takeProfit-s.entry)/Math.abs(s.entry-s.stopLoss)).toFixed(2)} : 1</dd></div></dl><p><strong>Wait for: </strong>{s.trigger}</p><p><strong>Why these levels: </strong>{s.evidence}</p><p><strong>Invalid if: </strong>{s.invalidation}</p></article>)}<h3>Uncertainty and checks</h3><ul>{result.analysis.limitations.map((x,i)=><li key={i}>{x}</li>)}</ul><small>*Price-distance ratio only, before spread, fees and slippage. Conditional scenarios, not trade instructions or a profitability forecast.</small></>}
  </div></div>
 </section>;
}
