// Αποθήκευση στο Supabase: βάση (αθλούμενοι, καταγραφές) και Storage (φωτογραφίες).
// Οι κανόνες ασφαλείας (RLS) στη βάση εξασφαλίζουν ότι κάθε χρήστης βλέπει μόνο τα δικά του.
// Η δομή της βάσης είναι στο supabase/schema.sql.

import { currentUserId, supabase } from './supabase';
import { makeThumb } from './images';

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
  check(await supabase.from('profiles').select('*').eq('id', id).maybeSingle());

export const updateProfileName = async (id, name) =>
  check(await supabase.from('profiles').update({ name }).eq('id', id));

// Ρυθμίσεις ειδοποιήσεων, π.χ. { notify_checkins: false }
export const updateProfileSettings = async (id, patch) =>
  check(await supabase.from('profiles').update(patch).eq('id', id));

/* ---------- Συνομιλία προπονητή ↔ αθλούμενου ---------- */

const toMessage = (r) => ({
  id: r.id, athleteId: r.athlete_id, sender: r.sender, body: r.body, photo: r.photo ?? null,
  createdAt: r.created_at, readAt: r.read_at,
});

// Τα τελευταία 300 μηνύματα μιας συνομιλίας, από το παλιότερο στο νεότερο.
export const listMessages = async (athleteId) =>
  check(await supabase.from('messages').select('*').eq('athlete_id', athleteId)
    .order('created_at', { ascending: false }).limit(300)).reverse().map(toMessage);

// photo: διαδρομή φωτογραφίας από addPhoto (προαιρετική· τότε το κείμενο είναι λεζάντα).
export async function sendMessage(athleteId, body, photo = null) {
  const row = { athlete_id: athleteId, body: body.trim() };
  if (photo) row.photo = photo;
  return toMessage(check(await supabase.from('messages').insert(row).select().single()));
}

// Ό,τι έστειλε ο άλλος σε αυτή τη συνομιλία σημειώνεται «διαβάστηκε».
export const markMessagesRead = async (athleteId, meId) =>
  check(await supabase.from('messages').update({ read_at: new Date().toISOString() })
    .eq('athlete_id', athleteId).is('read_at', null).neq('sender', meId));

// Αδιάβαστα μηνύματα προς εμένα (σε όλες τις συνομιλίες μου).
export const listUnreadMessages = async (meId) =>
  check(await supabase.from('messages').select('*').is('read_at', null).neq('sender', meId)
    .order('created_at')).map(toMessage);

