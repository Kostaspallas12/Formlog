// Προεπισκόπηση του αρχείου προόδου στην αρχική: στατιστικά, γράφημα βάρους, τελευταίες καταχωρήσεις.
// Ενδεικτικά δεδομένα, μόνο για παρουσίαση.

const ENTRIES = [
  { date: '12 Ιαν', kg: 86.4 },
  { date: '10 Μαρ', kg: 83.1 },
  { date: '8 Μαΐ', kg: 80.9 },
  { date: '4 Ιουλ', kg: 79.6 },
  { date: '2 Σεπ', kg: 78.2 },
];

const W = 300;
const H = 90;
const PAD = 8;

function chartPoints() {
  const kgs = ENTRIES.map((e) => e.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  return ENTRIES.map((e, i) => {
    const x = PAD + (i / (ENTRIES.length - 1)) * (W - PAD * 2);
    const y = PAD + ((max - e.kg) / (max - min)) * (H - PAD * 2);
    return [x, y];
  });
}

export default function HeroPreview() {
  const pts = chartPoints();
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${PAD},${H} ${line} ${W - PAD},${H}`;
  const recent = ENTRIES.slice(-3).reverse();

  return (
    <div className="preview" aria-label="Παράδειγμα του αρχείου προόδου">
      <div className="preview-head">
        <b>Η πρόοδός μου</b>
        <span className="pill">Ιαν – Σεπ 2026</span>
      </div>

      <div className="preview-stats">
        <div><b>15</b><span>φωτογραφίες</span></div>
        <div><b>233</b><span>ημέρες</span></div>
        <div><b className="good">−8,2 kg</b><span>συνολικά</span></div>
      </div>

      <svg className="preview-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <polygon points={area} className="area" />
        <polyline points={line} className="line" />
        {pts.map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.5" className="dot" />)}
      </svg>

      <ul className="preview-list">
        {recent.map((e, i) => (
          <li key={e.date}>
            <span className={`thumb t${i}`} aria-hidden="true" />
            <span className="when"><b>{e.date}</b><small>Μπροστά · Πλάγια · Πίσω</small></span>
            <span className="kg">{e.kg.toFixed(1).replace('.', ',')} kg</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
