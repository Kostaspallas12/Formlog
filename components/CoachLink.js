'use client';

import { useCallback, useEffect, useState } from 'react';
import { createInvite, listInvites, revokeInvite } from '@/lib/storage';
import { fmtDate } from '@/lib/utils';
import Menu from './Menu';
import { LinkIcon } from './Icons';

// Για τον προπονητή, σε αθλούμενο που δεν έχει συνδεθεί ακόμα: η πρόσκληση σε μία γραμμή
// (μοναδικός σύνδεσμος μιας χρήσης). Οι σπάνιες ενέργειες είναι στο «⋮».
export default function CoachLink({ athlete }) {
  const [invites, setInvites] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const reload = useCallback(async () => {
    const all = await listInvites();
    setInvites(all.filter((i) => i.athleteId === athlete.id));
  }, [athlete.id]);
  useEffect(() => { reload().catch(() => setInvites([])); }, [reload]);

  if (!invites) return null;

  const active = invites.find((i) => !i.usedAt && !i.revokedAt && new Date(i.expiresAt) > new Date());
  const link = active && `${window.location.origin}/join/${active.token}`;

  const run = async (fn, ok) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      await reload();
      if (ok) setMsg({ type: 'ok', text: ok });
    } catch {
      setMsg({ type: 'error', text: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.' });
    }
    setBusy(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setMsg({ type: 'ok', text: 'Αντιγράφηκε. Στείλ’ τον στον αθλούμενο (π.χ. στο WhatsApp).' });
    } catch {
      setMsg({ type: 'error', text: 'Δεν έγινε αντιγραφή. Επίλεξε τον σύνδεσμο και αντέγραψέ τον.' });
    }
  };

  return (
    <section className="invite-bar">
      <span className="invite-icon"><LinkIcon size={20} /></span>
      {active ? (
        <>
          <div className="invite-text">
            <b>Αναμένει αποδοχή</b>
            <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Σύνδεσμος πρόσκλησης" />
            <span className="meta">
              Λήγει {fmtDate(active.expiresAt.slice(0, 10))} · μιας χρήσης{active.email ? ` · μόνο για ${active.email}` : ''}
            </span>
          </div>
          <div className="invite-actions">
            <button className="btn primary small" onClick={copy}>Αντιγραφή</button>
            <Menu
              label="Επιλογές πρόσκλησης"
              items={[
                { label: 'Νέος σύνδεσμος', onClick: () => run(() => createInvite(athlete.id, active.email || ''), 'Βγήκε νέος σύνδεσμος· ο παλιός δεν ισχύει πια.') },
                { label: 'Ακύρωση πρόσκλησης', danger: true, onClick: () => run(() => revokeInvite(athlete.id), 'Η πρόσκληση ακυρώθηκε.') },
              ]}
            />
          </div>
        </>
      ) : (
        <form className="invite-text invite-new" onSubmit={(e) => { e.preventDefault(); run(() => createInvite(athlete.id, email.trim())); }}>
          <b>Χωρίς λογαριασμό</b>
          <div className="invite-new-row">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email αθλούμενου (προαιρετικό)" aria-label="Email αθλούμενου (προαιρετικό)" />
            <button className="btn primary small" type="submit" disabled={busy}>Σύνδεσμος πρόσκλησης</button>
          </div>
        </form>
      )}
      {msg && <p className={`invite-msg ${msg.type === 'error' ? 'error' : 'wl-ok'}`} role="status">{msg.text}</p>}
    </section>
  );
}
