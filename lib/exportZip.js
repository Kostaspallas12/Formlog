// Λήψη των δεδομένων μου (GDPR): ένα ZIP με
//   φωτογραφίες/…jpg   οι φωτογραφίες ως κανονικά αρχεία
//   καταγραφές.csv     ημερομηνία, βάρος, φωτογραφίες, σημείωση – ανοίγει στο Excel
//   βάρος.csv          ο πίνακας βάρους (ημερομηνία, κιλά, σημείωση) – ανοίγει στο Excel
//   δεδομένα.json      όλα τα δεδομένα σε μορφή για μεταφορά σε άλλη υπηρεσία
// Ο προπονητής παίρνει έναν φάκελο ανά αθλούμενο.

import { strToU8, zipSync } from 'fflate';
import { getPhoto, listAthletes, listCheckins, listWeighIns, withWeights } from './storage';
import { ANGLES, todayISO } from './utils';

const ANGLE_FILE = { front: 'μπροστά', side: 'πλάγια', back: 'πίσω' };

// Ονόματα που επιτρέπονται σε φάκελο Windows/Mac
const safeName = (s) => s.replace(/[\\/:*?"<>|]/g, '').trim() || 'χωρίς όνομα';

// CSV για ελληνικό Excel: διαχωριστικό ";" και υποδιαστολή ","
const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n');

const README = `Τα δεδομένα σου από το FormLog

φωτογραφίες/     Οι φωτογραφίες προόδου, με όνομα "ημερομηνία πλευρά.jpg".
καταγραφές.csv   Οι καταγραφές με φωτογραφίες (ημερομηνία, βάρος, φωτογραφίες, σημείωση). Ανοίγει στο Excel.
βάρος.csv        Όλο το ιστορικό βάρους (ημερομηνία, κιλά, σημείωση). Ανοίγει στο Excel.
δεδομένα.json    Όλα τα δεδομένα του λογαριασμού σε μορφή κατάλληλη για μεταφορά σε άλλη υπηρεσία.
`;

// Φωτογραφίες + CSV ενός αθλούμενου μέσα στον φάκελο `dir` ('' για τη ρίζα)
async function addAthlete(files, dir, athlete) {
  const weighIns = await listWeighIns(athlete.id);
  const checkins = withWeights(await listCheckins(athlete.id), weighIns);
  const used = new Set();
  const rows = [['Ημερομηνία', 'Βάρος (kg)', 'Μπροστά', 'Πλάγια', 'Πίσω', 'Σημείωση']];
  const json = [];

  for (const c of checkins) {
    const photoFiles = {};
    for (const a of ANGLES) {
      const id = c.photos[a.id];
      const blob = id && (await getPhoto(id));
      if (!blob) continue;
      // Δύο καταγραφές την ίδια μέρα: "… (2).jpg"
      let name = `${c.date} ${ANGLE_FILE[a.id]}.jpg`;
      for (let n = 2; used.has(name); n++) name = `${c.date} ${ANGLE_FILE[a.id]} (${n}).jpg`;
      used.add(name);
      files[`${dir}φωτογραφίες/${name}`] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }];
      photoFiles[a.id] = `φωτογραφίες/${name}`;
    }
    rows.push([
      c.date,
      c.weight != null ? String(c.weight).replace('.', ',') : '',
      photoFiles.front ?? '', photoFiles.side ?? '', photoFiles.back ?? '',
      c.note,
    ]);
    json.push({ date: c.date, weight: c.weight, note: c.note, photos: photoFiles, createdAt: c.createdAt });
  }

  files[`${dir}καταγραφές.csv`] = strToU8(csv(rows));

  const kgRows = [['Ημερομηνία', 'Βάρος (kg)', 'Σημείωση']];
  for (const w of weighIns) kgRows.push([w.date, String(w.weight).replace('.', ','), w.note]);
  files[`${dir}βάρος.csv`] = strToU8(csv(kgRows));

  return {
    checkins: json,
    weighIns: weighIns.map((w) => ({ date: w.date, weight: w.weight, note: w.note, createdAt: w.createdAt })),
  };
}

export async function buildExportZip(user) {
  const { email, name, type, createdAt, consent } = user;
  const account = { email, name, type, createdAt, consent };
  const athletes = await listAthletes();
  const files = { 'ΔΙΑΒΑΣΕ ΜΕ.txt': strToU8(README) };
  const data = { exportedAt: new Date().toISOString(), account, athletes: [] };

  if (account.type === 'coach') {
    const usedDirs = new Set();
    for (const a of athletes) {
      let dir = safeName(a.name);
      for (let n = 2; usedDirs.has(dir); n++) dir = `${safeName(a.name)} (${n})`;
      usedDirs.add(dir);
      const { checkins, weighIns } = await addAthlete(files, `${dir}/`, a);
      data.athletes.push({ name: a.name, folder: dir, createdAt: a.createdAt, consentConfirmedAt: a.consentConfirmedAt, checkins, weighIns });
    }
  } else {
    const me = athletes.find((a) => a.self);
    if (me) Object.assign(data, await addAthlete(files, '', me));
    delete data.athletes;
  }

  files['δεδομένα.json'] = strToU8(JSON.stringify(data, null, 2));
  return new Blob([zipSync(files)], { type: 'application/zip' });
}

export const exportFileName = () => `formlog-${todayISO()}.zip`;
