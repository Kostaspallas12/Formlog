'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { deleteCheckin, listCheckins } from '@/lib/storage';
import { daysBetween, fmtDelta, fmtKg } from '@/lib/utils';
import CheckinForm from './CheckinForm';
import Timeline from './Timeline';
import Compare from './Compare';
import WeightChart from './WeightChart';

const TABS = [
  { id: 'archive', label: 'Αρχείο' },
  { id: 'compare', label: 'Σύγκριση' },
  { id: 'weight', label: 'Βάρος' },
];

// Ο χώρος ενός αθλούμενου: σύνοψη, νέα καταγραφή, αρχείο, σύγκριση, βάρος.
export default function Workspace({ athlete, title, greeting, backHref, onDeleteAthlete }) {
  const [checkins, setCheckins] = useState(null);
  const [tab, setTab] = useState('archive');
  const [editing, setEditing] = useState(null); // null | 'new' | καταγραφή

  const reload = useCallback(() => listCheckins(athlete.id).then(setCheckins), [athlete.id]);
  useEffect(() => { reload(); }, [reload]);

  if (!checkins) return null;

  const first = checkins[0];
  const last = checkins[checkins.length - 1];
  const kgs = checkins.filter((c) => c.weight != null);
  const photoCount = checkins.reduce((n, c) => n + Object.values(c.photos).filter(Boolean).length, 0);

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

      {checkins.length === 0 ? (
        !editing && (
          <div className="empty big">
            <h3>Ξεκίνα το αρχείο</h3>
            <p>Πρόσθεσε την πρώτη καταγραφή με φωτογραφίες και βάρος. Αν έχεις παλιές φωτογραφίες, ανέβασέ τες με την ημερομηνία που τραβήχτηκαν.</p>
            <button className="btn primary" onClick={() => setEditing('new')}>+ Πρώτη καταγραφή</button>
          </div>
        )
      ) : (
        <>
          <div className="stats">
            <div className="stat"><b>{checkins.length}</b><span>καταγραφές</span></div>
            <div className="stat"><b>{photoCount}</b><span>φωτογραφίες</span></div>
            <div className="stat"><b>{daysBetween(first.date, last.date)}</b><span>ημέρες παρακολούθησης</span></div>
            {kgs.length > 0 && (
              <div className="stat"><b>{fmtKg(kgs[kgs.length - 1].weight)} kg</b><span>τρέχον βάρος</span></div>
            )}
            {kgs.length > 1 && (
              <div className="stat">
                <b>{fmtDelta(kgs[kgs.length - 1].weight - kgs[0].weight)}</b>
                <span>από την αρχή</span>
              </div>
            )}
          </div>

          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" className="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'archive' && (
            <Timeline
              checkins={checkins}
              onEdit={(c) => { setEditing(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onDelete={async (c) => { await deleteCheckin(c); reload(); }}
            />
          )}
          {tab === 'compare' && <Compare key={checkins.length} checkins={checkins} />}
          {tab === 'weight' && <WeightChart checkins={checkins} />}
        </>
      )}

      {onDeleteAthlete && (
        <div className="danger-zone">
          <button
            className="btn small ghost danger"
            onClick={() => confirm(`Οριστική διαγραφή του φακέλου «${athlete.name}» με όλες τις καταγραφές και φωτογραφίες;`) && onDeleteAthlete()}
          >
            Διαγραφή αθλούμενου
          </button>
        </div>
      )}
    </>
  );
}
