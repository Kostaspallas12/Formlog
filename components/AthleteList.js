'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { listAthletes, listCheckins, listWeighIns } from '@/lib/storage';
import { ANGLES, fmtDate, fmtDelta, fmtKg } from '@/lib/utils';
import AthleteForm from './AthleteForm';
import Photo from './Photo';

// Οι αθλούμενοι του προπονητή, ο καθένας με το δικό του αρχείο.
export default function AthleteList({ user }) {
  const [athletes, setAthletes] = useState(null);
  const [adding, setAdding] = useState(false);

  const reload = useCallback(async () => {
    const list = (await listAthletes()).filter((a) => !a.self);
    const withData = await Promise.all(list.map(async (a) => ({
      ...a, checkins: await listCheckins(a.id), weighIns: await listWeighIns(a.id),
    })));
    setAthletes(withData.sort((a, b) => a.name.localeCompare(b.name, 'el')));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (!athletes) return null;

  return (
    <>
      <div className="app-head">
        <div>
          <p className="greeting">Γεια σου, {user.name.split(' ')[0]}</p>
          <h1>Οι αθλούμενοί μου</h1>
          {athletes.length > 0 && (
            <p className="athlete-count">
              <b>{athletes.length}</b> {athletes.length === 1 ? 'αθλούμενος' : 'αθλούμενοι'}
            </p>
          )}
        </div>
        {!adding && <button className="btn primary" onClick={() => setAdding(true)}>+ Προσθήκη αθλούμενου</button>}
      </div>

      {/* Όσο είναι ανοιχτή η φόρμα, δείχνουμε μόνο τη φόρμα. */}
      {adding ? (
        <AthleteForm
          onCancel={() => setAdding(false)}
          onDone={async () => { await reload(); setAdding(false); }}
        />
      ) : athletes.length === 0 ? (
        <div className="empty big">
          <h3>Πρόσθεσε τον πρώτο σου αθλούμενο</h3>
          <p>Κάθε αθλούμενος έχει τον δικό του φάκελο με φωτογραφίες, βάρος και σύγκριση προόδου.</p>
          <button className="btn primary" onClick={() => setAdding(true)}>+ Προσθήκη αθλούμενου</button>
        </div>
      ) : (
        <div className="athletes">
          {athletes.map((a) => <AthleteCard key={a.id} athlete={a} />)}
        </div>
      )}
    </>
  );
}

function AthleteCard({ athlete }) {
  const { checkins } = athlete;
  const last = checkins[checkins.length - 1];
  const kgs = athlete.weighIns;
  const lastPhoto = [...checkins].reverse()
    .map((c) => ANGLES.map((x) => c.photos[x.id]).find(Boolean))
    .find(Boolean);

  return (
    <Link href={`/dashboard/athletes/${athlete.id}`} className="athlete">
      {lastPhoto ? <Photo id={lastPhoto} alt="" className="athlete-photo" /> : <span className="athlete-photo ph" />}
      <div className="athlete-info">
        <h3>{athlete.name}{athlete.age != null && <span className="athlete-age"> · {athlete.age} ετών</span>}</h3>
        <span className="meta">
          {checkins.length
            ? `${checkins.length} ${checkins.length === 1 ? 'καταγραφή' : 'καταγραφές'} · τελευταία ${fmtDate(last.date)}`
            : 'Καμία καταγραφή ακόμα'}
        </span>
        {kgs.length > 0 && (
          <span className="athlete-kg">
            <b>{fmtKg(kgs[kgs.length - 1].weight)} kg</b>
            {kgs.length > 1 && <span> · {fmtDelta(kgs[kgs.length - 1].weight - kgs[0].weight)} από την αρχή</span>}
          </span>
        )}
      </div>
    </Link>
  );
}
