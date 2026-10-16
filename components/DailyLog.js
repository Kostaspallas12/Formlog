'use client';

import { useEffect, useId, useState } from 'react';
import { deleteDailyLog, setDailyLog, updateDailyLog } from '@/lib/storage';
import { fmtDate, todayISO } from '@/lib/utils';

// Καθημερινά: θερμίδες που έφαγε, πρόγραμμα προπόνησης, βήματα και νερό, μία γραμμή ανά ημέρα.

const FIELDS = [
  { key: 'calories', label: 'Θερμίδες', unit: 'kcal', type: 'int', max: 15000, placeholder: 'π.χ. 2200' },
  { key: 'workout', label: 'Προπόνηση', type: 'text', max: 100, placeholder: 'π.χ. Πόδια' },
  { key: 'steps', label: 'Βήματα', type: 'int', max: 200000, placeholder: 'π.χ. 8000' },
  { key: 'water', label: 'Νερό', unit: 'L', type: 'dec', max: 15, placeholder: 'π.χ. 2,5' },
];

// Αριθμός: '' → null, μη έγκυρο → undefined. Κείμενο: κομμένο, '' επιτρέπεται.
function parse(field, s) {
  if (field.type === 'text') return String(s ?? '').trim().slice(0, field.max);
  const t = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (!t) return null;
  const v = Number(field.type === 'int' ? t.replace(/\./g, '') : t); // «8.000» = 8000 βήματα
  if (!Number.isFinite(v) || v < 0 || v > field.max) return undefined;
  return field.type === 'int' ? Math.round(v) : Math.round(v * 100) / 100;
}

const toInput = (field, v) => (v == null ? '' : field.type === 'dec' ? String(v).replace('.', ',') : String(v));
const isEmpty = (e) => e.calories == null && !e.workout && e.steps == null && e.water == null;

