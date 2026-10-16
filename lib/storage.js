// Αποθήκευση στο Supabase: βάση (αθλούμενοι, καταγραφές) και Storage (φωτογραφίες).
// Οι κανόνες ασφαλείας (RLS) στη βάση εξασφαλίζουν ότι κάθε χρήστης βλέπει μόνο τα δικά του.
// Η δομή της βάσης είναι στο supabase/schema.sql.

import { currentUserId, supabase } from './supabase';

const BUCKET = 'photos';

// Ρίχνει το σφάλμα του Supabase ώστε να το πιάσει όποιος καλεί.
const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> 0;
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });

/* ---------- Λογαριασμός ---------- */

export const getProfile = async (id) =>
  check(await supabase.from('profiles').select('name, type, consent, created_at').eq('id', id).maybeSingle());

export const updateProfileName = async (id, name) =>
  check(await supabase.from('profiles').update({ name }).eq('id', id));

/* ---------- Αθλούμενοι ---------- */

const toAthlete = (r) => r && ({
  id: r.id, owner: r.owner, name: r.name, self: r.self,
  consentConfirmedAt: r.consent_confirmed_at, createdAt: r.created_at,
});

// Οι αθλούμενοι του συνδεδεμένου χρήστη (το RLS επιστρέφει μόνο τους δικούς του).
export const listAthletes = async () =>
  check(await supabase.from('athletes').select('*').order('created_at')).map(toAthlete);

export const getAthlete = async (id) =>
  toAthlete(check(await supabase.from('athletes').select('*').eq('id', id).maybeSingle()));

export async function addAthlete(name, { self = false, consentConfirmedAt = null } = {}) {
  const row = check(
    await supabase.from('athletes')
      .insert({ name: name.trim(), self, consent_confirmed_at: consentConfirmedAt })
      .select().single()
  );
  return toAthlete(row);
}

// Ο προσωπικός λογαριασμός έχει πάντα έναν αθλούμενο: τον εαυτό του.
// (Κρατάμε την κλήση σε εξέλιξη ώστε δύο ταυτόχρονες κλήσεις να μη φτιάξουν δύο.)
let selfPending = null;
export function getSelfAthlete(user) {
  if (!selfPending) {
    selfPending = (async () => {
      const found = check(await supabase.from('athletes').select('*').eq('self', true).maybeSingle());
      if (found) return toAthlete(found);
      try {
        return await addAthlete(user.name, { self: true });
      } catch (e) {
        // Το έφτιαξε ήδη άλλη καρτέλα (μοναδικός self ανά χρήστη στη βάση)
        if (e.code !== '23505') throw e;
        return toAthlete(check(await supabase.from('athletes').select('*').eq('self', true).single()));
      }
    })().finally(() => { selfPending = null; });
  }
  return selfPending;
}

export async function deleteAthlete(id) {
  const checkins = await listCheckins(id);
  check(await supabase.from('athletes').delete().eq('id', id)); // οι καταγραφές σβήνονται μαζί
  await removePhotos(checkins.flatMap((c) => Object.values(c.photos)));
}

/* ---------- Καταγραφές ---------- */

const toCheckin = (r) => ({
  id: r.id, athleteId: r.athlete_id, date: r.date,
  weight: r.weight == null ? null : Number(r.weight),
  photos: r.photos ?? {}, note: r.note ?? '', createdAt: r.created_at,
});

// Ταξινομημένες από την παλαιότερη στη νεότερη.
export const listCheckins = async (athleteId) =>
  check(
    await supabase.from('checkins').select('*').eq('athlete_id', athleteId)
      .order('date').order('created_at')
  ).map(toCheckin);

// (Το βάρος δεν αποθηκεύεται εδώ αλλά στον πίνακα βάρους – δες setWeighIn.)
export const putCheckin = async (c) =>
  check(await supabase.from('checkins').upsert({
    id: c.id, athlete_id: c.athleteId, date: c.date, weight: null,
    photos: c.photos, note: c.note, created_at: c.createdAt,
  }));

export async function deleteCheckin(c) {
  check(await supabase.from('checkins').delete().eq('id', c.id));
  await removePhotos(Object.values(c.photos));
}