// Ζωντανά: νέα μηνύματα (INSERT) και «διαβάστηκε» (UPDATE). Χωρίς athleteId: όλες οι συνομιλίες μου.
export function onMessages(athleteId, cb) {
  const filter = athleteId ? { filter: `athlete_id=eq.${athleteId}` } : {};
  const ch = supabase.channel(`messages:${athleteId || 'all'}:${uuid()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', ...filter },
      ({ eventType, new: r }) => r?.id && cb(eventType, toMessage(r)))
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

/* ---------- Ειδοποιήσεις (για τον προπονητή) ---------- */

// Οι αδιάβαστες ειδοποιήσεις: [{ id, athleteId, createdAt }]
export const listUnreadNotifications = async () =>
  check(await supabase.from('notifications').select('id, athlete_id, created_at').is('read_at', null))
    .map((r) => ({ id: r.id, athleteId: r.athlete_id, createdAt: r.created_at }));

// Ο προπονητής άνοιξε τον αθλούμενο: ό,τι είχε έρθει από αυτόν θεωρείται διαβασμένο.
export const markAthleteRead = async (athleteId) =>
  check(await supabase.from('notifications').update({ read_at: new Date().toISOString() })
    .eq('athlete_id', athleteId).is('read_at', null));

// Ζωντανά: κάθε νέα ειδοποίηση μόλις δημιουργηθεί. Επιστρέφει συνάρτηση για σταμάτημα.
export function onNotification(userId, cb) {
  const ch = supabase.channel(`notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      ({ new: r }) => cb({ id: r.id, athleteId: r.athlete_id, createdAt: r.created_at }))
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

/* ---------- Online (ποιοι αθλούμενοι έχουν ανοιχτή την εφαρμογή αυτή τη στιγμή) ---------- */

// Ο αθλούμενος δηλώνει «είμαι μέσα» στο κανάλι του προπονητή του.
export function announcePresence(coachId, athleteId) {
  const ch = supabase.channel(`presence:${coachId}`, { config: { presence: { key: athleteId } } });
  ch.subscribe((status) => { if (status === 'SUBSCRIBED') ch.track({ athleteId }); });
  return () => { supabase.removeChannel(ch); };
}

// Ο προπονητής βλέπει ποιοι είναι μέσα: cb(Set από athleteId).
export function watchPresence(coachId, cb) {
  const ch = supabase.channel(`presence:${coachId}`);
  ch.on('presence', { event: 'sync' }, () =>
    cb(new Set(Object.values(ch.presenceState()).flat().map((x) => x.athleteId))));
  ch.subscribe();
  return () => { supabase.removeChannel(ch); };
}

/* ---------- Αθλούμενοι ---------- */

const num = (v) => (v == null ? null : Number(v));

// owner: σε ποιον ανήκουν τα δεδομένα · coachId: ποιος προπονητής έχει πρόσβαση
// linked: ο φάκελος ανήκει στον ίδιο τον αθλούμενο (αποδέχτηκε πρόσκληση) και έχει προπονητή
const toAthlete = (r) => r && ({
  id: r.id, owner: r.owner, coachId: r.coach_id ?? null, name: r.name, self: r.self, age: num(r.age), height: num(r.height_cm),
  mergedIds: r.merged_ids ?? [], // φάκελοι φωτογραφιών παλιών αρχείων που ενώθηκαν σε αυτόν
  linked: !!r.coach_id && r.coach_id !== r.owner,
  consentConfirmedAt: r.consent_confirmed_at, clientConsentAt: r.client_consent_at, createdAt: r.created_at,
});

// Όσοι αθλούμενοι φαίνονται στον χρήστη (το RLS: δικοί του ή όσοι προπονεί).
export const listAthletes = async () =>
  check(await supabase.from('athletes').select('*').order('created_at')).map(toAthlete);

export const getAthlete = async (id) =>
  toAthlete(check(await supabase.from('athletes').select('*').eq('id', id).maybeSingle()));

// asCoach: ο προπονητής φτιάχνει φάκελο για αθλούμενο και κρατά πρόσβαση ως προπονητής.
export async function addAthlete(name, { self = false, asCoach = false, consentConfirmedAt = null, age = null, height = null } = {}) {
  const insert = { name: name.trim(), self, consent_confirmed_at: consentConfirmedAt };
  if (age != null) insert.age = age;
  if (height != null) insert.height_cm = height;
  if (asCoach) insert.coach_id = await currentUserId();
  const row = check(await supabase.from('athletes').insert(insert).select().single());
  return toAthlete(row);
}

// Αλλαγή στοιχείων αθλούμενου (ηλικία, ύψος).
export async function updateAthlete(id, { age, height }) {
  const patch = {};
  if (age !== undefined) patch.age = age;
  if (height !== undefined) patch.height_cm = height;
  return toAthlete(check(await supabase.from('athletes').update(patch).eq('id', id).select().single()));
}

/* ---------- Προπονητής ↔ αθλούμενος ---------- */
// Όλοι οι έλεγχοι (μοναδικός σύνδεσμος, μιας χρήσης, λήξη, email) γίνονται μέσα στη βάση.

export const createInvite = async (athleteId, email = '') =>
  check(await supabase.rpc('create_invite', { p_athlete: athleteId, p_email: email || null }));

export const revokeInvite = async (athleteId) =>
  check(await supabase.rpc('revoke_invite', { p_athlete: athleteId }));

// Οι προσκλήσεις του προπονητή (για να δείχνει «αναμένει αποδοχή» / «συνδέθηκε»).
export const listInvites = async () =>
  check(await supabase.from('invites').select('*').order('created_at', { ascending: false })).map((r) => ({
    id: r.id, token: r.token, athleteId: r.athlete_id, email: r.email, createdAt: r.created_at,
    expiresAt: r.expires_at, usedAt: r.used_at, usedEmail: r.used_email, revokedAt: r.revoked_at,
  }));

export async function inviteInfo(token) {
  const rows = check(await supabase.rpc('invite_info', { p_token: token }));
  const r = rows?.[0];
  return r && { status: r.status, coachName: r.coach_name, athleteName: r.athlete_name, emailLocked: r.email_locked };
}

// (Μετά από σύνδεση/αποσύνδεση ο φάκελος του χρήστη αλλάζει, οπότε ξεχνάμε τον αποθηκευμένο.)
export async function acceptInvite(token) {
  const r = check(await supabase.rpc('accept_invite', { p_token: token }));
  selfPending = null;
  return r;
}

export async function disconnectCoach(athleteId) {
  const r = check(await supabase.rpc('disconnect_coach', { p_athlete: athleteId }));
  selfPending = null;
  return r;
}

export async function getMyCoach() {
  const r = check(await supabase.rpc('get_my_coach'))?.[0];
  return r ? { athleteId: r.athlete_id, name: r.coach_name, since: r.since } : null;
}

// Ο προσωπικός λογαριασμός έχει πάντα έναν αθλούμενο: τον εαυτό του.
// (Κρατάμε την κλήση σε εξέλιξη ώστε δύο ταυτόχρονες κλήσεις να μη φτιάξουν δύο.)
let selfPending = null;
export function getSelfAthlete(user) {
  if (!selfPending) {
    selfPending = (async () => {
      const mine = () => supabase.from('athletes').select('*').eq('self', true).eq('owner', user.id);
      const found = check(await mine().maybeSingle());
      if (found) return toAthlete(found);
      try {
        return await addAthlete(user.name, { self: true });
      } catch (e) {
        // Το έφτιαξε ήδη άλλη καρτέλα (μοναδικός self ανά χρήστη στη βάση)
        if (e.code !== '23505') throw e;
        return toAthlete(check(await mine().single()));
      }
    })().finally(() => { selfPending = null; });
  }
  return selfPending;
}

export async function deleteAthlete(id) {
  const checkins = await listCheckins(id);
  // Πρώτα οι φωτογραφίες (μετά τη διαγραφή του φακέλου δεν θα είχαμε πια πρόσβαση στον φάκελό τους).
  await removePhotos(checkins.flatMap((c) => Object.values(c.photos)));
  const a = await getAthlete(id);
  for (const folder of [id, ...(a?.mergedIds ?? [])]) await removeFolder(folder);
  check(await supabase.from('athletes').delete().eq('id', id)); // οι καταγραφές σβήνονται μαζί
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

// Όλες οι καταγραφές του χρήστη με ένα αίτημα (το RLS επιστρέφει μόνο τις δικές του).
// Για τη λίστα του προπονητή, αντί για ένα αίτημα ανά αθλούμενο.
export const listAllCheckins = async () =>
  check(await supabase.from('checkins').select('*').order('date').order('created_at')).map(toCheckin);

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

// Όλο το βάρος του χρήστη με ένα αίτημα (για τη λίστα του προπονητή).
export const listAllWeighIns = async () =>
  check(await supabase.from('weigh_ins').select('*').order('date')).map(toWeighIn);

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

/* ---------- Καθημερινά ---------- */
// Μία γραμμή ανά αθλούμενο ανά ημέρα: θερμίδες, πρόγραμμα προπόνησης, βήματα, νερό (L).

const toDaily = (r) => ({
  id: r.id, athleteId: r.athlete_id, date: r.date, createdAt: r.created_at,
  calories: num(r.calories), workout: r.workout ?? '', steps: num(r.steps), water: num(r.water),
});

// Ταξινομημένα από το παλαιότερο στο νεότερο.
export const listDailyLogs = async (athleteId) =>
  check(await supabase.from('daily_logs').select('*').eq('athlete_id', athleteId).order('date')).map(toDaily);

const dailyRow = (v) => {
  const row = {};
  for (const k of ['date', 'calories', 'steps', 'water']) if (v[k] !== undefined) row[k] = v[k];
  if (v.workout !== undefined) row.workout = v.workout?.trim() || null;
  return row;
};

// Γράφει τις τιμές μιας ημέρας (αντικαθιστά ό,τι υπήρχε εκείνη τη μέρα).
export async function setDailyLog({ athleteId, date, calories = null, workout = '', steps = null, water = null }) {
  const row = { athlete_id: athleteId, ...dailyRow({ date, calories, workout, steps, water }) };
  check(await supabase.from('daily_logs').upsert(row, { onConflict: 'athlete_id,date' }));
}

export const updateDailyLog = async (id, patch) =>
  check(await supabase.from('daily_logs').update(dailyRow(patch)).eq('id', id));

export const deleteDailyLog = async (id) => check(await supabase.from('daily_logs').delete().eq('id', id));

/* ---------- Φωτογραφίες ---------- */
// Το "id" μιας φωτογραφίας είναι η διαδρομή της στο Storage: <user id>/<uuid>.jpg
// Δίπλα της υπάρχει και μικρή έκδοση:                           <user id>/<uuid>.thumb.jpg
// (Οι κάρτες και το αρχείο κατεβάζουν τη μικρή· μεγέθυνση και σύγκριση την κανονική.)

export const thumbPath = (path) => path.replace(/\.jpg$/, '.thumb.jpg');

const photoCache = new Map(); // 'full:διαδρομή' ή 'thumb:διαδρομή' → Promise<Blob | null>

const upload = (path, blob) =>
  supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });

