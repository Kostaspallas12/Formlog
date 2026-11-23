'use client';

import { useCallback, useEffect, useState } from 'react';
import { downloadPlanFile, PLAN_FILE_TYPES } from '@/lib/storage';
import { CloseIcon, DownloadIcon } from './Icons';

// Ο τύπος χωρίς παραμέτρους: 'text/plain;charset=utf-8' → 'text/plain'
const baseType = (t) => String(t || '').split(';')[0].trim().toLowerCase();

// Το όνομα της λήψης παίρνει πάντα την κατάληξη του πραγματικού τύπου του αρχείου: ένα αρχείο δεν κατεβαίνει
// ποτέ ως «πρόγραμμα.pdf.exe» ή με χαρακτήρες που δεν επιτρέπονται σε όνομα αρχείου.
const downloadName = (name, type) => {
  const ext = Object.keys(PLAN_FILE_TYPES).find((k) => PLAN_FILE_TYPES[k] === type) || 'bin';
  const base = String(name || '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\.[^.]*$/, '')
    .replace(/^[.\s]+/, '')
    .trim()
    .slice(0, 100);
  return `${base || 'αρχείο'}.${ext}`;
};

// Προβολή αρχείου μέσα στη σελίδα: εικόνα, PDF και κείμενο προβάλλονται·
// Έγγραφα και πίνακες (doc/xls) δεν προβάλλονται από τον browser, οπότε δίνουμε Λήψη.
// Τι θα προβληθεί αποφασίζει ο πραγματικός τύπος (όπως τον κράτησε ο χώρος αποθήκευσης, που δέχεται μόνο
// τους τύπους του PLAN_FILE_TYPES) — όχι ο τύπος που γράφει η λίστα αρχείων του προγράμματος.
export default function FileViewer({ file, onClose }) {
  const [url, setUrl] = useState(null);
  const [type, setType] = useState(() => baseType(file.type));
  const [text, setText] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let obj = null;
    downloadPlanFile(file.path)
      .then(async (blob) => {
        if (!alive) return;
        const real = baseType(blob.type) || baseType(file.type);
        obj = URL.createObjectURL(blob);
        setType(real);
        setUrl(obj);
        if (real === 'text/plain') setText(await blob.text());
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; if (obj) URL.revokeObjectURL(obj); };
  }, [file.path, file.type]);

  const close = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [close]);

  const download = () => {
    if (!url) return;
    Object.assign(document.createElement('a'), { href: url, download: downloadName(file.name, type) }).click();
  };

  const isImg = type === 'image/jpeg' || type === 'image/png';
  const isPdf = type === 'application/pdf';
  const isText = type === 'text/plain';

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={file.name} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="viewer-box">
        <header className="viewer-head">
          <b className="viewer-name">{file.name}</b>
          <div className="viewer-actions">
            <button type="button" className="btn small" onClick={download} disabled={!url}><DownloadIcon size={16} /> Λήψη</button>
            <button type="button" className="icon-btn" onClick={close} aria-label="Κλείσιμο"><CloseIcon /></button>
          </div>
        </header>
        <div className="viewer-body">
          {failed ? (
            <p className="meta">Το αρχείο δεν φορτώθηκε. Δοκίμασε ξανά.</p>
          ) : !url ? (
            <span className="sk viewer-sk" aria-label="Φόρτωση" />
          ) : isImg ? (
            <img src={url} alt={file.name} />
          ) : isPdf ? (
            <iframe src={url} title={file.name} />
          ) : isText ? (
            <pre>{text}</pre>
          ) : (
            <div className="viewer-noprev">
              <p>Αυτός ο τύπος αρχείου δεν προβάλλεται στη σελίδα.</p>
              <button type="button" className="btn primary" onClick={download}><DownloadIcon size={18} /> Λήψη αρχείου</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
