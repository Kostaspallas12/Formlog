'use client';

import { useEffect, useRef, useState } from 'react';
import { useGuard } from '@/lib/useGuard';
import { addPhoto, deleteWeighInOn, putCheckin, removePhotos, setWeighIn, uuid } from '@/lib/storage';
import { processImage } from '@/lib/images';
import { ANGLES, parseDecimal, todayISO } from '@/lib/utils';
import Photo from './Photo';
import DateField from './DateField';

// Νέα καταγραφή ή επεξεργασία υπάρχουσας: ημερομηνία, βάρος, έως 3 φωτογραφίες, σημείωση.
export default function CheckinForm({ athleteId, initial, onDone, onCancel }) {
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [weight, setWeight] = useState(initial?.weight != null ? String(initial.weight) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  // Για κάθε πλευρά: { id: αποθηκευμένη φωτογραφία, file: νέο αρχείο, preview: URL του νέου αρχείου }
  const [slots, setSlots] = useState(() =>
    Object.fromEntries(ANGLES.map((a) => [a.id, { id: initial?.photos?.[a.id] ?? null, file: null, preview: null }]))
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Καθαρισμός των προσωρινών URL όταν κλείνει η φόρμα
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  useEffect(() => () => Object.values(slotsRef.current).forEach((s) => s.preview && URL.revokeObjectURL(s.preview)), []);

  const setSlot = (angle, next) =>
    setSlots((prev) => {
      if (prev[angle].preview) URL.revokeObjectURL(prev[angle].preview);
      return { ...prev, [angle]: next };
    });

  const pick = (angle, file) => {
    if (!file) return;
    setSlot(angle, { id: null, file, preview: URL.createObjectURL(file) });
  };

  const clear = (angle) => setSlot(angle, { id: null, file: null, preview: null });

  const guard = useGuard();
  const submit = async (e) => {
    e.preventDefault();
    const kg = weight.trim() ? parseDecimal(weight) : null;
    if (kg != null && !(kg > 20 && kg < 400)) return setError('Γράψε ένα έγκυρο βάρος σε κιλά.');
    const hasPhoto = Object.values(slots).some((s) => s.id || s.file);
    if (!hasPhoto && kg == null) return setError('Πρόσθεσε τουλάχιστον μία φωτογραφία ή το βάρος.');

    setBusy(true);
    setError('');
    try {
      // Πρώτα μικραίνουμε όλες τις νέες φωτογραφίες (ταυτόχρονα), ώστε αν μία αποτύχει να μη σωθεί τίποτα μισό.
      const shrunk = {};
      await Promise.all(ANGLES.filter((a) => slots[a.id].file).map(async (a) => {
        try {
          shrunk[a.id] = await processImage(slots[a.id].file);
        } catch {
          throw new Error(`Δεν διαβάστηκε η φωτογραφία «${a.label}». Δοκίμασε αρχείο JPG ή PNG.`);
        }
      }));

      // Ανέβασμα όλων μαζί (όχι μία-μία): πολύ πιο γρήγορα, ειδικά στο κινητό.
      const photos = {};
      const obsolete = [];
      await Promise.all(ANGLES.map(async (a) => {
        if (shrunk[a.id]) photos[a.id] = await addPhoto(shrunk[a.id], athleteId);
        else if (slots[a.id].id) photos[a.id] = slots[a.id].id;
      }));
      for (const a of ANGLES) {
        const old = initial?.photos?.[a.id] ?? null;
        if (old && photos[a.id] !== old) obsolete.push(old);
      }

      const checkin = {
        id: initial?.id ?? uuid(),
        athleteId,
        date: date || todayISO(),
        weight: kg,
        photos,
        note: note.trim(),
        createdAt: initial?.createdAt ?? new Date().toISOString(),
      };
      await putCheckin(checkin);

      // Το βάρος γράφεται στον πίνακα βάρους, στην ημέρα της καταγραφής.
      // Αν άλλαξε η ημερομηνία ή σβήστηκε το βάρος, φεύγει από την παλιά μέρα.
      if (initial?.weight != null && (initial.date !== checkin.date || kg == null)) {
        await deleteWeighInOn(athleteId, initial.date);
      }
      if (kg != null) await setWeighIn({ athleteId, date: checkin.date, weight: kg });

      await removePhotos(obsolete);
      onDone(checkin);
    } catch (err) {
      setError(err.message?.startsWith('Δεν') ? err.message : 'Η αποθήκευση απέτυχε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.');
      setBusy(false);
    }
  };

  return (
    <form className="panel checkin-form" onSubmit={guard(submit)}>
      <div className="panel-head">
        <h2>{initial ? 'Επεξεργασία καταγραφής' : 'Νέα καταγραφή'}</h2>
        <button type="button" className="x" onClick={onCancel} aria-label="Κλείσιμο">✕</button>
      </div>

      <div className="form-row">
        <div className="f">
          Ημερομηνία λήψης
          <DateField value={date} onChange={setDate} label="Ημερομηνία λήψης" />
        </div>
        <label className="f">
          Βάρος (kg)
          <input
            type="text" inputMode="decimal" placeholder="π.χ. 78,5"
            value={weight} onChange={(e) => setWeight(e.target.value)}
          />
        </label>
      </div>
      {!initial && (
        <p className="hint">Για παλιές φωτογραφίες, βάλε την ημερομηνία που τραβήχτηκαν. Μπαίνουν αυτόματα στη σωστή θέση.</p>
      )}

      <div className="slots">
        {ANGLES.map((a) => {
          const s = slots[a.id];
          const filled = s.preview || s.id;
          return (
            <div className="slot" key={a.id}>
              {filled ? (
                <>
                  {s.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.preview} alt={a.label} />
                  ) : (
                    <Photo id={s.id} alt={a.label} />
                  )}
                  <span className="slot-label">{a.label}</span>
                  {/* Πατώντας πάνω στη φωτογραφία, την αλλάζεις απευθείας με άλλη. */}
                  <label className="slot-replace" title={`Αλλαγή: ${a.label}`}>
                    <input
                      type="file" accept="image/*" aria-label={`Αλλαγή φωτογραφίας: ${a.label}`}
                      onChange={(e) => { pick(a.id, e.target.files[0]); e.target.value = ''; }}
                    />
                  </label>
                  <button type="button" className="slot-x" onClick={() => clear(a.id)} aria-label={`Αφαίρεση: ${a.label}`}>✕</button>
                </>
              ) : (
                <label className="slot-empty">
                  <span className="plus" aria-hidden="true">+</span>
                  {a.label}
                  <input type="file" accept="image/*" onChange={(e) => { pick(a.id, e.target.files[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <label className="f">
        Σημείωση (προαιρετικά)
        <input value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} placeholder="π.χ. αρχή νέου προγράμματος" />
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="row end">
        <button type="button" className="btn" onClick={onCancel}>Ακύρωση</button>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
      </div>
    </form>
  );
}
