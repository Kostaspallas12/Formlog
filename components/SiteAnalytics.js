'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Ανώνυμα στατιστικά επισκέψεων και ταχύτητας (Vercel Web Analytics / Speed Insights, χωρίς cookies).
// Στέλνεται μόνο η σελίδα, χωρίς ό,τι υπάρχει μετά το «?» ή το «#»: εκεί μπορεί να υπάρχουν
// κωδικοί από links επιβεβαίωσης / επαναφοράς κωδικού. Ο κωδικός της πρόσκλησης είναι μέσα στη
// διεύθυνση (/join/<κωδικός>), οπότε αντικαθίσταται κι αυτός.
const pageOnly = (event) => ({
  ...event,
  url: event.url.split(/[?#]/)[0].replace(/\/join\/[^/]+/, '/join/[token]'),
});

export default function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={pageOnly} />
      <SpeedInsights beforeSend={pageOnly} />
    </>
  );
}