// Ανεβάζει { full, thumb } (από processImage) και επιστρέφει τη διαδρομή της κανονικής.
// Οι νέες φωτογραφίες μπαίνουν στον φάκελο του αθλούμενου (<athlete id>/…), ώστε να τις
// βλέπουν και ο αθλούμενος και ο προπονητής του.
export async function addPhoto({ full, thumb }, athleteId) {
  const path = `${athleteId || (await currentUserId())}/${uuid()}.jpg`;
  check(await upload(path, full));
  photoCache.set('full:' + path, Promise.resolve(full));
  if (thumb) {
    // Αν αποτύχει η μικρή, δεν πειράζει: θα φτιαχτεί την πρώτη φορά που θα χρειαστεί.
    const { error } = await upload(thumbPath(path), thumb);
    if (!error) photoCache.set('thumb:' + path, Promise.resolve(thumb));
  }
  return path;
}

async function download(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  return error ? null : data;
}

// Η μικρή έκδοση· αν λείπει (παλιά φωτογραφία), τη φτιάχνει από την κανονική και την αποθηκεύει.
async function loadThumb(path) {
  const thumb = await download(thumbPath(path));
  if (thumb) return thumb;
  const full = await getPhoto(path, 'full');
  if (!full) return null;
  try {
    const made = await makeThumb(full);
    upload(thumbPath(path), made).catch(() => {});
    return made;
  } catch {
    return full;
  }
}

