import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="foot wrap">
      <span className="logo small"><i aria-hidden="true" /> {SITE.name}</span>
      <nav className="foot-links">
        <Link href="/privacy">Πολιτική απορρήτου</Link>
        <Link href="/terms">Όροι χρήσης</Link>
        <span className="meta">© {new Date().getFullYear()} {SITE.name}</span>
      </nav>
    </footer>
  );
}
