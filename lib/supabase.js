import { createClient } from '@supabase/supabase-js';

// Ένας client για όλο το site. Τα στοιχεία έρχονται από το .env.local.
// Η συνεδρία κρατιέται στον browser και ανανεώνεται αυτόματα.
// Οι σύνδεσμοι από τα email (επιβεβαίωση, επαναφορά κωδικού) διαβάζονται αυτόματα από το URL.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

// Το id του συνδεδεμένου χρήστη (από τη συνεδρία, χωρίς αίτημα στον server).
export async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('not authenticated');
  return id;
}
