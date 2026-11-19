// Η βάση «ξυπνάει» μία φορά τη μέρα (Vercel Cron, βλ. vercel.json): στο δωρεάν πλάνο το Supabase
// βάζει σε παύση το project αν δεν το χρησιμοποιήσει κανείς για περίπου μία εβδομάδα.
// Ένα μικρό ερώτημα αρκεί: χωρίς σύνδεση η βάση απαντά «δεν επιτρέπεται» (401), αλλά το ερώτημα
// έφτασε σε αυτήν, άρα μετράει ως κίνηση. Αποτυχία είναι μόνο το να μην απαντήσει (δίκτυο / 5xx).
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
  const ok = !!res && res.status < 500;
  return Response.json({ ok }, { status: ok ? 200 : 503 });
}
