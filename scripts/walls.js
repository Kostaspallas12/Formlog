// Παράγει τα μοτίβα (doodle) για το φόντο της συνομιλίας: public/walls/*.svg και app/walls.css.
// Χρήση: node scripts/walls.js
const fs = require('fs');

// «A:» μπροστά = σχέδιο με το δεύτερο χρώμα του θέματος.
const GYM = [
  // αλτήρας
  '<path d="M7 7v10M17 7v10M4.5 9.5v5M19.5 9.5v5M7 12h10"/>',
  // kettlebell
  '<circle cx="12" cy="15" r="6"/><path d="M8.6 10.6A4 4 0 0 1 9 5h6a4 4 0 0 1 .4 5.6"/>',
  // χρονόμετρο
  '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10M10 3h4M12 3v3.5M18 7l1.5-1.5"/>',
  // καρδιά με παλμό
  '<path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20z"/><path d="M6.5 12.5h2.5l1.5-2.5 2 4.5 1.5-2h3.5"/>',
  // παγούρι
  '<path d="M10 2.5h4M10.5 2.5v3L8.5 8v12a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5V8l-2-2.5v-3M8.5 13h7"/>',
  // δίσκος βαρών
  '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2"/><path d="M12 5.5v1.5"/>',
  // κεραυνός (ενέργεια)
  'A:<path d="M13 2.5 5.5 13h6l-1 8.5L18 11h-6z"/>',
  // φωτογραφική μηχανή (φωτογραφίες προόδου)
  '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  // ζυγαριά
  '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 10a4.5 4.5 0 0 1 7 0M12 10.5l1.5-2"/>',
  // παπούτσι
  '<path d="M3 17V9.5l4 1.3 2-2.8 3.5 3.5 5.5 1.5a3 3 0 0 1 3 3V17zM3 17h18M8 13.5l1.2-1.2M10.5 15l1.2-1.2"/>',
  // μπάρα
  '<path d="M2.5 12h19M6 8v8M8.5 9v6M18 8v8M15.5 9v6"/>',
  // μετάλλιο
  'A:<path d="m8 3 4 6 4-6"/><circle cx="12" cy="15" r="5.5"/>',
];

const FOOD = [
  // μήλο
  '<path d="M12 7.5c-2-1.5-6.5-1-6.5 4 0 4.5 3 9.5 6.5 8 3.5 1.5 6.5-3.5 6.5-8 0-5-4.5-5.5-6.5-4z"/><path d="M12 7.5c0-2 1-3.5 3-4.5"/>',
  // καρότο
  'A:<path d="M14.5 9.5 4 20l2-6.5 5-5.5a3 3 0 0 1 3.5 1.5zM14.5 9.5 18 6M15 8l1-4M16 9l4-1"/>',
  // αβοκάντο
  '<path d="M12 3c3 0 5 5 6 9a6 6 0 0 1-12 0c1-4 3-9 6-9z"/><circle cx="12" cy="14.5" r="2.5"/>',
  // αυγό
  '<path d="M12 3c3.5 0 6 6 6 10.5a6 6 0 0 1-12 0C6 9 8.5 3 12 3z"/>',
  // φύλλο
  '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l8-8"/>',
  // μπανάνα
  'A:<path d="M4 12.5c3 5.5 11 6.5 16-3l-1.2-2c-3 6-9 7-13.3 3.2zM18.8 7.5l.7-2"/>',
  // ποτήρι νερό
  '<path d="M6 4h12l-1.5 16h-9zM7 9h10"/>',
  // μπρόκολο
  '<path d="M12 21v-6.5M9.5 21h5M12 14.5c-4 0-6.5-2-5.5-5 0-2 2-3 3-3 1-2 4-2 5 0 2 0 3.5 2 2.5 4 1 3-1 4-5 4z"/>',
  // κεράσια
  '<circle cx="8" cy="17" r="3"/><circle cx="16" cy="17" r="3"/><path d="M8 14c1-5 3-8 6-10M16 14c0-4-1-7-2-10M14 4h3"/>',
  // μπολ
  '<path d="M3 12h18a9 9 0 0 1-18 0zM8 12c0-2 1-4 3-4M13 12c0-3 2-4 4-3"/>',
  // ψάρι
  '<path d="M3 12c3-4.5 9-6 14 0-5 6-11 4.5-14 0zM17 12l4-3.5v7z"/>',
  // λεμόνι
  'A:<path d="M5 12a7 5.5 0 0 0 14 0 7 5.5 0 0 0-14 0zM5 12H3.5M19 12h1.5"/>',
];

