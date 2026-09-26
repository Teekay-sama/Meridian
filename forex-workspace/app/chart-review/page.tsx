import ChartUpload from '../chart-upload';
import Navigation from '../navigation';
export default function ChartReviewPage(){
 return <main>
  <header className="topbar"><a className="brand" href="/" aria-label="Meridian Trading Assistant home"><img className="brand-art" src="/meridian-mark.png" alt="" width={1254} height={1254}/><span className="brand-wordmark"><strong>MERIDIAN</strong><span>TRADING ASSISTANT</span></span></a><div className="workspace-label">Personal workspace <span className="local">LOCAL</span></div></header>
  <Navigation />
  <div className="page-heading"><div><p className="eyebrow">FOREX / CHART REVIEW</p><h1>Bring your own chart.</h1><p>Explore the structure, understand the evidence, and review possible setups.</p></div></div>
  <ChartUpload />
  <footer><span>MERIDIAN <span className="muted">/ Trading Assistant</span></span><span>Screenshot analysis · Local workspace</span></footer>
 </main>;
}
