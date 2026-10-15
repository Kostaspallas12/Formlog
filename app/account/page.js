'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRequireUser } from '@/lib/useAuthRedirect';
import { MIN_PASSWORD, useAuth } from '@/lib/AuthContext';
import { buildExportZip, exportFileName } from '@/lib/exportZip';

export default function AccountPage() {
  const { user, ready, deleteAccount } = useRequireUser();
  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!ready || !user) return null;

  // Δικαίωμα πρόσβασης/φορητότητας: ZIP με φωτογραφίες, CSV και JSON.
  const download = async () => {
    setExporting(true);
    try {
      const blob = await buildExportZip(user);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileName();
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExporting(false);
    }
  };

  const remove = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await deleteAccount(password);
    setBusy(false);
    if (res.error) return setError(res.error);
    // Πλήρης φόρτωση της αρχικής, ώστε να μην προλάβει η σελίδα να στείλει στην είσοδο.
    window.location.replace('/');
  };

  return (
    <main className="wrap app narrow">
      <Link href="/dashboard" className="back">← Πίσω</Link>
      <h1 className="account-title">Ο λογαριασμός μου</h1>

      <section className="panel account-block">
        <h2>Στοιχεία</h2>
        <div className="settings">
          <NameRow />
          <EmailRow />
          <PasswordRow />
          <div className="setting">
            <div className="setting-head">
              <div><span className="setting-label">Τύπος λογαριασμού</span><b>{user.type === 'coach' ? 'Προπονητής' : 'Προσωπική χρήση'}</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel account-block">
        <h2>Λήψη των δεδομένων μου</h2>
        <p>
          Κατέβασε ένα αρχείο ZIP με όλα όσα έχεις αποθηκεύσει: τις φωτογραφίες σου ως κανονικές εικόνες, τις
          καταγραφές σε αρχείο για Excel και όλα τα στοιχεία του λογαριασμού. Χρήσιμο και ως αντίγραφο ασφαλείας.
        </p>
        <button className="btn" onClick={download} disabled={exporting}>
          {exporting ? 'Προετοιμασία...' : 'Λήψη δεδομένων'}
        </button>
      </section>

      <section className="panel account-block danger-block">
        <h2>Διαγραφή λογαριασμού</h2>
        <p>
          Σβήνει οριστικά τον λογαριασμό και όλες τις φωτογραφίες, καταγραφές και {user.type === 'coach' ? 'φακέλους αθλούμενων' : 'μετρήσεις'}.
          Δεν μπορεί να αναιρεθεί. Αν θες να τα κρατήσεις, κάνε πρώτα «Λήψη δεδομένων».
        </p>
        {!confirming ? (
          <button className="btn danger-solid" onClick={() => setConfirming(true)}>Διαγραφή λογαριασμού</button>
        ) : (
          <form onSubmit={remove}>
            <label className="f">
              Γράψε τον κωδικό σου για επιβεβαίωση
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" required autoFocus
              />
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="row">
              <button type="button" className="btn" onClick={() => { setConfirming(false); setPassword(''); setError(''); }}>
                Ακύρωση
              </button>
              <button type="submit" className="btn danger-solid" disabled={busy}>
                {busy ? 'Διαγραφή...' : 'Οριστική διαγραφή'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

/* ---------- Γραμμές ρυθμίσεων: τιμή + «Αλλαγή» που ανοίγει μια μικρή φόρμα ---------- */

// Κοινή λογική: άνοιγμα/κλείσιμο, αποθήκευση, μήνυμα λάθους ή επιτυχίας.
function Setting({ label, value, success, onSave, children }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await onSave();
    setBusy(false);
    if (res.error) return setError(res.error);
    setError('');
    setOpen(false);
    setSaved(true);
  };

  return (
    <div className="setting">
      <div className="setting-head">
        <div>
          <span className="setting-label">{label}</span>
          <b>{value}</b>
          {saved && !open && <span className="saved" role="status">✓ {success}</span>}
        </div>
        {!open && (
          <button className="btn small" onClick={() => { setOpen(true); setSaved(false); }}>Αλλαγή</button>
        )}
      </div>
      {open && (
        <form className="setting-form" onSubmit={submit}>
          {children}
          {error && <p className="error" role="alert">{error}</p>}
          <div className="row">
            <button type="button" className="btn" onClick={() => { setOpen(false); setError(''); }}>Ακύρωση</button>
            <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

function NameRow() {
  const { user, updateName } = useAuth();
  const [name, setName] = useState(user.name);
  return (
    <Setting label="Όνομα" value={user.name} success="Αποθηκεύτηκε" onSave={() => updateName(name)}>
      <label className="f">
        Νέο όνομα
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required autoFocus />
      </label>
    </Setting>
  );
}

function EmailRow() {
  const { user, changeEmail } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Setting
      label="Email" value={user.email}
      success={`Στείλαμε email επιβεβαίωσης στο ${newEmail}. Το email αλλάζει μόλις πατήσεις τον σύνδεσμο.`}
      onSave={async () => {
        const res = await changeEmail({ newEmail, password });
        if (res.ok) setPassword('');
        return res;
      }}
    >
      <label className="f">
        Νέο email
        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" required autoFocus />
      </label>
      <label className="f">
        Κωδικός (για επιβεβαίωση)
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
    </Setting>
  );
}

function PasswordRow() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  return (
    <Setting
      label="Κωδικός" value="••••••••" success="Ο κωδικός άλλαξε"
      onSave={async () => {
        if (next !== confirm) return { error: 'Οι δύο νέοι κωδικοί δεν ταιριάζουν.' };
        const res = await changePassword({ current, next });
        if (res.ok) { setCurrent(''); setNext(''); setConfirm(''); }
        return res;
      }}
    >
      <label className="f">
        Τρέχων κωδικός
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required autoFocus />
      </label>
      <label className="f">
        Νέος κωδικός
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
        <small>Τουλάχιστον {MIN_PASSWORD} χαρακτήρες</small>
      </label>
      <label className="f">
        Επανάληψη νέου κωδικού
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
      </label>
    </Setting>
  );
}
