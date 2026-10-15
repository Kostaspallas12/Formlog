export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
};

export const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('el-GR', opts);

export const daysBetween = (a, b) =>
  Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);

export const fmtKg = (kg) => kg.toFixed(1).replace('.', ',');

// Διαφορά βάρους με πρόσημο, π.χ. "−2,4 kg" ή "+0,6 kg"
export const fmtDelta = (d) => (d > 0 ? '+' : d < 0 ? '−' : '±') + fmtKg(Math.abs(d)) + ' kg';

export const ANGLES = [
  { id: 'front', label: 'Μπροστά' },
  { id: 'side', label: 'Πλάγια' },
  { id: 'back', label: 'Πίσω' },
];
