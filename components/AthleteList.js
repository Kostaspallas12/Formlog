'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { addAthlete, listAthletes, listCheckins, listWeighIns } from '@/lib/storage';
import { ANGLES, fmtDate, fmtDelta, fmtKg } from '@/lib/utils';
import Photo from './Photo';

// Οι αθλούμενοι του προπονητή, ο καθένας με το δικό του αρχείο.
export default function AthleteList({ user }) {
  const [athletes, setAthletes] = useState(null);
  const [name, setName] = useState('');

  const reload = useCallback(async () => {
    const list = (await listAthletes()).filter((a) => !a.self);
    const withData = await Promise.all(list.map(async (a) => ({
      ...a, checkins: await listCheckins(a.id), weighIns: await listWeighIns(a.id),
    })));
    setAthletes(withData.sort((a, b) => a.name.localeCompare(b.name, 'el')));
  }, [user.email]);

  useEffect(() => { reload(); }, [reload]);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = confirm(
      `Επιβεβαιώνεις ότι ο/η «${name.trim()}» έχει δώσει ρητή συγκατάθεση για την καταχώρηση φωτογραφιών σώματος και βάρους του/της;`
    );
    if (!ok) return;
    await addAthlete(name, { consentConfirmedAt: new Date().toISOString() });
    setName('');
    reload();
  };

  if (!athletes) return null;

  return (
    <>
      <div className="app-head">
        <div>
          <p className="greeting">Γεια σου, {user.name.split(' ')[0]}</p>
          <h1>Οι αθλούμενοί μου</h1>
        </div>
        <form className="row add-athlete" onSubmit={add}>
          <input
            placeholder="Όνομα αθλούμενου" value={name} onChange={(e) => setName(e.target.value)}
            aria-label="Όνομα νέου αθλούμενου"
          />
          <button className="btn primary" type="submit">+ Προσθήκη</button>
        </form>
      </div>

      {athletes.length === 0 ? (
        <div className="empty big">
          <h3>Πρόσθεσε τον πρώτο σου αθλούμενο</h3>
          <p>Κάθε αθλούμενος έχει τον δικό του φάκελο με φωτογραφίες, βάρος και σύγκριση προόδου.</p>
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
        <h3>{athlete.name}</h3>
        <span className="meta">
          {checkins.length
            ? `${checkins.length} καταγραφές · τελευταία ${fmtDate(last.date)}`
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
