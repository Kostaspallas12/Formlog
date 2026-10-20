'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertIcon, QuestionIcon } from './Icons';

// Δικό μας παράθυρο επιβεβαίωσης στο στυλ του site, αντί για το confirm() του browser.
// Χρήση:  if (await confirmDialog('Κείμενο;')) { ... }   ή   confirmDialog({ text, danger, confirmLabel })
let opener = null;
const DANGER = /διαγρα|οριστικ|αφαίρεσ|αφαιρεσ|διακοπ|αποχώρησ|αποχωρησ|ακύρωσ|ακυρωσ|σβήσ|σβησ/i;

export function confirmDialog(opts) {
  const o = typeof opts === 'string' ? { text: opts } : (opts || {});
  const text = o.text || o.title || '';
  return new Promise((resolve) => {
    if (!opener) {
      resolve(typeof window !== 'undefined' ? window.confirm(text) : false);
      return;
    }
    opener({
      text,
      danger: o.danger != null ? o.danger : DANGER.test(text),
      confirmLabel: o.confirmLabel || 'Ναι',
      cancelLabel: o.cancelLabel || 'Άκυρο',
      resolve,
    });
  });
}

export default function ConfirmHost() {
  const [state, setState] = useState(null);
  useEffect(() => {
    opener = setState;
    return () => { if (opener === setState) opener = null; };
  }, []);
  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { state.resolve(false); setState(null); }
      else if (e.key === 'Enter') { state.resolve(true); setState(null); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state]);

  if (!state) return null;
  const close = (v) => { state.resolve(v); setState(null); };
  return createPortal(
    <div className="confirm" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) close(false); }}>
      <div className="confirm-box">
        <span className="confirm-icon" data-danger={state.danger || undefined}>{state.danger ? <AlertIcon size={26} /> : <QuestionIcon size={26} />}</span>
        <p className="confirm-text">{state.text}</p>
        <div className="confirm-actions">
          <button type="button" className="btn" onClick={() => close(false)}>{state.cancelLabel}</button>
          <button type="button" className={state.danger ? 'btn danger-solid' : 'btn primary'} onClick={() => close(true)} autoFocus>{state.confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
