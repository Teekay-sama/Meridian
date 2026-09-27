import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
export default function LegalDocument({file}:{file:'TERMS-OF-USE.md'|'PRIVACY-NOTICE.md'}){
 const text=fs.readFileSync(path.join(process.cwd(),'legal',file),'utf8');
 const inline=(s:string)=>s.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part);
 return <main className="legal-document"><nav aria-label="Legal navigation"><Link href="/">← Market workspace</Link><Link href="/chart-review">Chart review</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></nav><article>{text.split(/\r?\n\r?\n/).map((block,i)=>block.startsWith('# ')?<h1 key={i}>{block.slice(2)}</h1>:block.startsWith('## ')?<h2 key={i}>{block.slice(3)}</h2>:<p key={i}>{inline(block)}</p>)}</article></main>;
}
