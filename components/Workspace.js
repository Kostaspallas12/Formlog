'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { deleteCheckin, listCheckins, listDailyLogs, listWeighIns, withWeights } from '@/lib/storage';
import { daysBetween, fmtDelta, fmtKg } from '@/lib/utils';
import CheckinForm from './CheckinForm';
import Timeline from './Timeline';
import Compare from './Compare';
import WeightChart from './WeightChart';
import WeightLog from './WeightLog';
import DailyLog from './DailyLog';
import { WorkspaceBodySkeleton } from './Skeletons';

// Τι φορτώνεται για έναν αθλούμενο (το καθένα ξεχωριστά, για να ανανεώνεται μόνο ό,τι άλλαξε).
const LOADERS = { checkins: listCheckins, weighIns: listWeighIns, daily: listDailyLogs };

const TABS = [
  { id: 'archive', label: 'Αρχείο' },
  { id: 'compare', label: 'Σύγκριση' },
  { id: 'weight', label: 'Βάρος' },
  { id: 'daily', label: 'Καθημερινά' },
];

// Ο χώρος ενός αθλούμενου: σύνοψη, νέα καταγραφή, αρχείο, σύγκριση, πίνακας βάρους, καθημερινά.
export default function Workspace({ athlete, title, greeting, backHref, banner, onDeleteAthlete }) {
  const [raw, setRaw] = useState(null); // { checkins, weighIns, daily }
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState('archive');
  const [editing, setEditing] = useState(null); // null | 'new' | καταγραφή

  // Φορτώνει μόνο ό,τι ζητηθεί (π.χ. μετά από αλλαγή βάρους μόνο το βάρος), όχι τα πάντα.
  const refresh = useCallback(async (parts = Object.keys(LOADERS)) => {
    try {
      const results = await Promise.all(parts.map((k) => LOADERS[k](athlete.id)));
      setRaw((prev) => ({ ...prev, ...Object.fromEntries(parts.map((k, i) => [k, results[i]])) }));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [athlete.id]);
  useEffect(() => { refresh(); }, [refresh]);

  // Το βάρος κάθε καταγραφής έρχεται από τον πίνακα βάρους (μία πηγή).
  const data = useMemo(
    () => raw && { checkins: withWeights(raw.checkins, raw.weighIns), weighIns: raw.weighIns, daily: raw.daily },
    [raw]
  );

  if (loadError && !data) {
    return <div className="empty">Δεν φόρτωσαν τα δεδομένα. Έλεγξε τη σύνδεσή σου και ανανέωσε τη σελίδα.</div>;
  }
  // Όσο φορτώνει: η κεφαλίδα κανονικά και σκελετός στη θέση των δεδομένων.
  if (!data) {
    return (
      <>
        <div className="app-head">
          <div>
            {backHref && <Link href={backHref} className="back">← Όλοι οι αθλούμενοι</Link>}
            {greeting && <p className="greeting">{greeting}</p>}
            <h1>{title}</h1>
          </div>
        </div>
        <WorkspaceBodySkeleton />
      </>
    );
  }

  const { checkins, weighIns, daily } = data;
  const isEmpty = checkins.length === 0 && weighIns.length === 0 && daily.length === 0;
  const photoCount = checkins.reduce((n, c) => n + Object.values(c.photos).filter(Boolean).length, 0);
  const dates = [...checkins, ...weighIns, ...daily].map((x) => x.date).sort();
  const days = dates.length ? daysBetween(dates[0], dates[dates.length - 1]) : 0;
  const firstKg = weighIns[0];
  const lastKg = weighIns[weighIns.length - 1];

  const done = () => {
    setEditing(null);
    refresh(['checkins', 'weighIns']);
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

      {banner}

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
          {checkins.length > 0 && <div className="stat"><b>{checkins.length}</b><span>{checkins.length === 1 ? 'καταγραφή' : 'καταγραφές'}</span></div>}
          {photoCount > 0 && <div className="stat"><b>{photoCount}</b><span>{photoCount === 1 ? 'φωτογραφία' : 'φωτογραφίες'}</span></div>}
          <div className="stat"><b>{days}</b><span>{days === 1 ? 'ημέρα' : 'ημέρες'} παρακολούθησης</span></div>
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
            onDelete={async (c) => { await deleteCheckin(c); refresh(['checkins']); }}
          />
        )
      )}
      {tab === 'compare' && <Compare key={checkins.length} checkins={checkins} />}
      {tab === 'weight' && (
        <div className="weight">
          <WeightChart entries={weighIns} />
          <WeightLog athleteId={athlete.id} entries={weighIns} onChange={() => refresh(['weighIns'])} />
        </div>
      )}
      {tab === 'daily' && <DailyLog athleteId={athlete.id} entries={daily} onChange={() => refresh(['daily'])} />}

      {onDeleteAthlete && (
        <div className="danger-zone">
          <button
            className="btn small ghost danger"
            onClick={() => confirm(`Οριστική διαγραφή του φακέλου «${athlete.name}» με όλες τις καταγραφές, το βάρος, τα καθημερινά και τις φωτογραφίες;`) && onDeleteAthlete()}
          >
            Διαγραφή αθλούμενου
          </button>
        </div>
      )}
    </>
  );
}
