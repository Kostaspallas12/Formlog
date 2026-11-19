// Η βάση «ξυπνάει» μία φορά τη μέρα (Vercel Cron, βλ. vercel.json): στο δωρεάν πλάνο το Supabase
// βάζει σε παύση το project αν δεν το χρησιμοποιήσει κανείς για περίπου μία εβδομάδα.
// Ένα μικρό ερώτημα αρκεί· οι κανόνες της βάσης δεν επιστρέφουν δεδομένα χωρίς σύνδεση.
// Αν στο Vercel υπάρχει CRON_SECRET, μόνο το Vercel Cron μπορεί να το καλέσει.

export const dynamic = 'force-dynamic';

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const res = await fetch(`${SUPA}/rest/v1/athletes?select=id&limit=1`, {
    headers: { apikey: KEY }, cache: 'no-store',
  }).catch(() => null);
  return Response.json({ ok: !!res?.ok }, { status: res?.ok ? 200 : 503 });
}
