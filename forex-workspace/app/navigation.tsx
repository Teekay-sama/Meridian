'use client';
import Link from 'next/link';
import Tutorial from './tutorial';
import {usePathname} from 'next/navigation';
export default function Navigation(){
 const path=usePathname();
 return <nav className="workspace-menu" aria-label="Main navigation">
  <Link href="/" aria-current={path==='/'?'page':undefined}>Market workspace</Link>
  <Link href="/chart-review" aria-current={path==='/chart-review'?'page':undefined}>Chart review</Link>
  <Tutorial key={path} reviewPage={path==='/chart-review'} />
 </nav>;
}
