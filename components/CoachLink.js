'use client';

import { useCallback, useEffect, useState } from 'react';
import { createInvite, disconnectCoach, listInvites, revokeInvite } from '@/lib/storage';
import { fmtDate } from '@/lib/utils';

// Για τον προπονητή, στη σελίδα ενός αθλούμενου: πρόσκληση (μοναδικός σύνδεσμος μιας χρήσης)
// ή, αν έχει συνδεθεί, ποιος συνδέθηκε και «Διακοπή συνεργασίας».
export default function CoachLink({ athlete, onDisconnected }) {
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
  const used = invites.find((i) => i.usedAt);
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
      setMsg({ type: 'ok', text: 'Ο σύνδεσμος αντιγράφηκε. Στείλ’ τον στον αθλούμενο (π.χ. στο WhatsApp).' });
    } catch {
      setMsg({ type: 'error', text: 'Δεν έγινε αντιγραφή. Επίλεξε τον σύνδεσμο και αντέγραψέ τον.' });
    }
  };

  // Συνδεδεμένος αθλούμενος
  if (athlete.linked) {
    return (
      <section className="panel coach-link on">
        <div>
          <h3>✓ Συνδεδεμένος με τον λογαριασμό του</h3>
          <p className="meta">
            {used?.usedEmail ? `${used.usedEmail} · ` : ''}από {fmtDate((athlete.clientConsentAt || used?.usedAt || '').slice(0, 10))}
          </p>
        </div>
        <button
          className="btn small ghost danger" disabled={busy}
          onClick={() =>
            confirm(`Διακοπή συνεργασίας με «${athlete.name}»; Ο φάκελος μένει στον αθλούμενο και εσύ δεν θα έχεις πια πρόσβαση.`) &&
            run(() => disconnectCoach(athlete.id)).then(onDisconnected)
          }
        >
          Διακοπή συνεργασίας
        </button>
      </section>
    );
  }

  return (
    <section className="panel coach-link">
      <h3>{active ? '⏳ Αναμένει αποδοχή' : 'Πρόσκληση αθλούμενου'}</h3>

      {active ? (
        <>
          <div className="invite-link">
            <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Σύνδεσμος πρόσκλησης" />
            <button className="btn primary small" onClick={copy}>📋 Αντιγραφή</button>
          </div>
          <p className="meta">
            Λήγει {fmtDate(active.expiresAt.slice(0, 10))} · μιας χρήσης{active.email ? ` · μόνο για ${active.email}` : ''}
          </p>
          <div className="row">
            <button className="btn small" disabled={busy} onClick={() => run(() => createInvite(athlete.id, active.email || ''), 'Βγήκε νέος σύνδεσμος· ο παλιός δεν ισχύει πια.')}>
              🔄 Νέος σύνδεσμος
            </button>
            <button className="btn small ghost danger" disabled={busy} onClick={() => run(() => revokeInvite(athlete.id), 'Η πρόσκληση ακυρώθηκε.')}>
              Ακύρωση πρόσκλησης
            </button>
          </div>
        </>
      ) : (
        <form
          className="invite-form"
          onSubmit={(e) => { e.preventDefault(); run(() => createInvite(athlete.id, email.trim())); }}
        >
          <label className="f">
            Email αθλούμενου (προαιρετικό)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="μόνο αυτό το email θα μπορεί να μπει" />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>Δημιουργία συνδέσμου</button>
        </form>
      )}

      {msg && <p className={msg.type === 'error' ? 'error' : 'wl-ok'} role="status">{msg.text}</p>}
    </section>
  );
}
