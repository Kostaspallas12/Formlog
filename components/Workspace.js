'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { deleteCheckin, listCheckins, listWeighIns, withWeights } from '@/lib/storage';
import { daysBetween, fmtDelta, fmtKg } from '@/lib/utils';
import CheckinForm from './CheckinForm';
import Timeline from './Timeline';
import Compare from './Compare';
import WeightChart from './WeightChart';
import WeightLog from './WeightLog';

const TABS = [
  { id: 'archive', label: 'Αρχείο' },
  { id: 'compare', label: 'Σύγκριση' },
  { id: 'weight', label: 'Βάρος' },
];

// Ο χώρος ενός αθλούμενου: σύνοψη, νέα καταγραφή, αρχείο, σύγκριση, πίνακας βάρους.
export default function Workspace({ athlete, title, greeting, backHref, onDeleteAthlete }) {
  const [data, setData] = useState(null); // { checkins, weighIns }
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState('archive');
  const [editing, setEditing] = useState(null); // null | 'new' | καταγραφή

  const reload = useCallback(async () => {
    try {
      const [checkins, weighIns] = await Promise.all([listCheckins(athlete.id), listWeighIns(athlete.id)]);
      // Το βάρος κάθε καταγραφής έρχεται από τον πίνακα βάρους (μία πηγή).
      setData({ checkins: withWeights(checkins, weighIns), weighIns });
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [athlete.id]);
  useEffect(() => { reload(); }, [reload]);

  if (loadError && !data) {
    return <div className="empty">Δεν φόρτωσαν τα δεδομένα. Έλεγξε τη σύνδεσή σου και ανανέωσε τη σελίδα.</div>;
  }
  if (!data) return null;

  const { checkins, weighIns } = data;
  const isEmpty = checkins.length === 0 && weighIns.length === 0;
  const photoCount = checkins.reduce((n, c) => n + Object.values(c.photos).filter(Boolean).length, 0);
  const dates = [...checkins, ...weighIns].map((x) => x.date).sort();
  const firstKg = weighIns[0];
  const lastKg = weighIns[weighIns.length - 1];

  const done = () => {
    setEditing(null);
    reload();
  };

  return (
    <>
      <div className="app-head">
        <div>
          {backHref && <Link href={backHref} className="back">← Όλοι οι αθλούμενοι</Link>}
          {greeting && <p className="greeting">{greeting}</p>}
          <h1>{title}</h1>
        </div>
        {!editing && (
          <button className="btn primary" onClick={() => setEditing('new')}>+ Νέα καταγραφή</button>
        )}
      </div>

      {editing && (
        <CheckinForm
          key={editing === 'new' ? 'new' : editing.id}
          athleteId={athlete.id}
          initial={editing === 'new' ? null : editing}
          onDone={done}
          onCancel={() => setEditing(null)}
        />
      )}

      {!isEmpty && (
        <div className="stats">
          {checkins.length > 0 && <div className="stat"><b>{checkins.length}</b><span>καταγραφές</span></div>}
          {photoCount > 0 && <div className="stat"><b>{photoCount}</b><span>φωτογραφίες</span></div>}
          <div className="stat"><b>{daysBetween(dates[0], dates[dates.length - 1])}</b><span>ημέρες παρακολούθησης</span></div>
          {lastKg && <div className="stat"><b>{fmtKg(lastKg.weight)} kg</b><span>τρέχον βάρος</span></div>}
          {weighIns.length > 1 && (
            <div className="stat"><b>{fmtDelta(lastKg.weight - firstKg.weight)}</b><span>από την αρχή</span></div>
          )}
        </div>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" className="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'archive' && (
        checkins.length === 0 ? (
          !editing && (
            <div className="empty big">
              <h3>Ξεκίνα το αρχείο</h3>
              <p>Πρόσθεσε την πρώτη καταγραφή με φωτογραφίες και βάρος. Αν έχεις παλιές φωτογραφίες, ανέβασέ τες με την ημερομηνία που τραβήχτηκαν.</p>
              <button className="btn primary" onClick={() => setEditing('new')}>+ Πρώτη καταγραφή</button>
            </div>
          )
        ) : (
          <Timeline
            checkins={checkins}
            onEdit={(c) => { setEditing(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onDelete={async (c) => { await deleteCheckin(c); reload(); }}
          />
        )
      )}
      {tab === 'compare' && <Compare key={checkins.length} checkins={checkins} />}
      {tab === 'weight' && (
        <div className="weight">
          <WeightChart entries={weighIns} />
          <WeightLog athleteId={athlete.id} entries={weighIns} onChange={reload} />
        </div>
      )}

      {onDeleteAthlete && (
        <div className="danger-zone">
          <button
            className="btn small ghost danger"
            onClick={() => confirm(`Οριστική διαγραφή του φακέλου «${athlete.name}» με όλες τις καταγραφές, το βάρος και τις φωτογραφίες;`) && onDeleteAthlete()}
          >
            Διαγραφή αθλούμενου
          </button>
        </div>
      )}
    </>
  );
}
