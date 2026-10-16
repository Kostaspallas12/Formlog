import { createClient } from '@supabase/supabase-js';

// «Να με θυμάσαι»: αν είναι τσεκαρισμένο, η σύνδεση κρατιέται στον browser και μετά το κλείσιμό του
// (localStorage). Αν όχι, κρατιέται μόνο όσο είναι ανοιχτός (sessionStorage) – για κοινόχρηστους υπολογιστές.
const REMEMBER_KEY = 'formlog:remember';

const rememberOn = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== '0';
  } catch {
    return true;
  }
};

export function setRemember(on) {
  try {
    localStorage.setItem(REMEMBER_KEY, on ? '1' : '0');
  } catch {}
}

const sessionStore = {
  getItem: (k) => {
    try {
      return (rememberOn() ? localStorage : sessionStorage).getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      (rememberOn() ? localStorage : sessionStorage).setItem(k, v);
    } catch {}
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    } catch {}
  },
};

// Ένας client για όλο το site. Τα στοιχεία έρχονται από το .env.local.
// Η συνεδρία ανανεώνεται αυτόματα. Οι σύνδεσμοι από τα email (επιβεβαίωση, επαναφορά κωδικού)
// διαβάζονται αυτόματα από το URL.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: sessionStore } }
);

// Το id του συνδεδεμένου χρήστη (από τη συνεδρία, χωρίς αίτημα στον server).
export async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('not authenticated');
  return id;
}
