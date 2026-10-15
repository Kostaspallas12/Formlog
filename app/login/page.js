'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRedirectIfLoggedIn } from '@/lib/useAuthRedirect';

export default function LoginPage() {
  const { login } = useRedirectIfLoggedIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Μετά την επιτυχή είσοδο, το useRedirectIfLoggedIn στέλνει στο /dashboard.
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await login({ email, password });
    setBusy(false);
    setError(res.error || '');
  };

  return (
    <main className="wrap">
      <form className="auth" onSubmit={submit}>
        <h1>Καλώς ήρθες πίσω</h1>
        <p className="auth-sub">Μπες για να δεις το αρχείο σου.</p>

        <label className="f">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="f">
          Κωδικός
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <Link href="/forgot-password" className="forgot">Ξέχασες τον κωδικό;</Link>
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn primary big full" type="submit" disabled={busy}>
          {busy ? 'Είσοδος...' : 'Είσοδος'}
        </button>
        <p className="auth-foot">
          Δεν έχεις λογαριασμό; <Link href="/signup">Δημιούργησε έναν</Link>
        </p>
      </form>
    </main>
  );
}
