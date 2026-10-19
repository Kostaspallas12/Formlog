import Link from 'next/link';
import { SITE } from '@/lib/site';
import LogoMark from './Logo';

export default function Footer() {
  return (
    <footer className="foot wrap">
      <span className="logo small"><LogoMark size={25} /> {SITE.name}</span>
      <nav className="foot-links">
        <Link href="/privacy">Πολιτική απορρήτου</Link>
        <Link href="/terms">Όροι χρήσης</Link>
        <span className="meta">© {new Date().getFullYear()} {SITE.name}</span>
      </nav>
    </footer>
  );
}
