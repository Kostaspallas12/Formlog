'use client';

import { Analytics } from '@vercel/analytics/next';

// Ανώνυμα στατιστικά επισκέψεων (Vercel Web Analytics, χωρίς cookies).
// Στέλνεται μόνο η σελίδα, χωρίς ό,τι υπάρχει μετά το «?» ή το «#»: εκεί μπορεί να υπάρχουν
// κωδικοί από links επιβεβαίωσης / επαναφοράς κωδικού.
export default function SiteAnalytics() {
  return <Analytics beforeSend={(event) => ({ ...event, url: event.url.split(/[?#]/)[0] })} />;
}