// Αφηρημένα σχέδια: σπείρες, ζιγκ-ζαγκ, αστέρια, βέλη.
function spiral(turns, r0) {
  let d = 'M12 12';
  for (let a = 0.4; a <= turns * Math.PI * 2; a += 0.4) {
    const r = (r0 * a) / (turns * Math.PI * 2);
    d += 'L' + (12 + r * Math.cos(a)).toFixed(1) + ' ' + (12 + r * Math.sin(a)).toFixed(1);
  }
  return '<path d="' + d + '"/>';
}
const SWIRL = [
  spiral(3, 11),
  'A:' + spiral(2.2, 9),
  '<path d="M2 15l4-7 4 8 4-8 4 8 4-7"/>',
  'A:<path d="M12 2.5l2.8 6.2 6.7.8-5 4.5 1.4 6.6L12 17.2l-5.9 3.4 1.4-6.6-5-4.5 6.7-.8z"/>',
  '<path d="M3 18C6 8 13 5 20 6M15 2.5 20.5 6 17 11"/>',
  '<path d="M2.5 12c2-5 4-5 6 0s4 5 6 0 4-5 7-1"/>',
  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  'A:<path d="M12 3l9 9-9 9-9-9z"/>',
  '<path d="M3 18a9 9 0 0 1 18 0zM8 18a4 4 0 0 1 8 0"/>',
  '<path d="M12 3.5 21 19.5H3z"/>',
  '<path d="M3 16c4 5 9 3 8-3s-6-5-5 0 8 6 15-3"/>',
  '<path d="M4 8c3-4 6-4 8 0s5 4 8 0M4 16c3-4 6-4 8 0s5 4 8 0"/>',
  'A:<path d="M12 4v16M4 12h16"/>',
  '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 12h6"/>',
  '<path d="M4 20 20 4M20 4h-8M20 4v8"/>',
  '<path d="M8 6h.01M16 5h.01M5 13h.01M12 12h.01M19 12h.01M9 19h.01M16 19h.01"/>',
];

// Η πορεία του αθλούμενου: τικ, γραφήματα, φωτογραφίες, ημερολόγιο, στόχος, κύπελλο.
const PROGRESS = [
  'A:<path d="M4 12.5l5.5 5.5L20 6.5"/>',
  '<path d="M4 18l5-6 4 3 7-9M15 6h5v5"/>',
  '<path d="M6 20v-6M12 20V9M18 20V4"/>',
  '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>',
  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12h.01"/>',
  'A:<path d="M7 4h10v6a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 15v4M8.5 20h7"/>',
  '<rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="5" width="8" height="14" rx="2"/><path d="M5.5 15l1.5-2 1.5 2M15.5 15l1.5-2 1.5 2"/>',
  '<path d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 17h-9l-5 4v-4H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 5zM8 11l2.5 2.5L16 9"/>',
  'A:<path d="M6 21V4M6 4.5h12l-3 4 3 4H6"/>',
  '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  '<path d="M4 4v16h16M8 15l3-3 3 2 5-6"/>',
  'A:<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6.1L12 16.5l-5.4 3.1 1.2-6.1-4.5-4.2 6.1-.7z"/>',
];

// Μικρά γεμίσματα ανάμεσα στα σχέδια (όλα τα θέματα).
const FILL = [
  '<path d="M12 12h.01"/>',
  '<path d="M9 12h.01M15 12h.01"/>',
  '<path d="M7 12c2-3 3-3 5 0s3 3 5 0"/>',
  '<path d="M12 8v8M8 12h8"/>',
  '<circle cx="12" cy="12" r="3"/>',
];

// Ψευδοτυχαίο αλλά σταθερό: κάθε build βγάζει το ίδιο μοτίβο.
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

const SIZE = 480;

