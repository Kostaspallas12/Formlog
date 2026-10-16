'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyCoach } from '@/lib/storage';
import { fmtDate } from '@/lib/utils';

// Για τον αθλούμενο: με ποιον προπονητή συνεργάζεται (αν συνεργάζεται).
export default function MyCoach() {
  const [coach, setCoach] = useState(null);

  useEffect(() => {
    getMyCoach().then(setCoach).catch(() => {});
  }, []);

  if (!coach) return null;

  return (
    <div className="my-coach">
      <span>🤝 Προπονητής: <b>{coach.name}</b>{coach.since && <span className="meta"> · από {fmtDate(coach.since.slice(0, 10))}</span>}</span>
      <Link href="/account" className="meta">Ρυθμίσεις</Link>
    </div>
  );
}
