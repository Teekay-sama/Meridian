import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
export default function LegalDocument({file}:{file:'TERMS-OF-USE-DRAFT.md'|'PRIVACY-NOTICE-DRAFT.md'}){
 const text=fs.readFileSync(path.join(process.cwd(),'legal',file),'utf8');
 const inline=(s:string)=>s.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part);
 return <main className="legal-document"><nav aria-label="Legal navigation"><Link href="/">← Market workspace</Link><Link href="/chart-review">Chart review</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></nav><p className="legal-draft" role="note">Review copy — not approved. Acceptance is disabled. These drafts do not establish prior user agreement.</p><article>{text.split(/\r?\n\r?\n/).map((block,i)=>block.startsWith('# ')?<h1 key={i}>{block.slice(2)}</h1>:block.startsWith('## ')?<h2 key={i}>{block.slice(3)}</h2>:<p key={i}>{inline(block)}</p>)}</article></main>;
}
