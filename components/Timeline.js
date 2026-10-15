'use client';

import { useEffect, useState } from 'react';
import { ANGLES, fmtDate, fmtDelta, fmtKg } from '@/lib/utils';
import Photo from './Photo';

// Το αρχείο: όλες οι καταγραφές, από τη νεότερη στην παλαιότερη.
export default function Timeline({ checkins, onEdit, onDelete }) {
  const [zoom, setZoom] = useState(null); // { id, label }

  // Διαφορά βάρους από την προηγούμενη καταγραφή που είχε βάρος
  let lastKg = null;
  const rows = checkins.map((c) => {
    const delta = c.weight != null && lastKg != null ? c.weight - lastKg : null;
    if (c.weight != null) lastKg = c.weight;
    return { c, delta };
  }).reverse();

  return (
    <>
      <ol className="timeline">
        {rows.map(({ c, delta }) => (
          <li key={c.id} className="entry">
            <div className="entry-head">
              <div>
                <h3>{fmtDate(c.date, { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                <span className="meta">
                  {c.weight != null ? `${fmtKg(c.weight)} kg` : 'Χωρίς βάρος'}
                  {delta != null && <span className={delta < 0 ? 'down' : delta > 0 ? 'up' : ''}> · {fmtDelta(delta)}</span>}
                </span>
              </div>
              <div className="row">
                <button className="btn small" onClick={() => onEdit(c)}>Επεξεργασία</button>
                <button
                  className="btn small ghost danger"
                  onClick={() => confirm('Οριστική διαγραφή αυτής της καταγραφής και των φωτογραφιών της;') && onDelete(c)}
                >
                  Διαγραφή
                </button>
              </div>
            </div>

            <div className="thumbs">
              {ANGLES.map((a) =>
                c.photos[a.id] ? (
                  <figure key={a.id}>
                    <Photo
                      id={c.photos[a.id]} alt={`${a.label}, ${fmtDate(c.date)}`}
                      onClick={() => setZoom({ id: c.photos[a.id], label: `${a.label} · ${fmtDate(c.date)}` })}
                    />
                    <figcaption>{a.label}</figcaption>
                  </figure>
                ) : (
                  <figure key={a.id} className="missing">
                    <span className="ph" />
                    <figcaption>{a.label}</figcaption>
                  </figure>
                )
              )}
            </div>
            {c.note && <p className="entry-note">{c.note}</p>}
          </li>
        ))}
      </ol>

      {zoom && <Lightbox {...zoom} onClose={() => setZoom(null)} />}
    </>
  );
}

function Lightbox({ id, label, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <Photo id={id} alt={label} />
      <p>{label}</p>
      <button className="x light" onClick={onClose} aria-label="Κλείσιμο">✕</button>
    </div>
  );
}
