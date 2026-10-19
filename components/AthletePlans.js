'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteAthletePlan, downloadPlanFile, getAthletePlans, PLAN_FILE_TYPES, removePlanFiles, saveAthletePlan, uploadPlanFile,
} from '@/lib/storage';
import { fmtDate } from '@/lib/utils';
import PlanView, { hasWritten, PLAN_KINDS } from './PlanView';
import PlanEditor from './PlanEditor';
import EmptyState from './EmptyState';
import Menu from './Menu';
import { CloseIcon, PlanIcon, UploadIcon } from './Icons';

const MAX_FILES = 10;
const ACCEPT = Object.keys(PLAN_FILE_TYPES).map((x) => `.${x}`).join(',');
// Αρχεία που ανοίγουν στον browser (τα υπόλοιπα κατεβαίνουν).
const VIEWABLE = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];
const fmtSize = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`);
const fileExt = (name) => name.split('.').pop().toUpperCase().slice(0, 4);

// Η καρτέλα «Πρόγραμμα» ενός αθλούμενου: προπόνηση / διατροφή, μόνο δικά του.
// coach: ο προπονητής γράφει το πρόγραμμα ή ανεβάζει αρχεία από τον υπολογιστή · αλλιώς μόνο ανάγνωση.
export default function AthletePlans({ athleteId, coach = false }) {
  const [plans, setPlans] = useState(null); // { training, nutrition }
  const [kind, setKind] = useState('training');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    try {
      const p = await getAthletePlans(athleteId);
      setPlans(p);
      setLoadError(false);
      return p;
    } catch {
      setLoadError(true);
    }
  }, [athleteId]);
  useEffect(() => {
    // Αν υπάρχει μόνο διατροφή, ανοίγει σε αυτή.
    load().then((p) => { if (p && !p.training && p.nutrition) setKind('nutrition'); });
  }, [load]);
  // Ο αθλούμενος βλέπει τις αλλαγές του προπονητή μόλις ξαναγυρίσει στην εφαρμογή.
  useEffect(() => {
    if (coach) return undefined;
    const back = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', back);
    document.addEventListener('visibilitychange', back);
    return () => {
      window.removeEventListener('focus', back);
      document.removeEventListener('visibilitychange', back);
    };
  }, [coach, load]);

  if (loadError && !plans) return <EmptyState title="Δεν φόρτωσε το πρόγραμμα" text="Έλεγξε τη σύνδεσή σου και ανανέωσε τη σελίδα." />;
  if (!plans) return <div className="panel"><span className="sk" style={{ display: 'block', width: '40%', height: 18 }} /><span className="sk" style={{ display: 'block', width: '70%', height: 14, marginTop: 14 }} /></div>;

  const current = plans[kind];
  const files = current?.files ?? [];
  const written = hasWritten(current);
  const k = PLAN_KINDS[kind];
  const setOne = (p) => setPlans((all) => ({ ...all, [kind]: p }));

  const save = async ({ title, content }) => {
    setBusy(true);
    try {
      setOne(await saveAthletePlan(athleteId, kind, { title, content, files }));
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (list) => {
    const picked = [...list];
    if (!picked.length) return;
    setError('');
    if (files.length + picked.length > MAX_FILES) return setError(`Έως ${MAX_FILES} αρχεία ανά πρόγραμμα.`);
    setBusy(true);
    const added = [];
    try {
      for (const f of picked) added.push(await uploadPlanFile(athleteId, f));
      setOne(await saveAthletePlan(athleteId, kind, { title: current?.title, content: current?.content, files: [...files, ...added] }));
    } catch (e) {
      await removePlanFiles(added.map((f) => f.path)).catch(() => {});
      setError(e.message === 'type' ? 'Επιτρέπονται PDF, Word, Excel, κείμενο και φωτογραφίες.'
        : e.message === 'size' ? 'Κάθε αρχείο μπορεί να είναι έως 10 MB.'
          : 'Το αρχείο δεν ανέβηκε. Δοκίμασε ξανά.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const removeFile = async (f) => {
    if (!confirm(`Αφαίρεση του «${f.name}»;`)) return;
    setBusy(true);
    try {
      const rest = files.filter((x) => x.path !== f.path);
      if (!rest.length && !written) {
        await deleteAthletePlan(athleteId, kind, [f]);
        setOne(null);
      } else {
        setOne(await saveAthletePlan(athleteId, kind, { title: current.title, content: current.content, files: rest }));
        await removePlanFiles([f.path]).catch(() => {});
      }
    } finally {
      setBusy(false);
    }
  };

  const removeAll = async () => {
    if (!confirm(`Διαγραφή όλου του ${k.long}; Θα σβηστούν και τα αρχεία του.`)) return;
    setBusy(true);
    try {
      await deleteAthletePlan(athleteId, kind, files);
      setOne(null);
    } finally {
      setBusy(false);
    }
  };

  const open = async (f) => {
    // Το παράθυρο ανοίγει αμέσως (αλλιώς ο browser το μπλοκάρει), και γεμίζει όταν κατέβει το αρχείο.
    const win = VIEWABLE.includes(f.type) ? window.open('', '_blank') : null;
    try {
      const url = URL.createObjectURL(await downloadPlanFile(f.path));
      if (win) win.location.href = url;
      else Object.assign(document.createElement('a'), { href: url, download: f.name }).click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      win?.close();
      setError('Το αρχείο δεν άνοιξε. Δοκίμασε ξανά.');
    }
  };

  const uploadBtn = coach && (
    <>
      <input ref={fileInput} type="file" accept={ACCEPT} multiple hidden onChange={(e) => upload(e.target.files)} />
      <button type="button" className="btn" disabled={busy || files.length >= MAX_FILES} onClick={() => fileInput.current?.click()}>
        <UploadIcon size={18} /><span className="long">Ανέβασμα αρχείου</span><span className="short">Αρχείο</span>
      </button>
    </>
  );

  return (
    <div className="athlete-plans">
      <div className="plan-bar">
        <div className="seg plan-kinds" role="group" aria-label="Είδος προγράμματος">
          {Object.entries(PLAN_KINDS).map(([id, x]) => (
            <button key={id} type="button" aria-pressed={kind === id} disabled={editing} onClick={() => { setKind(id); setError(''); }}>
              <x.Icon size={18} /> {x.label}
            </button>
          ))}
        </div>
        {coach && current && !editing && (
          <div className="row plan-tools">
            <button type="button" className="btn" onClick={() => setEditing(true)}>{written ? 'Επεξεργασία' : 'Γράψε πρόγραμμα'}</button>
            {uploadBtn}
            <Menu items={[{ label: 'Διαγραφή προγράμματος', danger: true, onClick: removeAll }]} />
          </div>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {editing ? (
        <PlanEditor key={kind} kind={kind} initial={current} busy={busy} onSave={save} onCancel={() => setEditing(false)} />
      ) : !current ? (
        <EmptyState icon={coach ? k.Icon : PlanIcon} title={coach ? `Δεν έχει ${k.long} ακόμα` : `Δεν έχεις ${k.long} ακόμα`}>
          {coach && (
            <div className="row">
              <button type="button" className="btn primary" onClick={() => setEditing(true)}>Γράψε πρόγραμμα</button>
              {uploadBtn}
            </div>
          )}
        </EmptyState>
      ) : (
        <>
          {written && <div className="panel"><PlanView plan={current} /></div>}
          {!written && current.title && <h3 className="plan-title">{current.title}</h3>}
          {files.length > 0 && (
            <div className="plan-files">
              {files.map((f) => (
                <div className="plan-file" key={f.path}>
                  <button type="button" className="plan-file-open" onClick={() => open(f)} title="Άνοιγμα">
                    <span className="plan-file-ext">{fileExt(f.name)}</span>
                    <span className="plan-file-name"><b>{f.name}</b><small>{fmtSize(f.size)}</small></span>
                  </button>
                  {coach && (
                    <button type="button" className="icon-btn" aria-label={`Αφαίρεση ${f.name}`} title="Αφαίρεση" disabled={busy} onClick={() => removeFile(f)}>
                      <CloseIcon size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="meta plan-updated">Ενημερώθηκε {fmtDate(current.updatedAt.slice(0, 10))}</p>
        </>
      )}
    </div>
  );
}
