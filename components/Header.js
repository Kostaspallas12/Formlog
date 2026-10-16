'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Header() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="top">
      <div className="wrap">
        <Link href={user ? '/dashboard' : '/'} className="logo"><i aria-hidden="true" /> FormLog</Link>

        {ready && (
          <nav className="row">
            {user ? (
              <>
                <Link href="/account" className="who" title="Ο λογαριασμός μου">
                  <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="who-text">
                    <b>{user.name}</b>
                    <small>{user.type === 'coach' ? 'Προπονητής' : 'Προσωπικός λογαριασμός'}</small>
                  </span>
                </Link>
                <button className="btn" onClick={() => { logout(); router.push('/'); }}>Αποσύνδεση</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn ghost">Είσοδος</Link>
                <Link href="/signup" className="btn primary">
                  <span className="long">Δημιουργία λογαριασμού</span><span className="short">Εγγραφή</span>
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
