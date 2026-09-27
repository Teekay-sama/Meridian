import Link from 'next/link';
export default function LegalFooter(){return <div className="legal-footer" role="contentinfo" aria-label="Legal information"><span>© {new Date().getFullYear()} MOTHOSE ARC HOLDINGS</span><Link href="/terms">Terms of Use</Link><Link href="/privacy">Privacy Notice</Link><a href="mailto:Tinyikomothose@gmail.com">Contact</a></div>;}