// Πυκνό μοτίβο που «δένει» στις άκρες: ό,τι ξεπερνά την άκρη ξανασχεδιάζεται από την απέναντι.
function tile(icons, { cols = 9, seed = 7, scale = 1.5 } = {}) {
  const r = rng(seed);
  const cell = SIZE / cols;
  const grid = [];
  let main = '';
  let accent = '';
  const put = (icon, cx, cy, rot, sc, width) => {
    const body = icon.replace(/^A:/, '');
    let out = '';
    for (const dx of [-SIZE, 0, SIZE]) for (const dy of [-SIZE, 0, SIZE]) {
      const x = cx + dx, y = cy + dy;
      if (x < -40 || x > SIZE + 40 || y < -40 || y > SIZE + 40) continue;
      out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${sc.toFixed(2)}) translate(-12 -12)" stroke-width="${(width / sc).toFixed(2)}">${body}</g>`;
    }
    if (icon.startsWith('A:')) accent += out; else main += out;
  };
  for (let y = 0; y < cols; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
      // Όχι το ίδιο σχέδιο δίπλα στο ίδιο (ούτε στην ένωση των άκρων).
      const near = [grid[y][x - 1], grid[y - 1]?.[x], y === cols - 1 ? grid[0][x] : null, x === cols - 1 ? grid[y][0] : null];
      let i;
      do { i = Math.floor(r() * icons.length); } while (near.includes(i));
      grid[y][x] = i;
      const cx = (x * cell + cell / 2 + (y % 2 ? cell / 2 : 0) + (r() - 0.5) * cell * 0.14) % SIZE;
      const cy = y * cell + cell / 2 + (r() - 0.5) * cell * 0.14;
      put(icons[i], cx, cy, Math.round((r() - 0.5) * 80), scale * (0.88 + r() * 0.3), 2.5);
      // Ένα μικρό γέμισμα στο κενό δίπλα του.
      const f = FILL[Math.floor(r() * FILL.length)];
      put(f, (cx + cell / 2) % SIZE, (cy + cell / 2) % SIZE, Math.round(r() * 180), 0.75, 2.2);
      const f2 = FILL[Math.floor(r() * FILL.length)];
      put(f2, (cx + cell / 2) % SIZE, cy, Math.round(r() * 180), 0.55, 2.2);
    }
  }
  const group = (color, opacity, body) =>
    `<g fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
  return ({ ink, op, accent: ac, aop }) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
    group(ink, op, main) + group(ac, aop, accent) + '</svg>';
}

// Κάθε θέμα έχει δικό του σχέδιο και τόνο, όλα από τα χρώματα του site.
const GREEN = '#0e8a6b', GREEN_D = '#3ccb9f', LOGO = '#14b478', INK = '#16202a', INK_D = '#e8eef2', AMBER = '#e8a33d', AMBER_D = '#f0b45a';
const THEMES = {
  // Σπείρες: αφηρημένα σχέδια σε απαλό πράσινο
  brand: {
    draw: tile(SWIRL, { seed: 5, cols: 8, scale: 2 }),
    light: { bg: '#e3f4ee', ink: GREEN, op: 0.36, accent: LOGO, aop: 0.62 },
    dark: { bg: '#0f1f1a', ink: GREEN_D, op: 0.24, accent: GREEN_D, aop: 0.42 },
  },
  // Ατσάλι: όργανα γυμναστηρίου σε γραφίτη
  gym: {
    draw: tile(GYM, { seed: 11, cols: 8, scale: 2 }),
    light: { bg: '#e6eaee', ink: INK, op: 0.28, accent: GREEN, aop: 0.62 },
    dark: { bg: '#161c22', ink: INK_D, op: 0.2, accent: GREEN_D, aop: 0.42 },
  },
  // Πρόοδος: λευκά σχέδια πάνω σε έντονο πράσινο
  progress: {
    draw: tile(PROGRESS, { seed: 37, cols: 8, scale: 2 }),
    light: { bg: '#bce6d4', ink: '#ffffff', op: 0.85, accent: GREEN, aop: 0.6 },
    dark: { bg: '#0b3a2e', ink: '#ffffff', op: 0.17, accent: GREEN_D, aop: 0.5 },
  },
  // Περιβόλι: φρούτα και λαχανικά σε ζεστό φόντο
  food: {
    draw: tile(FOOD, { seed: 23, cols: 8, scale: 2 }),
    light: { bg: '#f8f0e1', ink: GREEN, op: 0.36, accent: AMBER, aop: 0.75 },
    dark: { bg: '#1c1810', ink: GREEN_D, op: 0.22, accent: AMBER_D, aop: 0.42 },
  },
};

fs.mkdirSync('public/walls', { recursive: true });
let css = '/* Παράγεται από το scripts/walls.js: φόντο της συνομιλίας (Λογαριασμός → Εμφάνιση). */\n';
let dark = '';
let forced = '';
for (const [id, t] of Object.entries(THEMES)) {
  fs.writeFileSync(`public/walls/${id}-light.svg`, t.draw(t.light));
  fs.writeFileSync(`public/walls/${id}-dark.svg`, t.draw(t.dark));
  const sel = (pre) => `${pre}.wall-${id} .chat-scroll, ${pre}.wall-swatch.wall-${id}`;
  const d = `background: ${t.dark.bg} url("/walls/${id}-dark.svg") 0 0 / ${SIZE}px;`;
  css += `${sel('')} { background: ${t.light.bg} url("/walls/${id}-light.svg") 0 0 / ${SIZE}px; }\n`;
  // Σκούρο: με το θέμα της συσκευής (εκτός αν διάλεξε «Φωτεινό»), ή όταν διάλεξε «Σκούρο».
  dark += `  ${sel(":root:not([data-theme='light']) ")} { ${d} }\n`;
  forced += `${sel(":root[data-theme='dark'] ")} { ${d} }\n`;
}
css += `@media (prefers-color-scheme: dark) {\n${dark}}\n${forced}`;
fs.writeFileSync('app/walls.css', css);
console.log('ok', css.length);