export default function DailyLog({ athleteId, entries, onChange }) {
  const [msg, setMsg] = useState(null);
  const listId = useId();

  const flash = (type, text) => {
    setMsg({ type, text });
    if (type === 'ok') setTimeout(() => setMsg((m) => (m?.text === text ? null : m)), 2500);
  };

  // Προτάσεις για την προπόνηση: ό,τι έχει ξαναγραφτεί, το πιο πρόσφατο πρώτα.
  const workouts = [...new Set([...entries].reverse().map((e) => e.workout).filter(Boolean))];
  const byDate = new Map(entries.map((e) => [e.date, e]));

  return (
    <div className="daily">
      <datalist id={listId}>{workouts.map((w) => <option key={w} value={w} />)}</datalist>

      <AddForm athleteId={athleteId} byDate={byDate} listId={listId} onChange={onChange} flash={flash} />

      {msg && <p className={msg.type === 'error' ? 'error' : 'wl-ok'} role={msg.type === 'error' ? 'alert' : 'status'}>{msg.text}</p>}

      {entries.length === 0 ? (
        <div className="empty">Δεν υπάρχει καθημερινή καταγραφή ακόμα. Γράψε τη σημερινή σου μέρα παραπάνω.</div>
      ) : (
        <div className="table-wrap">
          <table className="sheet daily-sheet">
            <thead>
              <tr>
                <th>Ημερομηνία</th>
                {FIELDS.map((f) => (
                  <th key={f.key} className={f.type === 'text' ? '' : 'num'}>{f.label}{f.unit ? ` (${f.unit})` : ''}</th>
                ))}
                <th aria-label="Ενέργειες" />
              </tr>
            </thead>
            <tbody>
              {[...entries].reverse().map((e) => (
                <Row key={e.id} entry={e} listId={listId} onChange={onChange} flash={flash} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint">Κάνε κλικ σε ένα κελί για να το αλλάξεις. Enter για αποθήκευση, Esc για ακύρωση.</p>
    </div>
  );
}

/* ---------- Καταγραφή ημέρας ---------- */

// Διαλέγεις μέρα: αν υπάρχει ήδη, φορτώνονται οι τιμές της για να τις συμπληρώσεις/αλλάξεις.
function AddForm({ athleteId, byDate, listId, onChange, flash }) {
  const [date, setDate] = useState(todayISO());
  const existing = byDate.get(date);
  const fromEntry = () => Object.fromEntries(FIELDS.map((f) => [f.key, toInput(f, existing?.[f.key])]));
  const [form, setForm] = useState(fromEntry);
  const [busy, setBusy] = useState(false);

  // Όταν αλλάζει η μέρα (ή αποθηκεύεται), δείχνουμε τις τιμές εκείνης της μέρας.
  const sig = `${date}|${existing ? FIELDS.map((f) => existing[f.key]).join('|') : ''}`;
  useEffect(() => { setForm(fromEntry()); }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e) => {
    e.preventDefault();
    const values = {};
    for (const f of FIELDS) {
      const v = parse(f, form[f.key]);
      if (v === undefined) return flash('error', `Μη έγκυρη τιμή για: ${f.label}.`);
      values[f.key] = v;
    }
    if (isEmpty(values)) return flash('error', 'Γράψε τουλάχιστον ένα από τα πεδία.');
    setBusy(true);
    try {
      await setDailyLog({ athleteId, date, ...values });
      await onChange();
      flash('ok', `Αποθηκεύτηκε: ${fmtDate(date)}`);
    } catch {
      flash('error', 'Η αποθήκευση απέτυχε. Έλεγξε τη σύνδεσή σου.');
    }
    setBusy(false);
  };

  return (
    <form className="panel daily-add" onSubmit={save}>
      <div className="daily-grid">
        <label>
          <span>Ημερομηνία</span>
          <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
        </label>
        {FIELDS.map((f) => (
          <label key={f.key} className={f.type === 'text' ? 'wide' : ''}>
            <span>{f.label}{f.unit ? ` (${f.unit})` : ''}</span>
            <input
              inputMode={f.type === 'text' ? 'text' : f.type === 'int' ? 'numeric' : 'decimal'}
              list={f.type === 'text' ? listId : undefined} maxLength={f.type === 'text' ? f.max : undefined}
              autoComplete="off" placeholder={f.placeholder} value={form[f.key] ?? ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="row daily-actions">
        {existing && <span className="meta">Υπάρχει ήδη καταγραφή για αυτή τη μέρα · αλλάζεις τις τιμές της.</span>}
        <button className="btn primary" type="submit" disabled={busy}>{existing ? 'Ενημέρωση' : '+ Προσθήκη'}</button>
      </div>
    </form>
  );
}

/* ---------- Γραμμή πίνακα ---------- */

function Row({ entry, listId, onChange, flash }) {
  const [saving, setSaving] = useState(false);

  const save = async (key, value) => {
    if (isEmpty({ ...entry, [key]: value })) {
      flash('error', 'Μια μέρα πρέπει να έχει τουλάχιστον μία τιμή. Για να τη σβήσεις, πάτα ✕.');
      return false;
    }
    setSaving(true);
    try {
      await updateDailyLog(entry.id, { [key]: value });
      await onChange();
      return true;
    } catch {
      flash('error', 'Η αποθήκευση απέτυχε. Έλεγξε τη σύνδεσή σου.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Διαγραφή της καταγραφής της ${fmtDate(entry.date)};`)) return;
    try {
      await deleteDailyLog(entry.id);
      await onChange();
    } catch {
      flash('error', 'Η διαγραφή απέτυχε.');
    }
  };

  return (
    <tr className={saving ? 'saving' : ''}>
      <td className="daily-date">{fmtDate(entry.date)}</td>
      {FIELDS.map((f) => (
        <td key={f.key} className={f.type === 'text' ? '' : 'num'}>
          <Cell field={f} value={entry[f.key]} date={entry.date} listId={listId} onSave={(v) => save(f.key, v)} flash={flash} />
        </td>
      ))}
      <td className="actions">
        <button className="x" onClick={remove} aria-label={`Διαγραφή ${fmtDate(entry.date)}`}>✕</button>
      </td>
    </tr>
  );
}

function Cell({ field, value, date, listId, onSave, flash }) {
  const [v, setV] = useState(toInput(field, value));
  useEffect(() => { setV(toInput(field, value)); }, [field, value]);

  const commit = async () => {
    const p = parse(field, v);
    if (p === undefined) {
      setV(toInput(field, value));
      return flash('error', `Μη έγκυρη τιμή για: ${field.label}.`);
    }
    if (p === (value ?? (field.type === 'text' ? '' : null))) return setV(toInput(field, p));
    if (!(await onSave(p))) setV(toInput(field, value));
  };

  const text = field.type === 'text';
  return (
    <input
      className={`cell ${text ? '' : 'num'}`} value={v} placeholder="–"
      inputMode={text ? 'text' : field.type === 'int' ? 'numeric' : 'decimal'}
      list={text ? listId : undefined} maxLength={text ? field.max : undefined}
      aria-label={`${field.label} ${fmtDate(date)}`}
      onChange={(e) => setV(e.target.value)} onBlur={commit} onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setV(toInput(field, value));
          const el = e.currentTarget;
          setTimeout(() => el.blur(), 0);
        }
      }}
    />
  );
}
