// Παράγει το formlog/app/walls.css: μοτίβα (SVG, inline) για το φόντο της συνομιλίας.
const fs = require('fs');
const out = process.argv[2];

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
  '<path d="M13 2.5 5.5 13h6l-1 8.5L18 11h-6z"/>',
  // φωτογραφική μηχανή (φωτογραφίες προόδου)
  '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  // ζυγαριά
  '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 10a4.5 4.5 0 0 1 7 0M12 10.5l1.5-2"/>',
  // παπούτσι
  '<path d="M3 17V9.5l4 1.3 2-2.8 3.5 3.5 5.5 1.5a3 3 0 0 1 3 3V17zM3 17h18M8 13.5l1.2-1.2M10.5 15l1.2-1.2"/>',
  // μπάρα
  '<path d="M2.5 12h19M6 8v8M8.5 9v6M18 8v8M15.5 9v6"/>',
  // μετάλλιο
  '<path d="m8 3 4 6 4-6"/><circle cx="12" cy="15" r="5.5"/><path d="m12 12.5.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
];

const FOOD = [
  // μήλο
  '<path d="M12 7.5c-2-1.5-6.5-1-6.5 4 0 4.5 3 9.5 6.5 8 3.5 1.5 6.5-3.5 6.5-8 0-5-4.5-5.5-6.5-4z"/><path d="M12 7.5c0-2 1-3.5 3-4.5"/>',
  // καρότο
  '<path d="M14.5 9.5 4 20l2-6.5 5-5.5a3 3 0 0 1 3.5 1.5zM14.5 9.5 18 6M15 8l1-4M16 9l4-1"/>',
  // αβοκάντο
  '<path d="M12 3c3 0 5 5 6 9a6 6 0 0 1-12 0c1-4 3-9 6-9z"/><circle cx="12" cy="14.5" r="2.5"/>',
  // αυγό
  '<path d="M12 3c3.5 0 6 6 6 10.5a6 6 0 0 1-12 0C6 9 8.5 3 12 3z"/>',
  // φύλλο
  '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l8-8"/>',
  // μπανάνα
  '<path d="M4 12.5c3 5.5 11 6.5 16-3l-1.2-2c-3 6-9 7-13.3 3.2zM18.8 7.5l.7-2"/>',
  // ποτήρι νερό
  '<path d="M6 4h12l-1.5 16h-9zM7 9h10"/>',
  // μπρόκολο
  '<path d="M12 21v-6.5M9.5 21h5M12 14.5c-4 0-6.5-2-5.5-5 0-2 2-3 3-3 1-2 4-2 5 0 2 0 3.5 2 2.5 4 1 3-1 4-5 4z"/>',
  // κεράσια
  '<circle cx="8" cy="17" r="3"/><circle cx="16" cy="17" r="3"/><path d="M8 14c1-5 3-8 6-10M16 14c0-4-1-7-2-10M14 4h3"/>',
  // μπολ
  '<path d="M3 12h18a9 9 0 0 1-18 0zM8 12c0-2 1-4 3-4M13 12c0-3 2-4 4-3"/>',
  // ψάρι
  '<path d="M3 12c3-4.5 9-6 14 0-5 6-11 4.5-14 0zM17 12l4-3.5v7z"/><circle cx="8" cy="11" r=".6"/>',
  // λεμόνι
  '<path d="M5 12a7 5.5 0 0 0 14 0 7 5.5 0 0 0-14 0zM5 12H3.5M19 12h1.5"/><path d="M9 10.5c1-1 3-1.5 4.5-1"/>',
];

const WAVES = [
  '<path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 4-2.5 5 0"/>',
  '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.5"/>',
  '<path d="M12 6v12M6 12h12"/>',
  '<circle cx="7" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="17" cy="12" r="1.6"/>',
  '<path d="M4 16 12 6l8 10z"/>',
  '<path d="M3 9c3 2 6 2 9 0s6-2 9 0M3 15c3 2 6 2 9 0s6-2 9 0"/>',
  '<rect x="6" y="6" width="12" height="12" rx="3"/>',
  '<path d="M5 19 19 5M9 19 19 9M5 15 15 5"/>',
];

// Ψευδοτυχαίο αλλά σταθερό: κάθε build βγάζει το ίδιο μοτίβο.
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

function tile(icons, { size = 360, cols = 7, seed = 7, scale = 1.3 } = {}) {
  const r = rng(seed);
  const cell = size / cols;
  let g = '';
  let k = 0;
  for (let y = 0; y < cols; y++) {
    for (let x = 0; x < cols; x++) {
      const icon = icons[(x * 5 + y * 3 + k++ * 0) % icons.length];
      const cx = x * cell + cell / 2 + (r() - 0.5) * cell * 0.35 + (y % 2 ? cell / 4 : 0);
      const cy = y * cell + cell / 2 + (r() - 0.5) * cell * 0.35;
      const rot = Math.round((r() - 0.5) * 70);
      const s = scale * (0.85 + r() * 0.3);
      g += `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot}) scale(${s.toFixed(2)}) translate(-12 -12)">${icon}</g>`;
    }
  }
  return (color, opacity) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<g fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${g}</g></svg>`;
}

const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}")`;

const THEMES = {
  gym: { draw: tile(GYM, { seed: 11 }), light: ['#eaf3ef', '#0e5c48', 0.13], dark: ['#0d1916', '#9fe8cf', 0.075] },
  food: { draw: tile(FOOD, { seed: 23 }), light: ['#f5f0e6', '#7a5a1e', 0.13], dark: ['#17140e', '#f0d9a8', 0.07] },
  waves: { draw: tile(WAVES, { seed: 5, cols: 6, scale: 1.35 }), light: ['#ebeff6', '#2c4a7a', 0.12], dark: ['#0d121b', '#b8cdf0', 0.07] },
};

let css = '/* Παράγεται αυτόματα: φόντο της συνομιλίας (Λογαριασμός → Φόντο συνομιλίας). */\n';
let dark = '';
for (const [id, t] of Object.entries(THEMES)) {
  const [bg, ink, op] = t.light;
  const [dbg, dink, dop] = t.dark;
  css += `.wall-${id} .chat-scroll, .wall-swatch.wall-${id} { background: ${bg} ${uri(t.draw(ink, op))} 0 0 / 360px; }\n`;
  dark += `  .wall-${id} .chat-scroll, .wall-swatch.wall-${id} { background: ${dbg} ${uri(t.draw(dink, dop))} 0 0 / 360px; }\n`;
}
css += `@media (prefers-color-scheme: dark) {\n${dark}}\n`;
fs.writeFileSync(out, css);
console.log('ok', css.length);