// size: 'full' (κανονική) ή 'thumb' (μικρή)
export function getPhoto(path, size = 'full') {
  const key = `${size}:${path}`;
  if (!photoCache.has(key)) {
    const p = (size === 'thumb' ? loadThumb(path) : download(path)).then((blob) => {
      if (!blob) photoCache.delete(key);
      return blob;
    });
    photoCache.set(key, p);
  }
  return photoCache.get(key);
}

// Σβήνει τις φωτογραφίες μαζί με τις μικρές τους εκδόσεις.
export async function removePhotos(paths) {
  const list = paths.filter(Boolean).flatMap((p) => [p, thumbPath(p)]);
  for (const p of paths.filter(Boolean)) {
    photoCache.delete('full:' + p);
    photoCache.delete('thumb:' + p);
  }
  for (let i = 0; i < list.length; i += 100) {
    check(await supabase.storage.from(BUCKET).remove(list.slice(i, i + 100)));
  }
}

export const removePhoto = (path) => removePhotos([path]);

/* ---------- Δικαιώματα χρήστη (GDPR) ---------- */
// Η λήψη δεδομένων (ZIP) είναι στο lib/exportZip.js.

// Οριστική διαγραφή: πρώτα όλες οι φωτογραφίες από το Storage,
// μετά ο λογαριασμός (προφίλ, αθλούμενοι, καταγραφές σβήνονται μαζί στη βάση).
// Σβήνει όλα τα αρχεία ενός φακέλου στο Storage.
async function removeFolder(folder) {
  let last = null;
  for (;;) {
    const files = check(await supabase.storage.from(BUCKET).list(folder, { limit: 1000 }));
    if (!files.length) break;
    // Αν δεν σβήστηκε τίποτα από τον προηγούμενο γύρο, σταματάμε αντί να κολλήσουμε.
    if (files[0].name === last) throw new Error('Δεν ήταν δυνατή η διαγραφή των φωτογραφιών.');
    last = files[0].name;
    await removePhotos(files.map((f) => `${folder}/${f.name}`));
  }
}

export async function deleteMyAccount() {
  const uid = await currentUserId();
  // Οι φάκελοι που ΑΝΗΚΟΥΝ στον χρήστη (δικός του, ή αθλούμενοι προπονητή χωρίς λογαριασμό).
  // Οι συνδεδεμένοι αθλούμενοι ενός προπονητή κρατούν τα δεδομένα τους.
  const owned = (await listAthletes()).filter((a) => a.owner === uid);
  for (const a of owned) {
    await removePhotos((await listCheckins(a.id)).flatMap((c) => Object.values(c.photos)));
    for (const folder of [a.id, ...a.mergedIds]) await removeFolder(folder);
  }
  await removeFolder(uid); // παλιές φωτογραφίες
  check(await supabase.rpc('delete_my_account'));
  photoCache.clear();
}