/* ---------- Βάρος ---------- */
// Ένα βάρος ανά αθλούμενο ανά ημέρα (πίνακας weigh_ins). Είναι η μόνη πηγή για το βάρος:
// ο πίνακας τύπου Excel, το γράφημα και οι καταγραφές με φωτογραφίες διαβάζουν όλα από εδώ.

const toWeighIn = (r) => ({
  id: r.id, athleteId: r.athlete_id, date: r.date,
  weight: Number(r.weight), note: r.note ?? '', createdAt: r.created_at,
});

// Ταξινομημένα από το παλαιότερο στο νεότερο.
export const listWeighIns = async (athleteId) =>
  check(await supabase.from('weigh_ins').select('*').eq('athlete_id', athleteId).order('date')).map(toWeighIn);

// Γράφει το βάρος μιας ημέρας· αν υπάρχει ήδη για εκείνη τη μέρα, το αντικαθιστά.
// Η σημείωση αλλάζει μόνο αν δοθεί.
export async function setWeighIn({ athleteId, date, weight, note }) {
  const row = { athlete_id: athleteId, date, weight };
  if (note !== undefined) row.note = note;
  check(await supabase.from('weigh_ins').upsert(row, { onConflict: 'athlete_id,date' }));
}

export async function updateWeighIn(id, patch) {
  const row = {};
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.weight !== undefined) row.weight = patch.weight;
  if (patch.note !== undefined) row.note = patch.note;
  check(await supabase.from('weigh_ins').update(row).eq('id', id));
}

export const deleteWeighIn = async (id) => check(await supabase.from('weigh_ins').delete().eq('id', id));

export const deleteWeighInOn = async (athleteId, date) =>
  check(await supabase.from('weigh_ins').delete().eq('athlete_id', athleteId).eq('date', date));

// Βάζει σε κάθε καταγραφή το βάρος της ημέρας της (από τον πίνακα βάρους).
export function withWeights(checkins, weighIns) {
  const byDate = new Map(weighIns.map((w) => [w.date, w.weight]));
  return checkins.map((c) => ({ ...c, weight: byDate.get(c.date) ?? null }));
}

/* ---------- Φωτογραφίες ---------- */
// Το "id" μιας φωτογραφίας είναι η διαδρομή της στο Storage: <user id>/<uuid>.jpg

const photoCache = new Map(); // διαδρομή → Promise<Blob>, για να μην κατεβαίνει ξανά η ίδια

export async function addPhoto(blob) {
  const path = `${await currentUserId()}/${uuid()}.jpg`;
  check(await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
  photoCache.set(path, Promise.resolve(blob));
  return path;
}

export function getPhoto(path) {
  if (!photoCache.has(path)) {
    const p = supabase.storage.from(BUCKET).download(path).then(({ data, error }) => {
      if (error) {
        photoCache.delete(path);
        return null;
      }
      return data;
    });
    photoCache.set(path, p);
  }
  return photoCache.get(path);
}

export async function removePhotos(paths) {
  const list = paths.filter(Boolean);
  list.forEach((p) => photoCache.delete(p));
  for (let i = 0; i < list.length; i += 100) {
    check(await supabase.storage.from(BUCKET).remove(list.slice(i, i + 100)));
  }
}

export const removePhoto = (path) => removePhotos([path]);

/* ---------- Δικαιώματα χρήστη (GDPR) ---------- */
// Η λήψη δεδομένων (ZIP) είναι στο lib/exportZip.js.

// Οριστική διαγραφή: πρώτα όλες οι φωτογραφίες από το Storage,
// μετά ο λογαριασμός (προφίλ, αθλούμενοι, καταγραφές σβήνονται μαζί στη βάση).
export async function deleteMyAccount() {
  const uid = await currentUserId();
  let last = null;
  for (;;) {
    const files = check(await supabase.storage.from(BUCKET).list(uid, { limit: 1000 }));
    if (!files.length) break;
    // Αν δεν σβήστηκε τίποτα από τον προηγούμενο γύρο, σταματάμε αντί να κολλήσουμε.
    if (files[0].name === last) throw new Error('Δεν ήταν δυνατή η διαγραφή των φωτογραφιών.');
    last = files[0].name;
    await removePhotos(files.map((f) => `${uid}/${f.name}`));
  }
  check(await supabase.rpc('delete_my_account'));
  photoCache.clear();
}
